from backend.app.recommenders.popularity import popularity_recommender
from backend.app.recommenders.tfidf import tfidf_recommender
from backend.app.recommenders.genre import genre_recommender

__all__ = ["popularity_recommender", "tfidf_recommender", "genre_recommender"]
