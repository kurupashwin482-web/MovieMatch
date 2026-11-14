import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.app.config import CORS_ORIGINS, ENVIRONMENT
from backend.app.database import init_db, get_db
from backend.app.utils.catalogue import catalogue
from backend.app.recommenders.popularity import popularity_recommender
from backend.app.recommenders.tfidf import tfidf_recommender
from backend.app.recommenders.genre import genre_recommender
from backend.app.routers import (
    auth_router,
    movies_router,
    ratings_router,
    recommendations_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("moviematch.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database and load model artifacts once at startup."""
    logger.info("Initializing MovieMatch backend...")

    # 1. Initialize DB tables
    logger.info("Creating database tables if not existing...")
    init_db()

    # 2. Load movie catalogue
    logger.info("Pre-loading movie catalogue...")
    catalogue.load()

    # 3. Load recommendation models once
    logger.info("Pre-loading Popularity recommender...")
    popularity_recommender.load()

    logger.info("Pre-loading TF-IDF recommender...")
    tfidf_recommender.load()

    logger.info("Pre-loading Genre recommender...")
    genre_recommender.load()

    logger.info("All MovieMatch models and datasets loaded successfully. Ready to serve requests!")
    yield
    logger.info("MovieMatch backend shutting down.")


app = FastAPI(
    title="MovieMatch API",
    description="Machine Learning Movie Recommendation Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(movies_router)
app.include_router(ratings_router)
app.include_router(recommendations_router)


@app.get("/", tags=["Health"])
def root():
    """Root entrypoint."""
    return {
        "name": "MovieMatch API",
        "version": "1.0.0",
        "status": "healthy",
        "docs_url": "/docs"
    }


@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify database and ML model readiness."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "environment": ENVIRONMENT,
        "database": db_status,
        "models": {
            "catalogue": catalogue.is_loaded,
            "popularity": popularity_recommender.is_loaded,
            "tfidf": tfidf_recommender.is_loaded,
            "genre": genre_recommender.is_loaded,
        }
    }


if __name__ == "__main__":
    import uvicorn
    from backend.app.config import HOST, PORT
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=True)
