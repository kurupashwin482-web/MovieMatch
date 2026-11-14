from typing import List, Optional
from pydantic import BaseModel


class MovieResponse(BaseModel):
    tmdbId: int
    title: str
    release_year: Optional[int] = None
    genres: List[str] = []
    overview: Optional[str] = None
    avg_rating: Optional[float] = None
    rating_count: Optional[int] = None
    poster_path: Optional[str] = None
    poster_url: Optional[str] = None
    user_rating: Optional[float] = None
    score: Optional[float] = None
    score_type: Optional[str] = None


class MovieSearchResponse(BaseModel):
    total: int
    page: int
    limit: int
    movies: List[MovieResponse]
