from backend.app.schemas.user import UserRegister, UserLogin, UserResponse, Token, TokenData
from backend.app.schemas.movie import MovieResponse, MovieSearchResponse
from backend.app.schemas.rating import RatingCreate, RatingUpdate, RatingResponse, UserRatingsSummary
from backend.app.schemas.recommendation import RecommendationResponse

__all__ = [
    "UserRegister", "UserLogin", "UserResponse", "Token", "TokenData",
    "MovieResponse", "MovieSearchResponse",
    "RatingCreate", "RatingUpdate", "RatingResponse", "UserRatingsSummary",
    "RecommendationResponse"
]
