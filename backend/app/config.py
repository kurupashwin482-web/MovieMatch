import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

# Base directories
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
REPO_ROOT = BACKEND_DIR.parent

# Paths to artifacts and datasets (can be overridden via env vars)
ARTIFACTS_DIR = Path(os.getenv("ARTIFACTS_DIR", str(REPO_ROOT / "Backend Artifacts")))
POPULARITY_PATH = Path(os.getenv("POPULARITY_PATH", str(REPO_ROOT / "dataset" / "processed" / "popularity_ranking.csv")))
METADATA_RAW_PATH = Path(os.getenv("METADATA_RAW_PATH", str(REPO_ROOT / "dataset" / "raw" / "movies_metadata.csv")))

# Application settings
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")

# Security and JWT
SECRET_KEY = os.getenv("SECRET_KEY", "moviematch-super-secret-production-key-2026-ml-course-deepmind-quality")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24))  # 24 hours

# Database configuration
RAW_DB_URL = os.getenv("DATABASE_URL", f"sqlite:///{REPO_ROOT / 'moviematch.db'}")
# Normalize PostgreSQL URL if provided as postgres:// (required for SQLAlchemy 2+)
if RAW_DB_URL.startswith("postgres://"):
    DATABASE_URL = RAW_DB_URL.replace("postgres://", "postgresql://", 1)
else:
    DATABASE_URL = RAW_DB_URL

# CORS Origins
raw_cors = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,https://kurupashwin482-web.github.io"
)
CORS_ORIGINS: List[str] = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

# TMDB API
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "").strip()
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# Recommendation constraints
MIN_RATINGS_FOR_PERSONALIZED = 5
TOP_K_RECOMMENDATIONS = 10
