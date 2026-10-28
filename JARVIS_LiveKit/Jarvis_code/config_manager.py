"""Read JARVIS profile data and secrets from local-only files."""

import json
import logging
import os
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_FILE_PATH = BASE_DIR / "user_config.json"
ENV_FILE_PATH = Path(__file__).resolve().parent / ".env"
logger = logging.getLogger("jarvis.config")


class ConfigManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._config = {}
            cls._instance.load_config()
        return cls._instance

    def load_config(self) -> None:
        load_dotenv(ENV_FILE_PATH, override=False)
        try:
            self._config = json.loads(CONFIG_FILE_PATH.read_text(encoding="utf-8"))
        except FileNotFoundError:
            self._config = {}
        except (OSError, json.JSONDecodeError) as exc:
            logger.error("Could not read JARVIS profile: %s", exc)
            self._config = {}

    def get(self, key: str, default: Any = None) -> Any:
        value: Any = self._config
        for part in key.split("."):
            if not isinstance(value, dict) or part not in value:
                return default
            value = value[part]
        return value

    def save_config(self) -> None:
        CONFIG_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CONFIG_FILE_PATH.write_text(
            json.dumps(self._config, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def ensure_user_id(self) -> str:
        user_id = self._config.get("user_id")
        if not user_id:
            user_id = self.get_user_name().strip().lower().replace(" ", "_") or "user"
            self._config["user_id"] = user_id
            self.save_config()
        return user_id

    def get_api_key(self, service: str) -> Optional[str]:
        env_names = {
            "google": "GOOGLE_API_KEY",
            "openai": "OPENAI_API_KEY",
            "livekit_url": "LIVEKIT_URL",
            "livekit_key": "LIVEKIT_API_KEY",
            "livekit_secret": "LIVEKIT_API_SECRET",
            "ollama_url": "OLLAMA_BASE_URL",
        }
        name = env_names.get(service)
        return os.getenv(name) if name else None

    def get_user_id(self) -> str:
        return self.ensure_user_id()

    def get_user_name(self) -> str:
        return self.get("user_name", "User")

    def get_full_name(self) -> str:
        return self.get_user_name()

    def get_assistant_name(self) -> str:
        return self.get("assistant_name", "JARVIS")

    def get_language(self) -> str:
        return self.get("language", "bn")

    def get_llm_config(self) -> dict[str, str]:
        defaults = {
            "provider": "ollama",
            "model": os.getenv("JARVIS_MODEL", "qwen3.5:4b"),
            "voice": "ara",
            "ollama_base_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
        }
        return {**defaults, **(self.get("llm", {}) or {})}

