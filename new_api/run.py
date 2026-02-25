"""
Entry point for running the API directly
Usage: python run.py
"""
import sys
from pathlib import Path

# Add the new_api directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from api.app import app
import uvicorn
from config.settings import get_app_config

if __name__ == "__main__":
    config = get_app_config()
    port = int(__import__('os').getenv("PORT", "8000"))
    uvicorn.run(
        "api.app:app",
        host="0.0.0.0",
        port=port,
        reload=config.debug
    )
