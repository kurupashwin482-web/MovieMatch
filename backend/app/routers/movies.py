from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from backend.app.schemas.movie import MovieResponse, MovieSearchResponse
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
    limit: int = Query(24, ge=1, le=100, description="Items per page")
):
    """Search catalogue movies with optional text search, genre filter, and pagination."""
    if not catalogue.is_loaded:
        catalogue.load()

    total, raw_movies = catalogue.search_movies(query=query, genre=genre, page=page, limit=limit)
    movies = [MovieResponse(**m) for m in raw_movies]

    return MovieSearchResponse(
        total=total,
        page=page,
        limit=limit,
        movies=movies
    )


@router.get("/{movie_id}", response_model=MovieResponse)
def get_movie_by_id(movie_id: int):
    """Retrieve full details of a single movie by TMDB ID."""
    if not catalogue.is_loaded:
        catalogue.load()

    movie = catalogue.get_movie(movie_id)
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movie with TMDB ID {movie_id} was not found in our catalogue."
        )

    return MovieResponse(**movie)
