from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    movie_id = Column(Integer, nullable=False, index=True)  # TMDB movie ID
    rating = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "movie_id", name="uq_user_movie_rating"),
    )

    user = relationship("User", back_populates="ratings")
