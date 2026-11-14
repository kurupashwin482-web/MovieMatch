import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import CORS_ORIGINS, ENVIRONMENT
from backend.app.utils.catalogue import catalogue
from backend.app.recommenders.popularity import popularity_recommender
from backend.app.recommenders.tfidf import tfidf_recommender
from backend.app.recommenders.genre import genre_recommender
from backend.app.routers import movies_router, recommendations_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("moviematch.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: pre-load movie catalogue and ML model artifacts once at startup."""
    logger.info("Initializing MovieMatch ML backend...")

    # 1. Load movie catalogue
    logger.info("Pre-loading movie catalogue...")
    catalogue.load()

    # 2. Load recommendation models
    logger.info("Pre-loading Popularity recommender...")
    popularity_recommender.load()

    logger.info("Pre-loading TF-IDF recommender...")
    tfidf_recommender.load()

    logger.info("Pre-loading Genre recommender...")
    genre_recommender.load()

    logger.info("All MovieMatch models loaded successfully. Serving anonymous recommendation requests!")
    yield
    logger.info("MovieMatch backend shutting down.")


app = FastAPI(
    title="MovieMatch API",
    description="Machine Learning Movie Recommendation Platform API (Anonymous Inference)",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS for GitHub Pages and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(movies_router)
app.include_router(recommendations_router)


@app.get("/", tags=["Health"])
def root():
    """Root entrypoint."""
    return {
        "name": "MovieMatch API",
        "version": "2.0.0",
        "status": "healthy",
        "docs_url": "/docs"
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify ML model readiness."""
    models_ready = {
        "catalogue": catalogue.is_loaded,
        "popularity": popularity_recommender.is_loaded,
        "tfidf": tfidf_recommender.is_loaded,
        "genre": genre_recommender.is_loaded,
    }
    all_ready = all(models_ready.values())

    return {
        "status": "ok" if all_ready else "degraded",
        "environment": ENVIRONMENT,
        "models": models_ready
    }


if __name__ == "__main__":
    import uvicorn
    from backend.app.config import HOST, PORT
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=True)
