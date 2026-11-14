import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set testing environment
os.environ["ENVIRONMENT"] = "testing"

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.utils.catalogue import catalogue
from backend.app.recommenders.popularity import popularity_recommender
from backend.app.recommenders.tfidf import tfidf_recommender
from backend.app.recommenders.genre import genre_recommender

# In-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def preload_models():
    """Ensure catalogue and ML models are loaded for tests."""
    catalogue.load()
    popularity_recommender.load()
    tfidf_recommender.load()
    genre_recommender.load()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test function."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def auth_headers(client):
    """Helper fixture to register and log in a test user, returning auth headers."""
    user_data = {
        "username": "moviefan",
        "email": "moviefan@example.com",
        "password": "securepassword123"
    }
    resp = client.post("/auth/register", json=user_data)
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
