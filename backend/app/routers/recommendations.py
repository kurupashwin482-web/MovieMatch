from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from backend.app.config import MIN_RATINGS_FOR_PERSONALIZED, TOP_K_RECOMMENDATIONS
from backend.app.schemas.movie import MovieResponse
from backend.app.schemas.recommendation import (
    PopularityRequest,
    PersonalizedRecommendationRequest,
    RecommendationResponse,
)
from backend.app.recommenders.popularity import popularity_recommender
from backend.app.recommenders.tfidf import tfidf_recommender
from backend.app.recommenders.genre import genre_recommender

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/popularity", response_model=RecommendationResponse)
def get_popularity_recommendations_post(req: Optional[PopularityRequest] = None):
    """
    Popularity-Based Recommendations (POST).
    Returns top K movies ranked by Bayesian weighted rating (IMDb formula),
    excluding any movies submitted in `rated_movie_ids`.
    Available without user login.
    """
    rated_ids = set(req.rated_movie_ids) if req and req.rated_movie_ids else set()
    k = req.k if req else TOP_K_RECOMMENDATIONS

    recs = popularity_recommender.recommend(rated_movie_ids=rated_ids, k=k)
    movies = [MovieResponse(**r) for r in recs]

    ratings_count = len(rated_ids)
    return RecommendationResponse(
        algorithm="popularity",
        ratings_count=ratings_count,
        required_ratings=MIN_RATINGS_FOR_PERSONALIZED,
        personalized_unlocked=ratings_count >= MIN_RATINGS_FOR_PERSONALIZED,
        movies=movies
    )


@router.get("/popularity", response_model=RecommendationResponse)
def get_popularity_recommendations_get(k: int = Query(TOP_K_RECOMMENDATIONS, ge=1, le=50)):
    """
    Popularity-Based Recommendations (GET).
    Returns general top K movies ranked by Bayesian weighted rating.
    """
    recs = popularity_recommender.recommend(rated_movie_ids=set(), k=k)
    movies = [MovieResponse(**r) for r in recs]

    return RecommendationResponse(
        algorithm="popularity",
        ratings_count=0,
        required_ratings=MIN_RATINGS_FOR_PERSONALIZED,
        personalized_unlocked=False,
        movies=movies
    )


@router.post("/tfidf", response_model=RecommendationResponse)
def get_tfidf_recommendations(req: PersonalizedRecommendationRequest):
    """
    TF-IDF Content-Based Recommendations (POST).
    Constructs a personalized user preference profile dynamically from submitted ratings
    across 20,000 TF-IDF features from movie overviews.
    Requires at least 5 distinct movie ratings.
    """
    ratings_dict = req.get_ratings_dict()
    ratings_count = len(ratings_dict)

    if ratings_count < MIN_RATINGS_FOR_PERSONALIZED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"At least {MIN_RATINGS_FOR_PERSONALIZED} movie ratings are required for personalized "
                f"TF-IDF recommendations. Currently provided: {ratings_count} rating(s). "
                "Please rate more movies in the explore section to generate recommendations."
            )
        )

    recs = tfidf_recommender.recommend(movie_ratings=ratings_dict, k=req.k)
    movies = [MovieResponse(**r) for r in recs]

    return RecommendationResponse(
        algorithm="tfidf",
        ratings_count=ratings_count,
        required_ratings=MIN_RATINGS_FOR_PERSONALIZED,
        personalized_unlocked=True,
        movies=movies
    )


@router.post("/genre", response_model=RecommendationResponse)
def get_genre_recommendations(req: PersonalizedRecommendationRequest):
    """
    Genre-Based Recommendations (POST).
    Constructs a user genre preference vector using positive rating weights: w(r) = max(0, r - 3),
    computes cosine similarity against 20-dim multi-hot genre vectors,
    and blends with Bayesian movie quality scores (alpha=0.5).
    Requires at least 5 distinct movie ratings.
    """
    ratings_dict = req.get_ratings_dict()
    ratings_count = len(ratings_dict)

    if ratings_count < MIN_RATINGS_FOR_PERSONALIZED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"At least {MIN_RATINGS_FOR_PERSONALIZED} movie ratings are required for personalized "
                f"Genre recommendations. Currently provided: {ratings_count} rating(s). "
                "Please rate more movies in the explore section to generate recommendations."
            )
        )

    recs = genre_recommender.recommend(movie_ratings=ratings_dict, k=req.k)
    movies = [MovieResponse(**r) for r in recs]

    return RecommendationResponse(
        algorithm="genre",
        ratings_count=ratings_count,
        required_ratings=MIN_RATINGS_FOR_PERSONALIZED,
        personalized_unlocked=True,
        movies=movies
    )
