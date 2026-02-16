"""
FastAPI Application - REST API for document formatting services.
"""
import os
import sys
import json
import logging
import asyncio
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from fastapi.encoders import jsonable_encoder

from ..config.settings import get_app_config
from ..models.schemas import (
    FormatRequest,
    FormatResponse,
    StreamEvent,
    HealthResponse,
)
from ..core.llm_service import get_llm_service
from ..core.html_parser import parse_html_elements
from ..core.word_service import create_word_document, save_document
from ..utils.file_utils import (
    decode_file_content,
    extract_text_from_docx,
    generate_output_path,
    cleanup_temp_file,
    cleanup_old_outputs,
)

# Configure logging for cloud deployment - output to console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Version info
__version__ = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    config = get_app_config()
    # Only create directories in local development (when paths are relative)
    if not config.output_dir.startswith('/') and not config.output_dir.startswith('C:'):
        os.makedirs(config.output_dir, exist_ok=True)
    if not config.upload_dir.startswith('/') and not config.upload_dir.startswith('C:'):
        os.makedirs(config.upload_dir, exist_ok=True)
    if not config.log_dir.startswith('/') and not config.log_dir.startswith('C:'):
        os.makedirs(config.log_dir, exist_ok=True)

    # Start background cleanup task
    cleanup_task = None
    if config.output_dir.startswith('/') or config.output_dir.startswith('C:'):
        # Cloud deployment - run cleanup periodically
        cleanup_task = asyncio.create_task(periodic_cleanup(config.output_dir))

    yield

    # Shutdown
    if cleanup_task:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass


# Global cleanup state for frontend to query
cleanup_state = {"last_cleanup": None, "files_deleted": 0, "next_cleanup": None}


async def periodic_cleanup(output_dir: str, hours: int = 0, minutes: int = 10):
    """
    Periodically clean up old output files.

    Args:
        output_dir: Directory to clean
        hours: Delete files older than this many hours (mutually exclusive with minutes)
        minutes: Delete files older than this many minutes (default: 10)
    """
    interval = 600  # 10 minutes
    threshold_seconds = minutes * 60

    while True:
        try:
            await asyncio.sleep(interval)
            deleted = cleanup_old_outputs(output_dir, hours, threshold_seconds)
            cleanup_state["last_cleanup"] = asyncio.get_event_loop().time()
            cleanup_state["files_deleted"] = deleted
            cleanup_state["next_cleanup"] = cleanup_state["last_cleanup"] + interval
            if deleted > 0:
                logger.info(f"Cleanup: deleted {deleted} old output files")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Cleanup error: {e}")


def create_app(
    title: str = "Text2Doc API",
    description: str = "Convert text to formatted Word documents using LLM",
    version: str = __version__,
    debug: bool = False
) -> FastAPI:
    """
    Create and configure the FastAPI application.

    Args:
        title: API title
        description: API description
        version: API version
        debug: Debug mode

    Returns:
        Configured FastAPI application
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

    # Mount static directories (only for local development)
    config = get_app_config()

    # Check if running in cloud deployment (no local filesystem)
    is_cloud = os.getenv("CLOUD_DEPLOYMENT", "false").lower() == "true"

    if not is_cloud:
        # Local development: mount static files
        app.mount("/outputs", StaticFiles(directory=os.path.abspath(config.output_dir)), name="outputs")

    # Health check
    @app.get("/health", response_model=HealthResponse, tags=["Health"])
    async def health_check():
        """Check API health status"""
        return HealthResponse(
            status="healthy",
            version=__version__,
            services={
                "llm": "ready",
                "html_parser": "ready",
                "word_service": "ready"
            }
        )

    # Cleanup status endpoint
    @app.get("/cleanup-status", tags=["System"])
    async def get_cleanup_status():
        """Get automatic cleanup status"""
        import time
        return {
            "cleanup_interval_minutes": 10,
            "file_age_threshold_minutes": 10,
            "last_cleanup_time": cleanup_state.get("last_cleanup"),
            "files_deleted_last_run": cleanup_state.get("files_deleted", 0),
            "next_cleanup_in_seconds": max(0, int(cleanup_state.get("next_cleanup", 0) - time.time())) if cleanup_state.get("next_cleanup") else None
        }

    # Main formatting endpoint with streaming
    @app.post("/format/stream", tags=["Formatting"])
    async def format_text_stream(
        file: Optional[UploadFile] = File(None),
        text: str = Form(""),
        rules: str = Form("默认：标题黑体二号居中，正文宋体小四首行缩进")
    ):
        """
        Format text with streaming response (SSE).

        Supports both raw text input and file upload.
        """
        # Handle file upload
        if file and file.filename:
            content = await file.read()
            file_ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'txt'

            # Extract text from DOCX
            if file_ext in ['docx', 'doc']:
                import tempfile
                with tempfile.NamedTemporaryFile(suffix=f'.{file_ext}', delete=False) as tmp:
                    tmp.write(content)
                    tmp_path = tmp.name
                try:
                    extracted_text = extract_text_from_docx(tmp_path)
                    os.remove(tmp_path)
                    text = extracted_text
                except Exception as e:
                    os.remove(tmp_path)
                    text = decode_file_content(content)
            else:
                text = decode_file_content(content)

        if not text or not text.strip():
            return StreamingResponse(
                iter([json.dumps({"type": "error", "message": "请输入文本或上传文件"})]),
                media_type="text/event-stream"
            )

        async def generate_stream():
            llm_service = get_llm_service()
            config = get_app_config()

            yield json.dumps({"type": "start", "message": "开始处理..."}) + "\n\n"

            html_content = None

            try:
                # LLM analysis
                async for event in llm_service.analyze(text, rules, stream=True):
                    yield event
                    # Extract HTML from complete event
                    if '"type": "complete"' in event or '"type": "llm_done"' in event:
                        try:
                            # 解析 SSE 事件
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

                # Parse HTML
                if not html_content:
                    yield f"data: {json.dumps({'type': 'error', 'message': '未能获取LLM生成的HTML内容'}, ensure_ascii=False)}\n\n"
                    return

                elements = parse_html_elements(html_content)
                if not elements:
                    yield f"data: {json.dumps({'type': 'error', 'message': 'HTML解析后未找到有效元素'}, ensure_ascii=False)}\n\n"
                    return

                # Generate Word document
                doc = create_word_document(elements, rules)

                is_cloud = os.getenv("CLOUD_DEPLOYMENT", "false").lower() == "true"

                if is_cloud:
                    # Cloud deployment: return document as base64 in stream
                    import base64
                    buffer = save_document(doc)  # Returns BytesIO
                    doc_bytes = buffer.getvalue()
                    doc_base64 = base64.b64encode(doc_bytes).decode('utf-8')
                    yield f"data: {json.dumps({
                        'type': 'complete',
                        'message': '生成成功',
                        'document_base64': doc_base64,
                        'filename': 'formatted_document.docx'
                    }, ensure_ascii=False)}\n\n"
                else:
                    # Local development: save to file
                    output_filename, output_path = generate_output_path(text, config.output_dir)

                    if save_document(doc, output_path):
                        yield f"data: {json.dumps({
                            'type': 'complete',
                            'message': '生成成功',
                            'download_url': f'/outputs/{output_filename}'
                        }, ensure_ascii=False)}\n\n"
                    else:
                        yield f"data: {json.dumps({'type': 'error', 'message': '文档保存失败'}, ensure_ascii=False)}\n\n"

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

    # Non-streaming formatting endpoint
    @app.post("/format/text", tags=["Formatting"])
    async def format_text(request: FormatRequest):
        """
        Format text (non-streaming).

        Returns file directly or download URL.
        """
        import base64

        llm_service = get_llm_service()
        config = get_app_config()
        is_cloud = os.getenv("CLOUD_DEPLOYMENT", "false").lower() == "true"

        try:
            # LLM analysis
            result = llm_service.analyze_sync(request.text, request.rules)
            if not result.get("success"):
                raise ValueError(result.get("error", "LLM调用失败"))

            html = result["html"]

            # Parse HTML
            elements = parse_html_elements(html)
            if not elements:
                raise ValueError("HTML解析后未找到有效元素")

            # Generate Word document
            doc = create_word_document(elements, request.rules)

            if is_cloud:
                # Cloud deployment: return document as base64
                buffer = save_document(doc)  # Returns BytesIO
                doc_bytes = buffer.getvalue()
                doc_base64 = base64.b64encode(doc_bytes).decode('utf-8')

                return {
                    "success": True,
                    "message": "生成成功",
                    "document_base64": doc_base64,
                    "filename": "formatted_document.docx"
                }
            else:
                # Local development: save to file
                output_filename, output_path = generate_output_path(request.text, config.output_dir)
                save_document(doc, output_path)

                return FormatResponse(
                    success=True,
                    message="生成成功",
                    download_url=f"/outputs/{output_filename}"
                )

        except Exception as e:
            logger.exception("Formatting failed")
            return FormatResponse(success=False, message=str(e))

    # File upload formatting endpoint
    @app.post("/format/file", tags=["Formatting"])
    async def format_file(
        file: UploadFile = File(...),
        rules: str = Form("默认：标题黑体二号居中，正文宋体小四首行缩进")
    ):
        """
        Format uploaded file.

        Supports .txt, .docx, .doc files.
        """
        import tempfile
        import base64

        config = get_app_config()
        is_cloud = os.getenv("CLOUD_DEPLOYMENT", "false").lower() == "true"

        try:
            content = await file.read()
            file_size = len(content)

            if file_size == 0:
                return FormatResponse(success=False, message=f"文件内容为空: {file.filename}")

            file_ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'txt'
            text = None

            # Extract text from DOCX
            if file_ext in ['docx', 'doc']:
                with tempfile.NamedTemporaryFile(suffix=f'.{file_ext}', delete=False) as tmp:
                    tmp.write(content)
                    tmp_path = tmp.name
                try:
                    text = extract_text_from_docx(tmp_path)
                except Exception:
                    pass
                finally:
                    cleanup_temp_file(tmp_path)

            # Fallback to text decoding
            if text is None:
                text = decode_file_content(content)

            if not text or text.strip() == '':
                return FormatResponse(success=False, message="文件解码后内容为空")

            # Process with text formatting
            llm_service = get_llm_service()
            result = llm_service.analyze_sync(text, rules)

            if not result.get("success"):
                raise ValueError(result.get("error", "LLM调用失败"))

            html = result["html"]
            elements = parse_html_elements(html)

            if not elements:
                raise ValueError("HTML解析后未找到有效元素")

            doc = create_word_document(elements, rules)

            if is_cloud:
                # Cloud deployment: return document as base64
                buffer = save_document(doc)
                doc_bytes = buffer.getvalue()
                doc_base64 = base64.b64encode(doc_bytes).decode('utf-8')

                return {
                    "success": True,
                    "message": "生成成功",
                    "document_base64": doc_base64,
                    "filename": "formatted_document.docx"
                }
            else:
                # Local development: save to file
                output_filename, output_path = generate_output_path(text, config.output_dir)
                save_document(doc, output_path)

                return FormatResponse(
                    success=True,
                    message="生成成功",
                    download_url=f"/outputs/{output_filename}"
                )

        except Exception as e:
            logger.exception("File formatting failed")
            return FormatResponse(success=False, message=str(e))

    # Download output file
    @app.get("/download/{filename}", tags=["Files"])
    async def download_file(filename: str):
        """
        Download generated file.

        Args:
            filename: Name of the file to download
        """
        config = get_app_config()
        file_path = os.path.join(config.output_dir, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="文件不存在")

        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    return app


# Create default app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    config = get_app_config()
    # 支持环境变量 PORT（Render 会设置这个）
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "new_api.api.app:app",
        host="0.0.0.0",
        port=port,
        reload=config.debug
    )
