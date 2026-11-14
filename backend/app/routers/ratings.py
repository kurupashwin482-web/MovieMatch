from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.config import MIN_RATINGS_FOR_PERSONALIZED
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.rating import Rating
from backend.app.schemas.movie import MovieResponse
from backend.app.schemas.rating import (
    RatingCreate,
    RatingUpdate,
    RatingResponse,
    UserRatingsSummary
)
from backend.app.utils.auth import get_current_user
from backend.app.utils.catalogue import catalogue

router = APIRouter(prefix="/ratings", tags=["Ratings"])


@router.post("", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_rating(
    rating_in: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a movie rating (0.5 to 5.0).
    If a rating already exists for this movie, updates it to prevent duplicate records.
    """
    if not catalogue.is_loaded:
        catalogue.load()

    movie_meta = catalogue.get_movie(rating_in.movie_id)
    if not movie_meta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movie with TMDB ID {rating_in.movie_id} does not exist in our catalogue."
        )

    # Check for existing rating
    existing_rating = (
        db.query(Rating)
        .filter(Rating.user_id == current_user.id, Rating.movie_id == rating_in.movie_id)
        .first()
    )

    if existing_rating:
        existing_rating.rating = rating_in.rating
        existing_rating.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing_rating)
        rating_obj = existing_rating
    else:
        new_rating = Rating(
            user_id=current_user.id,
            movie_id=rating_in.movie_id,
            rating=rating_in.rating
        )
        db.add(new_rating)
        db.commit()
        db.refresh(new_rating)
        rating_obj = new_rating

    movie_resp = MovieResponse(**dict(movie_meta), user_rating=rating_obj.rating)
    return RatingResponse(
        id=rating_obj.id,
        user_id=rating_obj.user_id,
        movie_id=rating_obj.movie_id,
        rating=rating_obj.rating,
        created_at=rating_obj.created_at,
        updated_at=rating_obj.updated_at,
        movie=movie_resp
    )


@router.get("/me", response_model=UserRatingsSummary)
def get_user_ratings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all movies rated by the authenticated user with metadata and progress count."""
    if not catalogue.is_loaded:
        catalogue.load()

    ratings = (
        db.query(Rating)
        .filter(Rating.user_id == current_user.id)
        .order_by(Rating.updated_at.desc())
        .all()
    )

    ratings_list = []
    for r in ratings:
        movie_meta = catalogue.get_movie(r.movie_id)
        movie_resp = MovieResponse(**dict(movie_meta), user_rating=r.rating) if movie_meta else None
        ratings_list.append(
            RatingResponse(
                id=r.id,
                user_id=r.user_id,
                movie_id=r.movie_id,
                rating=r.rating,
                created_at=r.created_at,
                updated_at=r.updated_at,
                movie=movie_resp
            )
        )

    total_count = len(ratings_list)
    return UserRatingsSummary(
        total_ratings=total_count,
        required_ratings=MIN_RATINGS_FOR_PERSONALIZED,
        personalized_unlocked=total_count >= MIN_RATINGS_FOR_PERSONALIZED,
        ratings=ratings_list
    )


@router.put("/{movie_id}", response_model=RatingResponse)
def update_rating(
    movie_id: int,
    rating_in: RatingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing movie rating."""
    existing_rating = (
        db.query(Rating)
        .filter(Rating.user_id == current_user.id, Rating.movie_id == movie_id)
        .first()
    )

    if not existing_rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"You have not yet rated movie with ID {movie_id}."
        )

    existing_rating.rating = rating_in.rating
    existing_rating.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(existing_rating)

    if not catalogue.is_loaded:
        catalogue.load()
    movie_meta = catalogue.get_movie(movie_id)
    movie_resp = MovieResponse(**dict(movie_meta), user_rating=existing_rating.rating) if movie_meta else None

    return RatingResponse(
        id=existing_rating.id,
        user_id=existing_rating.user_id,
        movie_id=existing_rating.movie_id,
        rating=existing_rating.rating,
        created_at=existing_rating.created_at,
        updated_at=existing_rating.updated_at,
        movie=movie_resp
    )


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rating(
    movie_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user's rating for a specific movie."""
    existing_rating = (
        db.query(Rating)
        .filter(Rating.user_id == current_user.id, Rating.movie_id == movie_id)
        .first()
    )

    if not existing_rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No rating found for movie ID {movie_id}."
        )

    db.delete(existing_rating)
    db.commit()
    return None
