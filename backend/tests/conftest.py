import os
import pytest
from fastapi.testclient import TestClient

os.environ["ENVIRONMENT"] = "testing"

from backend.app.main import app
from backend.app.utils.catalogue import catalogue
from backend.app.recommenders.popularity import popularity_recommender
from backend.app.recommenders.tfidf import tfidf_recommender
from backend.app.recommenders.genre import genre_recommender


@pytest.fixture(scope="session", autouse=True)
def preload_models():
    """Ensure catalogue and ML models are preloaded once for test execution."""
    catalogue.load()
    popularity_recommender.load()
    tfidf_recommender.load()
    genre_recommender.load()


@pytest.fixture(scope="function")
def client():
    """FastAPI TestClient for anonymous API requests."""
    with TestClient(app) as test_client:
        yield test_client
