"""
Entry point for Render deployment
Usage: uvicorn main:app --host 0.0.0.0 --port $PORT
"""
from api.app import app

# This file serves as the entry point for Render
# The app instance is imported from api.app module
