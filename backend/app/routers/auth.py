from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.rating import Rating
from backend.app.schemas.user import UserRegister, UserLogin, UserResponse, Token
from backend.app.utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check if username exists
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists."
        )

    # Check if email exists
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    hashed_pw = hash_password(user_in.password)
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={"sub": str(new_user.id), "username": new_user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    user_resp = UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        created_at=new_user.created_at,
        ratings_count=0
    )

    return Token(access_token=access_token, user=user_resp)


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with username/email and password."""
    # Allow login with either username or email
    user = (
        db.query(User)
        .filter((User.username == user_in.username) | (User.email == user_in.username))
        .first()
    )

    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    ratings_count = db.query(Rating).filter(Rating.user_id == user.id).count()

    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    user_resp = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at,
        ratings_count=ratings_count
    )

    return Token(access_token=access_token, user=user_resp)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the profile of the authenticated user."""
    ratings_count = db.query(Rating).filter(Rating.user_id == current_user.id).count()
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at,
        ratings_count=ratings_count
    )
