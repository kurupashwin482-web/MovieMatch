from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from backend.app.schemas.movie import MovieResponse


class RatingCreate(BaseModel):
    movie_id: int = Field(..., description="TMDB Movie ID")
    rating: float = Field(..., ge=0.5, le=5.0, description="Rating from 0.5 to 5.0 (increments of 0.5)")


class RatingUpdate(BaseModel):
    rating: float = Field(..., ge=0.5, le=5.0, description="Updated rating from 0.5 to 5.0")


class RatingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    movie_id: int
    rating: float
    created_at: datetime
    updated_at: datetime
    movie: Optional[MovieResponse] = None


class UserRatingsSummary(BaseModel):
    total_ratings: int
    required_ratings: int = 5
    personalized_unlocked: bool
    ratings: List[RatingResponse]
