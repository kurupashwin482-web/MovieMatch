from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field
from backend.app.schemas.movie import MovieResponse


class PopularityRequest(BaseModel):
    rated_movie_ids: List[int] = Field(
        default_factory=list,
        description="List of TMDB movie IDs the user has rated (to exclude from recommendations)"
    )
    k: int = Field(default=10, ge=1, le=50, description="Number of recommendations to return")


class RatingInputItem(BaseModel):
    movie_id: int = Field(..., description="TMDB Movie ID")
    rating: float = Field(..., ge=0.5, le=5.0, description="Rating value between 0.5 and 5.0")


class PersonalizedRecommendationRequest(BaseModel):
    ratings: Union[Dict[str, float], Dict[int, float], List[RatingInputItem]] = Field(
        ...,
        description="Submitted movie ratings as a {movie_id: rating} mapping or list of items"
    )
    k: int = Field(default=10, ge=1, le=50, description="Number of recommendations to return")

    def get_ratings_dict(self) -> Dict[int, float]:
        """Convert input ratings into a clean {movie_id: float} dictionary."""
        result = {}
        if isinstance(self.ratings, dict):
            for k, v in self.ratings.items():
                try:
                    movie_id = int(k)
                    rating_val = float(v)
                    if 0.5 <= rating_val <= 5.0:
                        result[movie_id] = rating_val
                except (ValueError, TypeError):
                    continue
        elif isinstance(self.ratings, list):
            for item in self.ratings:
                try:
                    movie_id = int(item.movie_id)
                    rating_val = float(item.rating)
                    if 0.5 <= rating_val <= 5.0:
                        result[movie_id] = rating_val
                except (ValueError, TypeError):
                    continue
        return result


class RecommendationResponse(BaseModel):
    algorithm: str
    ratings_count: int
    required_ratings: int = 5
    personalized_unlocked: bool
    movies: List[MovieResponse]
