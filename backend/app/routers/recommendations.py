from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.config import MIN_RATINGS_FOR_PERSONALIZED, TOP_K_RECOMMENDATIONS
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.rating import Rating
from backend.app.schemas.movie import MovieResponse
from backend.app.schemas.recommendation import RecommendationResponse
from backend.app.utils.auth import get_current_user
from backend.app.recommenders.popularity import popularity_recommender
from backend.app.recommenders.tfidf import tfidf_recommender
from backend.app.recommenders.genre import genre_recommender

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/popularity", response_model=RecommendationResponse)
def get_popularity_recommendations(
    k: int = Query(TOP_K_RECOMMENDATIONS, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Popularity-Based Recommendations.
    Returns the top K movies ranked by Bayesian weighted rating (IMDb formula),
    strictly excluding movies the user has already rated.
    Available even before 5 ratings are completed.
    """
    user_ratings = db.query(Rating.movie_id).filter(Rating.user_id == current_user.id).all()
    rated_ids = {r[0] for r in user_ratings}
    ratings_count = len(rated_ids)

    recs = popularity_recommender.recommend(rated_movie_ids=rated_ids, k=k)
    movies = [MovieResponse(**r) for r in recs]

    return RecommendationResponse(
        algorithm="popularity",
        ratings_count=ratings_count,
        required_ratings=MIN_RATINGS_FOR_PERSONALIZED,
        personalized_unlocked=ratings_count >= MIN_RATINGS_FOR_PERSONALIZED,
        movies=movies
    )


@router.get("/tfidf", response_model=RecommendationResponse)
def get_tfidf_recommendations(
    k: int = Query(TOP_K_RECOMMENDATIONS, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    TF-IDF Content-Based Recommendations.
    Builds a dynamic weighted preference profile from user's ratings across 20,000 TF-IDF features.
    Requires at least 5 distinct movie ratings.
    """
    user_ratings = db.query(Rating.movie_id, Rating.rating).filter(Rating.user_id == current_user.id).all()
    ratings_dict = {r[0]: float(r[1]) for r in user_ratings}
    ratings_count = len(ratings_dict)

    if ratings_count < MIN_RATINGS_FOR_PERSONALIZED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"At least {MIN_RATINGS_FOR_PERSONALIZED} movie ratings are required for personalized "
                f"TF-IDF recommendations. You currently have {ratings_count} rating(s). "
                "Please rate more movies to unlock content-based recommendations."
            )
        )

    recs = tfidf_recommender.recommend(movie_ratings=ratings_dict, k=k)
    movies = [MovieResponse(**r) for r in recs]

    return RecommendationResponse(
        algorithm="tfidf",
        ratings_count=ratings_count,
        required_ratings=MIN_RATINGS_FOR_PERSONALIZED,
        personalized_unlocked=True,
        movies=movies
    )


@router.get("/genre", response_model=RecommendationResponse)
def get_genre_recommendations(
    k: int = Query(TOP_K_RECOMMENDATIONS, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Genre-Based Recommendations.
    Constructs a user genre preference vector using positive rating weights (max(0, r - 3)),
    computes cosine similarity, and blends with Bayesian quality scores (alpha=0.5).
    Requires at least 5 distinct movie ratings.
    """
    user_ratings = db.query(Rating.movie_id, Rating.rating).filter(Rating.user_id == current_user.id).all()
    ratings_dict = {r[0]: float(r[1]) for r in user_ratings}
    ratings_count = len(ratings_dict)

    if ratings_count < MIN_RATINGS_FOR_PERSONALIZED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"At least {MIN_RATINGS_FOR_PERSONALIZED} movie ratings are required for personalized "
                f"Genre recommendations. You currently have {ratings_count} rating(s). "
                "Please rate more movies to unlock genre recommendations."
            )
        )

    recs = genre_recommender.recommend(movie_ratings=ratings_dict, k=k)
    movies = [MovieResponse(**r) for r in recs]

    return RecommendationResponse(
        algorithm="genre",
        ratings_count=ratings_count,
        required_ratings=MIN_RATINGS_FOR_PERSONALIZED,
        personalized_unlocked=True,
        movies=movies
    )
