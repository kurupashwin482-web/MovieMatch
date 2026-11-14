import logging
from typing import Optional, Dict
import httpx
from backend.app.config import TMDB_API_KEY, TMDB_IMAGE_BASE_URL

logger = logging.getLogger("moviematch.tmdb")

# In-memory metadata cache to prevent duplicate calls
_TMDB_CACHE: Dict[int, Optional[dict]] = {}


async def fetch_tmdb_movie_details(tmdb_id: int) -> Optional[dict]:
    """Fetch movie details and poster path from TMDB API if API key is configured."""
    if not TMDB_API_KEY:
        return None

    if tmdb_id in _TMDB_CACHE:
        return _TMDB_CACHE[tmdb_id]

    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
    params = {"api_key": TMDB_API_KEY, "language": "en-US"}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                poster_path = data.get("poster_path")
                details = {
                    "poster_path": poster_path,
                    "poster_url": f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else None,
                    "overview": data.get("overview"),
                    "tagline": data.get("tagline"),
                    "vote_average": data.get("vote_average"),
                    "vote_count": data.get("vote_count"),
                }
                _TMDB_CACHE[tmdb_id] = details
                return details
            else:
                _TMDB_CACHE[tmdb_id] = None
                return None
    except Exception as e:
        logger.warning(f"Failed to fetch TMDB data for {tmdb_id}: {e}")
        return None
