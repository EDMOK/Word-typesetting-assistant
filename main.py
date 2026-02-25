"""
Entry point for Render deployment.
This file is in the root to avoid relative import issues.
"""
import sys
import os

# Ensure new_api is in path
sys.path.insert(0, os.path.dirname(__file__))

# Import the app from new_api
from new_api.api.app import app

# Re-export for uvicorn
__all__ = ['app']
