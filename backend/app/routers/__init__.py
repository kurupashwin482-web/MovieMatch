from backend.app.routers.auth import router as auth_router
from backend.app.routers.movies import router as movies_router
from backend.app.routers.ratings import router as ratings_router
from backend.app.routers.recommendations import router as recommendations_router

__all__ = ["auth_router", "movies_router", "ratings_router", "recommendations_router"]
