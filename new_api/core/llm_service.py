"""
LLM Service - Call LLM APIs to generate styled HTML from text.
"""
import os
import re
import time
import json
import logging
from typing import AsyncGenerator, Dict, Any, Optional
from pathlib import Path

try:
    import openai
except ImportError:
    openai = None

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.settings import get_llm_config

logger = logging.getLogger(__name__)


class LLMService:
    """Service for calling LLM APIs"""

    # Default system prompt template for text formatting
    DEFAULT_SYSTEM_PROMPT = """
你是一个专业的HTML排版助手。请根据以下文档内容和排版规则，生成完整的HTML文档。

## 核心要求

### 1. 样式规范（重要）
- **所有样式必须写在元素的 style 属性中**（内联样式）
- **不使用 <style> 标签，不使用 class 属性**
- 标题使用 <h1> 到 <h6> 标签
- 段落使用 <p> 标签，首行缩进 2 字符（text-indent: 2em）
- 表格使用 <table> 标签，设置 border-collapse: collapse
- 列表使用 <ul> / <ol> 标签

### 2. 单位规范
- 字号使用 pt（磅）：四号=14pt, 小四=12pt, 五号=10.5pt
- 行距使用倍数：1.5倍行距 = line-height: 1.5

### 3. 禁止事项
- 严禁重写、改写、扩写原文内容
- 严禁改变原文的段落结构和顺序
- 严禁添加原文没有的内容（表格、参考文献等）
- 不要添加任何解释说明，只输出HTML代码

## 样式示例

**一级标题**（黑体、三号、加粗、居中）：
```html
<h1 style="font-family: 黑体; font-size: 22pt; font-weight: bold; text-align: center;">标题内容</h1>
```

**二级标题**（黑体、四号、加粗）：
```html
<h2 style="font-family: 黑体; font-size: 14pt; font-weight: bold;">标题内容</h2>
```

**正文段落**（宋体、小四、首行缩进）：
```html
<p style="font-family: 宋体; font-size: 12pt; text-indent: 2em; line-height: 1.5;">段落内容</p>
```

**三线表**：
```html
<table style="border-collapse: collapse; width: 100%; border-top: 2px solid black; border-bottom: 2px solid black;">
  <tr>
    <th style="font-family: 黑体; font-size: 12pt; font-weight: bold; border-bottom: 1px solid black;">表头</th>
  </tr>
  <tr>
    <td style="font-family: 宋体; font-size: 12pt;">内容</td>
  </tr>
</table>
```

## 用户排版规则
{rules}

## 输出要求
1. 返回完整的HTML文档（包含 <!DOCTYPE html>、<html>、<head>、<body>）
2. 所有样式使用内联 style 属性
3. 保持文档原始结构和语义
4. 不要包含 markdown 代码块标记
"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize LLM service with configuration"""
        self.config = config or get_llm_config().model_dump()
        self._client = None
        # 日志目录，仅用于本地开发调试，部署环境使用控制台输出
        self._log_dir = os.getenv("LOG_DIR", "logs")

    @property
    def client(self):
        """Lazy initialization of OpenAI client"""
        if self._client is None and openai is not None:
            self._client = openai.OpenAI(
                api_key=self.config.get("api_key", ""),
                base_url=self.config.get("base_url", "")
            )
        return self._client

    @property
    def system_prompt(self) -> str:
        """Get the system prompt template"""
        return self.DEFAULT_SYSTEM_PROMPT

    def _get_system_content(self, rules: str) -> str:
        """Generate system prompt with user rules"""
        return self.system_prompt.format(rules=rules)

    def _clean_html_response(self, content: str) -> str:
        """Clean LLM response by removing markdown code block markers and think tags"""
        if content is None:
            return ""

        # Remove various markdown code block patterns
        patterns = [
            r'^```html?\s*\n',
            r'^```\s*\n',
            r'\n```\s*$',
            r'^```\b',
            r'\b```$',
        ]

        cleaned = content
        for pattern in patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.MULTILINE)

        # Remove think tags (for reasoning models like DeepSeek)
        cleaned = re.sub(r'<think>.*?</think>', '', cleaned, flags=re.DOTALL)

        # Remove invalid XML characters
        cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', cleaned)

        return cleaned.strip()

    def _save_response(self, text: str, html: str) -> str:
        """Save LLM response to log file (local only) or return placeholder for cloud deployment"""
        # 在云部署环境下，LOG_DIR 可能为空或设为 /tmp
        if self._log_dir and self._log_dir != "logs":
            # 本地开发环境，保存到文件
            os.makedirs(self._log_dir, exist_ok=True)
            timestamp = int(time.time() * 1000)
            hash_value = hash(text) & 0xFFFFFFFF
            log_filename = os.path.join(self._log_dir, f"llm_response_{hash_value}_{timestamp}.html")

            with open(log_filename, 'w', encoding='utf-8') as f:
                f.write(html)

            return log_filename
        else:
            # 云部署环境：打印到控制台日志，不保存文件
            logger.info(f"LLM Response HTML (truncated): {html[:500]}...")
            return "cloud_logged"

    async def analyze(
        self,
        text: str,
        rules: str,
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Analyze text with LLM and generate styled HTML.

        Args:
            text: Input text to format
            rules: Formatting rules
            stream: Whether to use streaming response

        Yields:
            SSE formatted progress events
        """
        if openai is None:
            yield self._create_event("error", message="OpenAI client not available")
            return

        start_time = time.time()
        yield self._create_event("start", message="开始调用LLM分析...")

        try:
            system_content = self._get_system_content(rules)
            model = self.config.get("stream_model") if stream else self.config.get("non_stream_model")
            temperature = self.config.get("temperature", 0.3)

            messages = [
                {"role": "system", "content": system_content},
                {"role": "user", "content": f"请对以下文本进行排版：\n\n{text}"}
            ]

            if stream:
                async for event in self._stream_analysis(messages, model, temperature, start_time):
                    yield event
            else:
                async for event in self._non_stream_analysis(messages, model, temperature, start_time):
                    yield event

        except Exception as e:
            logger.exception("LLM analysis failed")
            yield self._create_event("error", message=str(e))

    async def _stream_analysis(
        self,
        messages: list,
        model: str,
        temperature: float,
        start_time: float
    ) -> AsyncGenerator[str, None]:
        """Handle streaming LLM response"""
        content_chunks = []
        chunk_count = 0

        response = self.client.chat.completions.create(
            model=model,
            temperature=temperature,
            messages=messages,
            stream=True
        )

        elapsed = time.time() - start_time
        yield self._create_event(
            "llm_receiving",
            message="LLM分析中...",
            chunks=chunk_count,
            elapsed=round(elapsed, 2)
        )

        for chunk in response:
            # 安全检查：确保 choices 不为空且有 content
            if not chunk.choices:
                continue
            choice = chunk.choices[0]
            if not choice or not choice.delta:
                continue
            if choice.delta.content is None:
                continue

            content_chunks.append(choice.delta.content)
            chunk_count += 1

            if chunk_count % 5 == 0:
                elapsed = time.time() - start_time
                yield self._create_event(
                    "llm_receiving",
                    message="LLM分析中...",
                    chunks=chunk_count,
                    elapsed=round(elapsed, 2)
                )

        content = ''.join(content_chunks)
        content = self._clean_html_response(content)

        elapsed = time.time() - start_time
        yield self._create_event("llm_done", message="LLM分析完成", elapsed=round(elapsed, 2))

        log_file = self._save_response(messages[1]["content"], content)

        yield self._create_event(
            "complete",
            message="分析完成",
            html=content,
            log_file=log_file
        )

    async def _non_stream_analysis(
        self,
        messages: list,
        model: str,
        temperature: float,
        start_time: float
    ) -> AsyncGenerator[str, None]:
        """Handle non-streaming LLM response"""
        response = self.client.chat.completions.create(
            model=model,
            temperature=temperature,
            messages=messages,
        )

        content = response.choices[0].message.content
        if content is None:
            raise ValueError("LLM返回内容为空")

        content = self._clean_html_response(content)
        log_file = self._save_response(messages[1]["content"], content)

        elapsed = time.time() - start_time
        yield self._create_event(
            "complete",
            message="分析完成",
            html=content,
            log_file=log_file,
            elapsed=round(elapsed, 2)
        )

    def _create_event(
        self,
        event_type: str,
        message: str = "",
        **kwargs
    ) -> str:
        """Create SSE event data"""
        data = {"type": event_type, "message": message, **kwargs}
        return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

    def analyze_sync(self, text: str, rules: str) -> Dict[str, Any]:
        """
        Synchronous analysis with LLM.

        Returns:
            Dict with success status, html content, and log file path
        """
        try:
            system_content = self._get_system_content(rules)
            model = self.config.get("non_stream_model")
            temperature = self.config.get("temperature", 0.3)

            messages = [
                {"role": "system", "content": system_content},
                {"role": "user", "content": f"请对以下文本进行排版：\n\n{text}"}
            ]

            response = self.client.chat.completions.create(
                model=model,
                temperature=temperature,
                messages=messages,
            )

            content = response.choices[0].message.content
            if content is None:
                raise ValueError("LLM返回内容为空")

            content = self._clean_html_response(content)
            log_file = self._save_response(text, content)

            return {
                "success": True,
                "html": content,
                "log_file": log_file
            }

        except Exception as e:
            logger.exception("Synchronous LLM analysis failed")
            return {
                "success": False,
                "error": str(e)
            }


# Global service instance
llm_service = LLMService()


def get_llm_service() -> LLMService:
    """Get the global LLM service instance"""
    return llm_service
