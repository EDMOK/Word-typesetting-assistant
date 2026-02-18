"""
HTML Service - 处理LLM生成的HTML，提供后处理和Word兼容支持。
替代原来的 word_service.py
"""
import os
import re
from typing import Dict, Any, Optional, Tuple


class HTMLPostProcessor:
    """HTML后处理器 - 来自 word-to-html-tool"""
    
    @staticmethod
    def ensure_complete_html(html_content: str) -> str:
        """确保HTML文档结构完整"""
        html_content = html_content.replace("```html", "").replace("```", "").strip()
        
        if html_content.lower().startswith("<!doctype") or html_content.lower().startswith("<html"):
            return html_content
        
        return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>转换后的文档</title>
</head>
<body>
{html_content}
</body>
</html>"""
    
    @staticmethod
    def add_default_styles(html_content: str) -> str:
        """添加默认样式以确保Word兼容性"""
        if '<body' not in html_content:
            return html_content
        
        body_match = re.search(r'<body([^>]*)>', html_content, re.IGNORECASE)
        if body_match:
            existing_attrs = body_match.group(1)
            if 'style=' not in existing_attrs:
                html_content = html_content.replace(
                    body_match.group(0),
                    f'<body{existing_attrs} style="font-family: SimSun, serif; font-size: 12pt; line-height: 1.5;">',
                    1
                )
        
        return html_content
    
    @staticmethod
    def process_tables(html_content: str) -> str:
        """处理表格样式以确保Word兼容性(三线表)"""
        pattern = r'<table([^>]*)>'
        replacement = r'<table\1 style="border-collapse: collapse; width: 100%;">'
        return re.sub(pattern, replacement, html_content, flags=re.IGNORECASE)
    
    @staticmethod
    def validate(html_content: str) -> Tuple[bool, list]:
        """简单验证HTML完整性"""
        errors = []
        html_lower = html_content.lower()
        
        if "<html>" not in html_lower and "<html " not in html_lower:
            errors.append("缺少<html>标签")
        
        if "<body>" not in html_lower and "<body " not in html_lower:
            errors.append("缺少<body>标签")
        
        if "<head>" not in html_lower and "<head " not in html_lower:
            errors.append("缺少<head>标签")
        
        if html_content.count("<table") != html_content.count("</table>"):
            errors.append("<table>标签未正确闭合")
        
        if html_content.count("<tr") != html_content.count("</tr>"):
            errors.append("<tr>标签未正确闭合")
        
        return len(errors) == 0, errors
    
    @classmethod
    def process(cls, html_content: str) -> str:
        """完整的后处理流程"""
        html = cls.ensure_complete_html(html_content)
        html = cls.add_default_styles(html)
        html = cls.process_tables(html)
        return html
    
    @staticmethod
    def prepare_for_word(html_content: str) -> str:
        """准备HTML内容用于Word下载，添加Word特定的META标签"""
        word_meta = """<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15">
<meta name=Originator content="Microsoft Word 15">"""
        
        if '<head>' in html_content:
            html_content = html_content.replace('<head>', f'<head>\n    {word_meta}')
        
        return html_content


class HTMLService:
    """HTML服务 - 处理HTML生成和后处理"""
    
    def __init__(self):
        self.processor = HTMLPostProcessor()
    
    def process_html(self, html_content: str) -> Tuple[str, bool, list]:
        """
        处理HTML内容
        
        Args:
            html_content: LLM生成的原始HTML
        
        Returns:
            tuple: (处理后的HTML, 是否有效, 错误列表)
        """
        processed = self.processor.process(html_content)
        is_valid, errors = self.processor.validate(processed)
        return processed, is_valid, errors
    
    def prepare_for_word_download(self, html_content: str) -> str:
        """
        准备HTML用于Word下载（添加META标签）
        
        Args:
            html_content: HTML内容
        
        Returns:
            添加Word META标签的HTML
        """
        return self.processor.prepare_for_word(html_content)
    
    def save_html(self, html_content: str, output_path: str) -> bool:
        """
        保存HTML到文件
        
        Args:
            html_content: HTML内容
            output_path: 输出文件路径
        
        Returns:
            bool: 是否保存成功
        """
        try:
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            return True
        except Exception as e:
            print(f"[ERROR] Failed to save HTML: {e}")
            return False


# 便捷函数
def process_html(html_content: str) -> Tuple[str, bool, list]:
    """处理HTML内容的便捷函数"""
    service = HTMLService()
    return service.process_html(html_content)


def prepare_for_word_download(html_content: str) -> str:
    """准备HTML用于Word下载的便捷函数"""
    service = HTMLService()
    return service.prepare_for_word_download(html_content)
