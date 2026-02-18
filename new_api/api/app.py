"""
FastAPI Application - REST API for document formatting services.
Modified to use word-to-html-tool workflow: Word -> HTML with inline styles
"""
import os
import sys
import json
import logging
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.settings import get_app_config
from models.schemas import (
    FormatRequest,
    FormatResponse,
    HealthResponse,
)
from core.llm_service import get_llm_service
from core.html_service import HTMLService, prepare_for_word_download
from utils.file_utils import (
    decode_file_content,
    extract_text_from_docx,
    cleanup_temp_file,
)

# Configure logging for cloud deployment - output to console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Version info
__version__ = "2.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    yield
    # No persistent directories needed - we return HTML directly


def create_app(
    title: str = "Word2HTML API",
    description: str = "Convert Word documents to formatted HTML using LLM",
    version: str = __version__,
    debug: bool = False
) -> FastAPI:
    """
    Create and configure the FastAPI application.
    """
    app = FastAPI(
        title=title,
        description=description,
        version=version,
        lifespan=lifespan,
        debug=debug
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # HTML service instance
    html_service = HTMLService()

    # Root endpoint - API info
    @app.get("/")
    async def root():
        """API root endpoint"""
        return {
            "name": "Word2HTML API",
            "version": __version__,
            "description": "Convert Word documents to formatted HTML using LLM",
            "endpoints": {
                "health": "/health",
                "format_stream": "/format/stream",
                "format_text": "/format/text",
                "format_file": "/format/file",
                "download_word": "/download/word"
            }
        }

    # Health check
    @app.get("/health", response_model=HealthResponse, tags=["Health"])
    async def health_check():
        """Check API health status"""
        return HealthResponse(
            status="healthy",
            version=__version__,
            services={
                "llm": "ready",
                "html_processor": "ready"
            }
        )



    # Main formatting endpoint with streaming - returns HTML
    @app.post("/format/stream", tags=["Formatting"])
    async def format_text_stream(
        file: Optional[UploadFile] = File(None),
        text: str = Form(""),
        rules: str = Form("默认：标题黑体二号居中，正文宋体小四首行缩进")
    ):
        """
        Format text with streaming response (SSE).
        Returns processed HTML with inline styles.
        """
        # Handle file upload
        if file and file.filename:
            content = await file.read()
            filename = file.filename or "unknown.txt"
            file_ext = filename.split('.')[-1].lower() if '.' in filename else 'txt'

            if file_ext in ['docx', 'doc']:
                import tempfile
                with tempfile.NamedTemporaryFile(suffix=f'.{file_ext}', delete=False) as tmp:
                    tmp.write(content)
                    tmp_path = tmp.name
                try:
                    extracted_text = extract_text_from_docx(tmp_path)
                    os.remove(tmp_path)
                    text = extracted_text
                except ValueError as e:
                    os.remove(tmp_path)
                    return StreamingResponse(
                        iter([json.dumps({"type": "error", "message": f"读取Word文档失败: {str(e)}"})]),
                        media_type="text/event-stream"
                    )
                except Exception as e:
                    os.remove(tmp_path)
                    return StreamingResponse(
                        iter([json.dumps({"type": "error", "message": f"读取Word文档时发生错误: {str(e)}"})]),
                        media_type="text/event-stream"
                    )
            else:
                text = decode_file_content(content)

        if not text or not text.strip():
            return StreamingResponse(
                iter([json.dumps({"type": "error", "message": "请输入文本或上传文件"})]),
                media_type="text/event-stream"
            )

        async def generate_stream():
            llm_service = get_llm_service()

            yield json.dumps({"type": "start", "message": "开始处理..."}) + "\n\n"

            html_content = None

            try:
                # LLM analysis
                async for event in llm_service.analyze(text, rules, stream=True):
                    yield event
                    # Extract HTML from complete event
                    if '"type": "complete"' in event or '"type": "llm_done"' in event:
                        try:
                            event_str = event.strip()
                            if event_str.startswith("data:"):
                                event_str = event_str[5:].strip()
                            data = json.loads(event_str)
                            html_content = data.get("html") or html_content
                            if html_content and '"type": "complete"' in event:
                                break
                        except (json.JSONDecodeError, IndexError) as e:
                            logger.warning(f"解析SSE事件失败: {e}, event: {event[:100]}")
                            continue

                if not html_content:
                    yield f"data: {json.dumps({'type': 'error', 'message': '未能获取LLM生成的HTML内容'}, ensure_ascii=False)}\n\n"
                    return

                # Post-process HTML (word-to-html-tool style)
                yield f"data: {json.dumps({'type': 'parsing', 'message': '正在解析排版结果...'}, ensure_ascii=False)}\n\n"
                
                processed_html, is_valid, errors = html_service.process_html(html_content)
                
                yield f"data: {json.dumps({
                    'type': 'complete',
                    'message': '生成成功',
                    'html': processed_html,
                    'valid': is_valid,
                    'errors': errors
                }, ensure_ascii=False)}\n\n"

            except Exception as e:
                logger.exception("Formatting failed")
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    # Non-streaming formatting endpoint - returns HTML
    @app.post("/format/text", tags=["Formatting"])
    async def format_text(request: FormatRequest):
        """
        Format text (non-streaming).
        Returns processed HTML with inline styles.
        """
        llm_service = get_llm_service()

        try:
            # LLM analysis
            result = llm_service.analyze_sync(request.text, request.rules)
            if not result.get("success"):
                raise ValueError(result.get("error", "LLM调用失败"))

            html = result["html"]

            # Post-process HTML
            processed_html, is_valid, errors = html_service.process_html(html)

            return {
                "success": True,
                "message": "生成成功",
                "html": processed_html,
                "valid": is_valid,
                "errors": errors
            }

        except Exception as e:
            logger.exception("Formatting failed")
            return {"success": False, "message": str(e)}

    # File upload formatting endpoint - returns HTML
    @app.post("/format/file", tags=["Formatting"])
    async def format_file(
        file: UploadFile = File(...),
        rules: str = Form("默认：标题黑体二号居中，正文宋体小四首行缩进")
    ):
        """
        Format uploaded file.
        Returns processed HTML with inline styles.
        """
        import tempfile

        try:
            content = await file.read()
            file_size = len(content)

            if file_size == 0:
                return {"success": False, "message": f"文件内容为空: {file.filename}"}

            filename = file.filename or "unknown.txt"
            file_ext = filename.split('.')[-1].lower() if '.' in filename else 'txt'
            text = None

            # Extract text from DOCX
            if file_ext in ['docx', 'doc']:
                with tempfile.NamedTemporaryFile(suffix=f'.{file_ext}', delete=False) as tmp:
                    tmp.write(content)
                    tmp_path = tmp.name
                try:
                    text = extract_text_from_docx(tmp_path)
                except ValueError as e:
                    cleanup_temp_file(tmp_path)
                    return {"success": False, "message": f"读取Word文档失败: {str(e)}"}
                except Exception as e:
                    cleanup_temp_file(tmp_path)
                    return {"success": False, "message": f"读取Word文档时发生错误: {str(e)}"}
                finally:
                    cleanup_temp_file(tmp_path)

            # Fallback to text decoding
            if text is None:
                text = decode_file_content(content)

            if not text or text.strip() == '':
                return {"success": False, "message": f"文件解码后内容为空: {filename}"}

            # Process with LLM
            llm_service = get_llm_service()
            result = llm_service.analyze_sync(text, rules)

            if not result.get("success"):
                raise ValueError(result.get("error", "LLM调用失败"))

            html = result["html"]

            # Post-process HTML
            processed_html, is_valid, errors = html_service.process_html(html)

            return {
                "success": True,
                "message": "生成成功",
                "html": processed_html,
                "valid": is_valid,
                "errors": errors
            }

        except Exception as e:
            logger.exception("File formatting failed")
            return {"success": False, "message": str(e)}

    # Download HTML as Word-compatible file (.doc)
    @app.post("/download/word", tags=["Files"])
    async def download_word(
        html: str = Form(...),
        filename: str = Form("document.doc")
    ):
        """
        Download HTML as Word-compatible file.
        Adds Word META tags and returns as .doc file.
        """
        try:
            # Add Word-specific META tags
            word_html = prepare_for_word_download(html)
            
            # Save to temp file
            import tempfile
            temp_path = os.path.join(tempfile.gettempdir(), filename)
            with open(temp_path, 'w', encoding='utf-8') as f:
                f.write(word_html)
            
            return FileResponse(
                path=temp_path,
                filename=filename,
                media_type="application/msword"
            )
        except Exception as e:
            logger.error(f"Download error: {e}")
            raise HTTPException(status_code=500, detail="下载失败")

    return app


# Create default app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    config = get_app_config()
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "new_api.api.app:app",
        host="0.0.0.0",
        port=port,
        reload=config.debug
    )
