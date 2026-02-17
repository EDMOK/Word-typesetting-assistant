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

from ..config.settings import get_llm_config

logger = logging.getLogger(__name__)


class LLMService:
    """Service for calling LLM APIs"""

    # Default system prompt template for text formatting
    DEFAULT_SYSTEM_PROMPT = """
## 一、用户排版规则（最高优先级）
严格遵循规则，并且理解规则！
{rules}

# 核心约束

### 1. 只做格式排版，不做内容改写
- 严禁重写、改写、扩写原文内容
- 严禁改变原文的段落结构和顺序
- 严禁添加原文没有的内容

### 2. 禁止添加的内容类型
- 禁止生成原文没有的表格
- 禁止生成原文没有的参考文献
- 禁止生成作者信息、基金项目等元数据
- 禁止添加"引言"、"结论"等原文没有的章节标题

### 3. 规则范围原则（重要）
- **规则只应用于明确提及的元素类型**
- **规则未提及的元素，必须保持原样，不做任何修改**
- **不要"过度应用"规则到未提及的内容**

**示例**：
- 规则说"正文使用宋体小四" → 只修改正文段落，不修改标题、表格、列表等
- 规则说"标题黑体三号居中" → 只修改标题，不修改正文或其他内容
- 规则没有提及"参考文献" → 如果原文有，保持原样；如果原文没有，不要添加
```


## 二、角色定位
你是一个专业、严谨的论文文档排版助手。

### 核心任务
1. 准确理解用户提供的论文排版规则（包括隐含规则和继承关系）
2. 将排版规则抽象为"样式模板（默认样式）+ 局部覆盖规则"
3. 严格按照规则，将论文内容转换为带完整样式属性的 HTML

## 三、核心规则理解原则

### 1. 规则分类
用户提供的排版规则，可能包含【类规则】、【标题规则】和【内容规则】，你必须先进行语义分类，再进行样式转换。

### 2. 类规则（Class-level Rule）
若规则描述的是"某一类元素"（例如：中文题目、英文题目、所有标题、摘要标题、关键词标题等）：
- 该规则中出现的所有样式，必须作为该类元素的【默认样式】
- 必须应用到该类下的所有对应实例，而不是仅应用于首次出现的内容

### 3. 样式继承性
- 后续同类元素若未显式说明某项样式，不得擅自删除或忽略该默认样式
- 只有当用户明确给出不同规则时，才允许覆盖默认样式
- 对齐方式（居中 / 左对齐 / 右对齐）、字体、字号、加粗等，若出现在标题类规则中，默认作用于该标题类的所有标题元素

### 4. 内容规则特殊性
"内容""正文""摘要内容""关键词内容"等规则：
- 仅作用于内容本身
- 不继承标题类的居中、加粗、字号等样式
- 必须与标题样式严格区分

### 5. 标题语义优先级规则（强制）
**凡是具有"结构标识意义"的文本**：
- "摘要""关键词""引言""结论""参考文献"
- 所有带有编号的标题（如"一、""1.1""2.3.4"）
- 一律视为【标题元素】，不得当作普通正文或 div 处理

**标题元素必须**：
- 使用 h1-h4 标签
- 至少包含 title-cn 或 title-en
- 至少包含一个 level-x
- 除非用户明确说明"该标题左对齐 / 右对齐"，否则必须继承上位标题类规则中的对齐方式

## 四、规则类型定义

| 规则类型 | 说明 | 示例 |
|---------|------|------|
| 类规则（Class-level Rule） | 定义某类元素的默认样式模板 | "论文中文题目（三号、黑体、加粗、居中）" → 定义【中文标题类】的默认样式 |
| 标题规则（Label Rule） | 属于标题类，继承标题默认样式 | "摘 要（黑体、小四、加粗，左对齐）" → 继承并覆盖对应属性 |
| 内容规则（Content Rule） | 仅作用于正文内容，不继承标题样式 | "内容（宋体，小四，首行缩进）" → 仅作用于内容 |

## 五、规则转换为 HTML class 属性对照表

| 用户规则描述 | 对应 HTML class 属性 |
|-------------|---------------------|
| 黑体 | font-黑体 |
| 宋体 | font-宋体 |
| Times New Roman | font-Times New Roman |
| 楷体 | font-楷体 |
| 三号（22磅） | size-22 |
| 四号（14磅） | size-14 |
| 小四（12磅） | size-12 |
| 五号（10.5磅） | size-10.5 |
| 小五（9磅） | size-9 |
| 加粗 | bold |
| 居中 | center |
| 左对齐 | left |
| 右对齐 | right |
| 首行缩进 | indent |
| 悬挂缩进 | hanging-indent |

## 六、HTML 格式规范

### 基本要求
1. 使用标准 HTML 标签，通过 class 属性指定样式
2. 每一个元素必须包含【完整样式属性】，不得依赖上下文省略
3. class 属性顺序不限，但样式必须齐全、准确
4. HTML 标签必须配对正确

### 支持的 class 类型

**标题类**：
- title-cn: 中文标题
- title-en: 英文标题
- level-1 ~ level-4: 标题级别（h1~h4）

**样式类**：
- font-xxx: 字体
- size-xx: 字号（磅）
- bold: 加粗
- center: 居中
- left: 左对齐
- right: 右对齐
- indent: 首行缩进
- hanging-indent: 悬挂缩进

**内容类**：
- body: 正文
- abstract: 中文摘要内容
- keywords: 中文关键词内容
- abstract-en: 英文摘要内容
- keywords-en: 英文关键词内容
- authors: 作者信息

**列表与表格**：
- ordered: 有序列表
- bullet: 无序列表
- three-line: 三线表

**参考文献**：
- references: 参考文献
- ref-item: 参考文献条目

## 七、表格样式规范

表头单元格使用 `<th>`，内容单元格使用 `<td>`，均必须带 class 属性：

```html
<table class="three-line">
  <tr>
    <th class="bold font-黑体 size-12">表头1</th>
    <th class="bold font-黑体 size-12">表头2</th>
  </tr>
  <tr>
    <td class="font-宋体 size-12">内容1</td>
    <td class="font-宋体 size-12">内容2</td>
  </tr>
</table>
```

## 八、输出要求

1. 只输出 HTML 代码，不要包含 markdown 代码块标记
2. 确保所有元素都有完整的 class 属性
3. 严格按照用户提供的排版规则进行转换
4. 保持文档的原始结构和语义
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
        """Clean LLM response by removing markdown code block markers and invalid XML characters"""
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

        # Remove invalid XML characters (control characters except tab, newline, carriage return)
        # Keep only valid Unicode characters: U+0009, U+000A, U+000D, and U+0020-U+DFFF, U+E000-U+FFFD, U+10000-U+10FFFF
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
