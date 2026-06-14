from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from dotenv import load_dotenv



ENV_path = Path(__file__).parent / ".env"

try:
   load_dotenv(dotenv_path=ENV_path)
except Exception:
   pass


class Settings(BaseSettings):
   app_name: str = "MYAPP"
   database_url: str = "sqlite:///./app.db"
   secret_key: str = "asdfghjkjhgf-asdrfty"
   debug: bool = False
   api_key: str = ""

   model_config = SettingsConfigDict(
      env_file=str(ENV_path),
      env_file_encoding="utf-8",
      extra="allow",
   )


@lru_cache()
def get_settings():
   return Settings()