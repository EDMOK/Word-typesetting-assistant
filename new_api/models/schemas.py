"""
Pydantic data models for API requests and responses.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FormatRequest(BaseModel):
    """Request model for text formatting"""
    text: str = Field(..., min_length=1, description="Text content to format")
    rules: str = Field(
        default="默认：标题黑体二号居中，正文宋体小四首行缩进",
        description="Formatting rules"
    )


class FormatResponse(BaseModel):
    """Response model for formatting operations"""
    success: bool = Field(..., description="Whether the operation succeeded")
    message: str = Field(..., description="Result message")
    download_url: Optional[str] = Field(default=None, description="Download URL for the output file")
    data: Optional[Dict[str, Any]] = Field(default=None, description="additional data")


class StreamEvent(BaseModel):
    """Model for SSE (Server-Sent Events) stream events"""
    type: str = Field(..., description="Event type: start, progress, complete, error")
    stage: Optional[str] = Field(default=None, description="Processing stage")
    message: str = Field(..., description="Event message")
    progress: Optional[int] = Field(default=None, description="Progress percentage")
    elapsed: Optional[float] = Field(default=None, description="Elapsed time in seconds")
    download_url: Optional[str] = Field(default=None, description="Download URL when complete")
    data: Optional[Dict[str, Any]] = Field(default=None, description="additional data")


class LLMResponse(BaseModel):
    """Response model for LLM service"""
    success: bool
    html: Optional[str] = None
    log_file: Optional[str] = None
    error: Optional[str] = None


class HTMLParseResult(BaseModel):
    """Result model for HTML parsing"""
    title: Optional[str] = None
    elements: List[Dict[str, Any]] = Field(default_factory=list)


class DocumentElement(BaseModel):
    """Model for document elements"""
    type: str = Field(..., description="Element type: heading, paragraph, list, table, etc.")
    text: Optional[str] = None
    level: Optional[int] = Field(default=None, ge=1, le=4, description="Heading level (1-4)")
    font: Optional[str] = None
    size: Optional[float] = None
    bold: bool = False
    alignment: Optional[str] = Field(default=None, pattern="^(left|center|right)$")
    indent: bool = False
    hanging_indent: bool = False
    items: Optional[List[str]] = None
    headers: Optional[List[str]] = None
    rows: Optional[List[List[str]]] = None
    style: Optional[str] = None
    keywords: Optional[List[str]] = None
    speaker: Optional[str] = None
    authors: Optional[List[str]] = None


class FileUploadRequest(BaseModel):
    """Request model for file upload formatting"""
    rules: str = Field(
        default="默认：标题黑体二号居中，正文宋体小四首行缩进",
        description="Formatting rules"
    )


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    services: Dict[str, str] = Field(default_factory=dict, description="Service health status")
