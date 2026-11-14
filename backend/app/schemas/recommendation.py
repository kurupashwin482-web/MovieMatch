from typing import List
from pydantic import BaseModel
from backend.app.schemas.movie import MovieResponse


class RecommendationResponse(BaseModel):
    algorithm: str
    ratings_count: int
    required_ratings: int = 5
    personalized_unlocked: bool
    movies: List[MovieResponse]
