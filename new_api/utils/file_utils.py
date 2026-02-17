"""
Utility functions for file operations.
"""
import io
import os
import hashlib
import uuid
import tempfile
import logging
from pathlib import Path
from typing import Optional, Tuple, Union
import aiofiles
from docx import Document

logger = logging.getLogger(__name__)


async def save_upload_file(
    file_content: bytes,
    filename: str,
    upload_dir: str = "uploads"
) -> str:
    """Save uploaded file to disk"""
    os.makedirs(upload_dir, exist_ok=True)
    file_ext = Path(filename).suffix.lower() if '.' in filename else ''
    unique_name = f"{hash(filename)}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = os.path.join(upload_dir, unique_name)

    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(file_content)

    return file_path


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from a Word document, including paragraphs and tables"""
    try:
        doc = Document(file_path)
        text_parts = []

        # Extract paragraph text
        for para in doc.paragraphs:
            if para.text.strip():
                text_parts.append(para.text)

        # Extract table text
        for table in doc.tables:
            for row in table.rows:
                row_text = []
                for cell in row.cells:
                    cell_text = cell.text.strip()
                    if cell_text:
                        row_text.append(cell_text)
                if row_text:
                    text_parts.append(' | '.join(row_text))

        if not text_parts:
            raise ValueError("文档中未提取到任何文本内容")

        return '\n'.join(text_parts)
    except ValueError:
        # Re-raise ValueError with original message
        raise
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {e}")


def extract_text_from_docx_bytes(docx_bytes: bytes) -> str:
    """Extract text from Word document bytes (for cloud deployment), including paragraphs and tables"""
    tmp_path = None
    try:
        # Create a temporary file since python-docx needs a file path
        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as tmp:
            tmp.write(docx_bytes)
            tmp_path = tmp.name

        doc = Document(tmp_path)
        text_parts = []

        # Extract paragraph text
        for para in doc.paragraphs:
            if para.text.strip():
                text_parts.append(para.text)

        # Extract table text
        for table in doc.tables:
            for row in table.rows:
                row_text = []
                for cell in row.cells:
                    cell_text = cell.text.strip()
                    if cell_text:
                        row_text.append(cell_text)
                if row_text:
                    text_parts.append(' | '.join(row_text))

        if not text_parts:
            raise ValueError("文档中未提取到任何文本内容")

        return '\n'.join(text_parts)
    except ValueError:
        # Re-raise ValueError with original message
        raise
    except Exception as e:
        raise ValueError(f"Failed to extract text from DOCX: {e}")
    finally:
        # Clean up temp file
        if tmp_path:
            try:
                os.remove(tmp_path)
            except OSError:
                pass


def decode_file_content(content: bytes, encodings: list = None) -> str:
    """Decode file content with multiple encoding attempts"""
    if encodings is None:
        encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030', 'latin-1']

    for encoding in encodings:
        try:
            return content.decode(encoding)
        except (UnicodeDecodeError, UnicodeError):
            continue

    return content.decode('utf-8', errors='ignore')


def generate_output_path(
    content: str,
    output_dir: str = "outputs",
    extension: str = ".docx"
) -> Tuple[str, str]:
    """Generate unique output file path based on content hash + timestamp + random"""
    import time
    import random

    os.makedirs(output_dir, exist_ok=True)
    # 加上时间戳和随机数，避免相同内容冲突
    content_hash = hashlib.md5(content.encode('utf-8')).hexdigest()[:8]
    timestamp = int(time.time() * 1000)
    random_suffix = random.randint(1000, 9999)
    filename = f"{content_hash}_{timestamp}_{random_suffix}{extension}"
    file_path = os.path.join(output_dir, filename)
    return filename, file_path


def get_file_size(file_path: str) -> int:
    """Get file size in bytes"""
    try:
        return os.path.getsize(file_path)
    except OSError:
        return 0


def cleanup_temp_file(file_path: str) -> None:
    """Remove temporary file if exists"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError:
        pass


def cleanup_old_outputs(output_dir: str, hours: int = 0, minutes: int = 10) -> int:
    """
    Clean up old output files older than specified time.

    Args:
        output_dir: Directory to clean
        hours: Delete files older than this many hours
        minutes: Delete files older than this many minutes (default: 10)

    Returns:
        Number of files deleted
    """
    import time
    if not os.path.exists(output_dir):
        return 0

    current_time = time.time()
    # Use minutes by default if hours is 0
    if hours > 0:
        threshold_seconds = hours * 3600
    else:
        threshold_seconds = minutes * 60

    deleted_count = 0

    for filename in os.listdir(output_dir):
        file_path = os.path.join(output_dir, filename)
        try:
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                if file_age > threshold_seconds:
                    os.remove(file_path)
                    deleted_count += 1
                    logger.info(f"Deleted old output file: {filename}")
        except OSError as e:
            logger.warning(f"Failed to delete {filename}: {e}")

    return deleted_count
