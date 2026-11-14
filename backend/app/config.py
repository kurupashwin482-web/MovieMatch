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

# CORS Origins (includes GitHub Pages public origin without subpath)
raw_cors = os.getenv(
    "CORS_ORIGINS",
    "https://kurupashwin482-web.github.io,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
)
CORS_ORIGINS: List[str] = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

# TMDB API (Optional: used for fallback poster metadata fetching)
# Keep backend-only, never expose to frontend
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "").strip()
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# Recommendation constraints
MIN_RATINGS_FOR_PERSONALIZED = 5
TOP_K_RECOMMENDATIONS = 10
