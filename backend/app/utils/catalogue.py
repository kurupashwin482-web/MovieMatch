import ast
import json
import logging
from typing import Dict, List, Optional, Tuple
import pandas as pd
from backend.app.config import ARTIFACTS_DIR, METADATA_RAW_PATH, TMDB_IMAGE_BASE_URL

logger = logging.getLogger("moviematch.catalogue")


def _parse_genres(genre_raw) -> List[str]:
    """Parse genre string from JSON or literal eval into list of genre names."""
    if not genre_raw or pd.isna(genre_raw):
        return []
    if isinstance(genre_raw, list):
        return [g["name"] if isinstance(g, dict) and "name" in g else str(g) for g in genre_raw]
    try:
        parsed = ast.literal_eval(str(genre_raw))
        if isinstance(parsed, list):
            return [g["name"] for g in parsed if isinstance(g, dict) and "name" in g]
    except Exception:
        try:
            parsed = json.loads(str(genre_raw))
            if isinstance(parsed, list):
                return [g["name"] for g in parsed if isinstance(g, dict) and "name" in g]
        except Exception:
            pass
    return []


class MovieCatalogue:
    """In-memory movie catalogue for fast lookups, searches, and metadata formatting."""

    def __init__(self):
        self.movies_df: pd.DataFrame = pd.DataFrame()
        self.movie_by_id: Dict[int, dict] = {}
        self.all_genres: List[str] = []
        self.poster_map: Dict[int, str] = {}
        self.is_loaded: bool = False

    def load(self):
        """Load movies and poster mapping into memory."""
        if self.is_loaded:
            return

        clean_path = ARTIFACTS_DIR / "movies_clean.csv"
        if not clean_path.exists():
            raise FileNotFoundError(f"Clean movie catalogue not found at {clean_path}")

        logger.info(f"Loading movie catalogue from {clean_path}...")
        df = pd.read_csv(clean_path)

        # Load poster mapping if raw movies_metadata.csv is available
        if METADATA_RAW_PATH.exists():
            try:
                logger.info(f"Loading poster mappings from {METADATA_RAW_PATH}...")
                raw_meta = pd.read_csv(
                    METADATA_RAW_PATH,
                    usecols=["id", "poster_path"],
                    low_memory=False
                )
                raw_meta = raw_meta[raw_meta["id"].astype(str).str.isnumeric()]
                raw_meta["id"] = raw_meta["id"].astype(int)
                raw_meta = raw_meta.dropna(subset=["poster_path"]).drop_duplicates(subset=["id"])
                self.poster_map = dict(zip(raw_meta["id"], raw_meta["poster_path"]))
                logger.info(f"Loaded {len(self.poster_map)} poster mappings.")
            except Exception as e:
                logger.warning(f"Could not load posters from raw metadata: {e}")

        # Overlay verified poster mappings if available
        verified_path = ARTIFACTS_DIR / "verified_posters.json"
        if not verified_path.exists():
            verified_path = ARTIFACTS_DIR.parent / "frontend" / "public" / "data" / "verified_posters.json"
        if verified_path.exists():
            try:
                with open(verified_path) as vf:
                    v_posters = json.load(vf)
                for k, v in v_posters.items():
                    if v and "image.tmdb.org/t/p/" in v:
                        rel = "/" + v.split("image.tmdb.org/t/p/")[-1].split("/")[-1]
                        self.poster_map[int(k)] = rel
                    elif v:
                        self.poster_map[int(k)] = str(v)
                logger.info(f"Overlaid {len(v_posters)} verified posters.")
            except Exception as e:
                logger.warning(f"Could not load verified posters: {e}")

        # Ensure tmdbId is integer
        df["tmdbId"] = df["tmdbId"].astype(int)
        df["genres_list"] = df["genres"].apply(_parse_genres)

        # Attach poster_path
        df["poster_path"] = df["tmdbId"].map(self.poster_map)

        # Clean release_year
        df["release_year"] = pd.to_numeric(df["release_year"], errors="coerce").fillna(0).astype(int)

        self.movies_df = df

        # Unique sorted genres
        genre_set = set()
        for glist in df["genres_list"]:
            genre_set.update(glist)
        self.all_genres = sorted(genre_set)

        # Build fast dictionary lookup
        self.movie_by_id = {}
        for _, row in df.iterrows():
            tmdb_id = int(row["tmdbId"])
            poster = row["poster_path"] if pd.notna(row["poster_path"]) else None
            poster_url = f"{TMDB_IMAGE_BASE_URL}{poster}" if poster else None
            overview = str(row["overview"]) if pd.notna(row["overview"]) else ""
            avg_rating = float(row["avg_rating"]) if pd.notna(row["avg_rating"]) else None
            rating_count = int(row["rating_count"]) if pd.notna(row["rating_count"]) else 0
            year = int(row["release_year"]) if row["release_year"] > 0 else None

            self.movie_by_id[tmdb_id] = {
                "tmdbId": tmdb_id,
                "title": str(row["title"]),
                "release_year": year,
                "genres": row["genres_list"],
                "overview": overview,
                "avg_rating": round(avg_rating, 2) if avg_rating is not None else None,
                "rating_count": rating_count,
                "poster_path": poster,
                "poster_url": poster_url,
            }

        self.is_loaded = True
        logger.info(f"Successfully loaded {len(self.movie_by_id)} movies into catalogue.")

    def get_movie(self, tmdb_id: int) -> Optional[dict]:
        """Retrieve movie dictionary by TMDB ID."""
        return self.movie_by_id.get(tmdb_id)

    def search_movies(
        self,
        query: Optional[str] = None,
        genre: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[int, List[dict]]:
        """Search movies with optional title search, genre filtering, and pagination."""
        if not self.is_loaded:
            self.load()

        filtered_df = self.movies_df

        if query and query.strip():
            q = query.strip().lower()
            filtered_df = filtered_df[filtered_df["title"].str.lower().str.contains(q, na=False)]

        if genre and genre.strip():
            g = genre.strip()
            filtered_df = filtered_df[filtered_df["genres_list"].apply(lambda genres: g in genres)]

        total = len(filtered_df)
        start = max(0, (page - 1) * limit)
        end = start + limit

        page_records = filtered_df.iloc[start:end]
        results = []
        for _, row in page_records.iterrows():
            tmdb_id = int(row["tmdbId"])
            movie_dict = self.get_movie(tmdb_id)
            if movie_dict:
                results.append(movie_dict)

        return total, results


catalogue = MovieCatalogue()
