from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.rating import Rating
from backend.app.schemas.movie import MovieResponse, MovieSearchResponse
from backend.app.utils.auth import get_current_user_optional
from backend.app.utils.catalogue import catalogue

router = APIRouter(prefix="/movies", tags=["Movies"])


@router.get("/genres", response_model=List[str])
def get_genres():
    """Return all unique movie genres available in the catalogue."""
    if not catalogue.is_loaded:
        catalogue.load()
    return catalogue.all_genres


@router.get("/search", response_model=MovieSearchResponse)
def search_movies(
    query: Optional[str] = Query(None, description="Title search keyword"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Search catalogue movies with optional text search, genre filter, and pagination."""
    if not catalogue.is_loaded:
        catalogue.load()

    total, raw_movies = catalogue.search_movies(query=query, genre=genre, page=page, limit=limit)

    # If user is authenticated, attach user's ratings
    user_ratings = {}
    if current_user:
        ratings = db.query(Rating.movie_id, Rating.rating).filter(Rating.user_id == current_user.id).all()
        user_ratings = {r[0]: r[1] for r in ratings}

    movies = []
    for m in raw_movies:
        item = dict(m)
        item["user_rating"] = user_ratings.get(item["tmdbId"])
        movies.append(MovieResponse(**item))

    return MovieSearchResponse(
        total=total,
        page=page,
        limit=limit,
        movies=movies
    )


@router.get("/{movie_id}", response_model=MovieResponse)
def get_movie_by_id(
    movie_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Retrieve full details of a single movie by TMDB ID."""
    if not catalogue.is_loaded:
        catalogue.load()

    movie = catalogue.get_movie(movie_id)
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movie with TMDB ID {movie_id} was not found in our catalogue."
        )

    item = dict(movie)
    if current_user:
        user_rating = (
            db.query(Rating.rating)
            .filter(Rating.user_id == current_user.id, Rating.movie_id == movie_id)
            .first()
        )
        item["user_rating"] = user_rating[0] if user_rating else None

    return MovieResponse(**item)
