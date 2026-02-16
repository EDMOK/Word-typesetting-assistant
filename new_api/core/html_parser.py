"""
HTML Parser Service - Parse styled HTML into structured document elements.
"""
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional


class StyleParser:
    """Parse HTML class attributes to extract styling information"""

    @staticmethod
    def parse_classes(class_str: str) -> Dict[str, Any]:
        """
        Parse class string into style dictionary.

        Args:
            class_str: HTML class attribute string

        Returns:
            Dictionary containing font, size, bold, alignment, etc.
        """
        if not class_str:
            return {}

        styles = {
            "font": "宋体",
            "size": 12,
            "bold": False,
            "alignment": "left",
            "line_spacing": None,
            "indent": False,
            "hanging_indent": False,
            "left_indent": None,
            "right_indent": None,
        }

        classes = class_str.split() if isinstance(class_str, str) else class_str

        for cls in classes:
            # Font family
            if cls.startswith("font-"):
                styles["font"] = cls[5:]
            # Font size
            elif cls.startswith("size-"):
                try:
                    styles["size"] = float(cls[5:])
                except ValueError:
                    pass
            # Bold
            elif cls == "bold":
                styles["bold"] = True
            # Alignment
            elif cls in ("center", "left", "right"):
                styles["alignment"] = cls
            # Line spacing
            elif cls.startswith("line-"):
                try:
                    styles["line_spacing"] = float(cls[5:])
                except ValueError:
                    pass
            # First line indent
            elif cls == "indent":
                styles["indent"] = True
            # Hanging indent
            elif cls == "hanging-indent":
                styles["hanging_indent"] = True
            # Left indent
            elif cls.startswith("left-indent-"):
                try:
                    styles["left_indent"] = float(cls[12:])
                except ValueError:
                    pass
            # Right indent
            elif cls.startswith("right-indent-"):
                try:
                    styles["right_indent"] = float(cls[12:])
                except ValueError:
                    pass

        return styles

    @staticmethod
    def get_title_style(level: int, class_str: str) -> Dict[str, Any]:
        """
        Get styles for heading elements.

        Args:
            level: Heading level (1-4)
            class_str: HTML class attribute string

        Returns:
            Dictionary containing title-specific styles
        """
        styles = StyleParser.parse_classes(class_str)

        # Default heading sizes
        size_map = {1: 22, 2: 16, 3: 14, 4: 12}
        if not class_str or "size-" not in class_str:
            styles["size"] = size_map.get(level, 12)

        # Default heading font
        if "font-" not in class_str:
            styles["font"] = "黑体"

        # Default heading bold
        if "bold" not in class_str:
            styles["bold"] = True

        # Default level 1 heading centered
        if level == 1 and "center" not in class_str and "left" not in class_str and "right" not in class_str:
            styles["alignment"] = "center"

        return styles

    @staticmethod
    def get_body_style(class_str: str) -> Dict[str, Any]:
        """
        Get styles for body/paragraph elements.

        Args:
            class_str: HTML class attribute string

        Returns:
            Dictionary containing body-specific styles
        """
        return StyleParser.parse_classes(class_str)


class HTMLParser:
    """
    HTML Parser - Convert styled HTML to structured document elements.
    """

    def __init__(self, html: str, parser: str = 'lxml'):
        """
        Initialize parser with HTML content.

        Args:
            html: HTML string to parse
            parser: BeautifulSoup parser to use ('lxml', 'html.parser', 'html5lib')
        """
        self.html = html
        self.soup = BeautifulSoup(html, parser)

    def parse(self) -> Dict[str, Any]:
        """
        Parse HTML into structured data.

        Returns:
            Dictionary with 'title' and 'elements' keys
        """
        result = {
            "title": "",
            "elements": []
        }

        # Parse body or root element
        body = self.soup.find('body')
        root = body if body else self.soup

        for child in root.children:
            if child.name is None:
                continue  # Skip text nodes

            element = self._parse_element(child)
            if element:
                result["elements"].append(element)

        return result

    def _parse_element(self, tag) -> Optional[Dict[str, Any]]:
        """
        Parse a single HTML element.

        Args:
            tag: BeautifulSoup tag element

        Returns:
            Element dictionary or None if not parseable
        """
        if tag.name is None:
            return None

        tag_name = tag.name.lower()
        class_str = tag.get('class', '')
        if isinstance(class_str, list):
            class_str = ' '.join(class_str)

        styles = StyleParser.parse_classes(class_str)

        # Headings (h1-h4)
        if tag_name in ('h1', 'h2', 'h3', 'h4'):
            level = int(tag_name[1])
            title_styles = StyleParser.get_title_style(level, class_str)
            return {
                "type": "heading",
                "level": level,
                "text": tag.get_text(strip=True),
                **title_styles
            }

        # Paragraphs
        elif tag_name == 'p':
            text = tag.get_text(strip=True)

            # Keywords check
            if class_str and 'keywords' in class_str:
                keywords = [k.strip() for k in text.replace('关键词：', '').replace('关键词:', '').split('；')]
                if len(keywords) == 1 and '；' not in text:
                    keywords = [k.strip() for k in text.replace('关键词：', '').replace('关键词:', '').split(';')]
                return {
                    "type": "keywords",
                    "keywords": keywords,
                    **styles
                }

            return {
                "type": "paragraph",
                "text": text,
                **styles
            }

        # Lists (ul/ol)
        elif tag_name in ('ul', 'ol'):
            items = []
            for li in tag.find_all('li', recursive=False):
                items.append(li.get_text(strip=True))

            list_type = "unordered" if tag_name == 'ul' else "ordered"

            # Bullet style from class
            bullet = "•"
            if class_str:
                if "bullet-●" in class_str:
                    bullet = "●"
                elif "bullet--" in class_str:
                    bullet = "-"

            return {
                "type": "list",
                "style": list_type,
                "items": items,
                "bullet": bullet,
                **styles
            }

        # Tables
        elif tag_name == 'table':
            rows = []
            headers = []

            for tr in tag.find_all('tr', recursive=False):
                cells = []
                for td in tr.find_all(['td', 'th'], recursive=False):
                    cells.append(td.get_text(strip=True))

                if tr.find('th', recursive=False):
                    headers = cells
                elif cells:
                    rows.append(cells)

            is_three_line = class_str and 'three-line' in class_str

            return {
                "type": "table",
                "headers": headers,
                "rows": rows,
                "style": "三线表" if is_three_line else "网格表"
            }

        # Blockquotes
        elif tag_name == 'blockquote':
            text = tag.get_text(strip=True)

            # Check for speaker attribution
            speaker = ""
            for child in tag.children:
                if hasattr(child, 'name') and child.name is None and '——' in child:
                    parts = child.split('——')
                    if len(parts) >= 2:
                        text = parts[0].strip()
                        speaker = parts[-1].strip()
                    break

            return {
                "type": "quote",
                "text": text,
                "speaker": speaker,
                **styles
            }

        # Div elements
        elif tag_name == 'div':
            class_str = tag.get('class', '')
            if isinstance(class_str, list):
                class_str = ' '.join(class_str)

            text = tag.get_text(strip=True)

            # Formulas
            if class_str and 'formula' in class_str:
                return {
                    "type": "formula",
                    "text": text
                }

            # Chinese abstract
            if class_str and 'abstract' in class_str and 'abstract-en' not in class_str:
                return {
                    "type": "abstract",
                    "text": text,
                    **styles
                }

            # English abstract
            if class_str and 'abstract-en' in class_str:
                return {
                    "type": "abstract_en",
                    "text": text,
                    **styles
                }

            # Chinese keywords
            if class_str and 'keywords' in class_str and 'keywords-en' not in class_str:
                text = text.replace('关键词:', '').replace('关键词：', '')
                keywords = [k.strip() for k in text.replace('，', ';').replace(',', ';').split(';')]
                keywords = [k for k in keywords if k]
                return {
                    "type": "keywords",
                    "keywords": keywords,
                    **styles
                }

            # English keywords
            if class_str and 'keywords-en' in class_str:
                keywords = [k.strip() for k in text.replace('Key Words:', '').replace('Key words:', '').replace('Keywords:', '').split(';')]
                return {
                    "type": "keywords_en",
                    "keywords": keywords,
                    **styles
                }

            # Authors
            if class_str and 'authors' in class_str:
                authors = [a.strip() for a in text.split(',')]
                return {
                    "type": "author_info",
                    "authors": authors
                }

            # References
            if class_str and 'references' in class_str:
                refs = []
                for p in tag.find_all('p', recursive=False):
                    ref_text = p.get_text(strip=True)
                    if ref_text:
                        refs.append(ref_text)
                if not refs and text:
                    refs = [text]

                return {
                    "type": "references",
                    "items": refs
                }

            # Generic div as paragraph
            if text:
                return {
                    "type": "paragraph",
                    "text": text,
                    **styles
                }

        # Span elements
        elif tag_name == 'span':
            text = tag.get_text(strip=True)
            if text:
                return {
                    "type": "paragraph",
                    "text": text,
                    **styles
                }

        # Code blocks (pre > code)
        elif tag_name == 'pre':
            code_tag = tag.find('code')
            if code_tag:
                code_class = code_tag.get('class', '')
                if isinstance(code_class, list):
                    code_class = ' '.join(code_class)
                code_styles = StyleParser.parse_classes(code_class)
                return {
                    "type": "code_block",
                    "text": code_tag.get_text(),
                    **code_styles
                }
            # Fallback: pre without code child
            return {
                "type": "code_block",
                "text": tag.get_text(),
                **styles
            }

        return None


# Convenience functions
def parse_html(html: str, parser: str = 'lxml') -> Dict[str, Any]:
    """
    Parse HTML string into structured data.

    Args:
        html: HTML string to parse
        parser: BeautifulSoup parser to use

    Returns:
        Dictionary with 'title' and 'elements' keys
    """
    parser_obj = HTMLParser(html, parser)
    return parser_obj.parse()


def parse_html_elements(html: str, parser: str = 'lxml') -> List[Dict[str, Any]]:
    """
    Parse HTML string and return element list.

    Args:
        html: HTML string to parse
        parser: BeautifulSoup parser to use

    Returns:
        List of document elements
    """
    result = parse_html(html, parser)
    return result.get("elements", [])


# Global parser instance
html_parser = HTMLParser


def get_html_parser(html: str) -> HTMLParser:
    """Get an HTML parser instance"""
    return HTMLParser(html)
