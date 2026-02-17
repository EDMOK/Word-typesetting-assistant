"""
Configuration management module.
Supports YAML config files and environment variables.
Environment variables take priority over config.yaml.
"""
import os
from pathlib import Path
from typing import Any, Dict, Optional
import yaml
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)


class LLMConfig(BaseModel):
    """LLM service configuration - values loaded from config.yaml or environment variables"""
    api_key: str = ""
    base_url: str = ""
    stream_model: str = ""
    non_stream_model: str = ""
    temperature: float = 0.3
    max_tokens: Optional[int] = None
    timeout: int = 120


class AppConfig(BaseModel):
    """Application configuration"""
    log_dir: str = "logs"
    output_dir: str = "outputs"
    upload_dir: str = "uploads"
    debug: bool = False


class Settings:
    """Global settings instance"""
    _instance: Optional['Settings'] = None
    _config: Dict[str, Any] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._config:
            self.load_config()

    def load_config(self, config_path: Optional[str] = None) -> None:
        """Load configuration from YAML file, with environment variables taking priority"""
        # First load from YAML file
        if config_path is None:
            # Look for config.yaml in the package directory
            package_dir = Path(__file__).parent.parent
            config_path = str(package_dir / "config.yaml")

        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                self._config = yaml.safe_load(f) or {}
        else:
            self._config = {}

        # Override with environment variables (take priority)
        self._load_from_env()

    def _load_from_env(self) -> None:
        """Load configuration from environment variables"""
        # LLM configuration from environment variables
        llm_config = self._config.get('llm', {})

        # Environment variables override YAML config
        if os.getenv('LLM_API_KEY'):
            llm_config['api_key'] = os.getenv('LLM_API_KEY')
        if os.getenv('LLM_BASE_URL'):
            llm_config['base_url'] = os.getenv('LLM_BASE_URL')
        if os.getenv('LLM_STREAM_MODEL'):
            llm_config['stream_model'] = os.getenv('LLM_STREAM_MODEL')
        if os.getenv('LLM_NON_STREAM_MODEL'):
            llm_config['non_stream_model'] = os.getenv('LLM_NON_STREAM_MODEL')
        if os.getenv('LLM_TEMPERATURE'):
            llm_config['temperature'] = float(os.getenv('LLM_TEMPERATURE', '0.3'))
        if os.getenv('LLM_TIMEOUT'):
            llm_config['timeout'] = int(os.getenv('LLM_TIMEOUT', '120'))

        self._config['llm'] = llm_config

        # App configuration from environment variables
        app_config = self._config.get('app', {})

        if os.getenv('LOG_DIR'):
            app_config['log_dir'] = os.getenv('LOG_DIR')
        if os.getenv('OUTPUT_DIR'):
            app_config['output_dir'] = os.getenv('OUTPUT_DIR')
        if os.getenv('UPLOAD_DIR'):
            app_config['upload_dir'] = os.getenv('UPLOAD_DIR')
        debug_val = os.getenv('DEBUG')
        if debug_val:
            app_config['debug'] = debug_val.lower() == 'true'

        self._config['app'] = app_config

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by dot notation key"""
        keys = key.split('.')
        value = self._config
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return default
            if value is None:
                return default
        return value

    @property
    def llm(self) -> LLMConfig:
        """Get LLM configuration"""
        llm_data = self._config.get('llm', {})
        return LLMConfig(**llm_data)

    @property
    def app(self) -> AppConfig:
        """Get application configuration"""
        app_data = self._config.get('app', {})
        return AppConfig(**app_data)

    @classmethod
    def reset(cls):
        """Reset settings instance (useful for testing)"""
        cls._instance = None
        cls._config = {}


# Global settings instance
settings = Settings()


def get_llm_config() -> LLMConfig:
    """Get LLM configuration"""
    return settings.llm


def get_app_config() -> AppConfig:
    """Get application configuration"""
    return settings.app
