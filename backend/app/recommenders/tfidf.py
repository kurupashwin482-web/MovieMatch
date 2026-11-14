import logging
from typing import Dict, List, Optional, Set
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from backend.app.config import ARTIFACTS_DIR, TOP_K_RECOMMENDATIONS
from backend.app.utils.catalogue import catalogue

logger = logging.getLogger("moviematch.recommenders.tfidf")


class TFIDFRecommender:
    """TF-IDF Content-Based Movie Recommender using Weighted User Preference Profiles."""

    def __init__(self):
        self.tfidf_matrix = None
        self.movie_id_to_index: Dict[int, int] = {}
        self.vectorizer = None
        self.valid_indices: np.ndarray = np.array([])
        self.is_loaded: bool = False

    def load(self):
        """Load TF-IDF matrix, vectorizer, and index mapping once during backend startup."""
        if self.is_loaded:
            return

        matrix_path = ARTIFACTS_DIR / "tfidf_matrix.pkl"
        mapping_path = ARTIFACTS_DIR / "movie_id_to_index.pkl"
        vectorizer_path = ARTIFACTS_DIR / "tfidf_vectorizer.pkl"

        logger.info(f"Loading TF-IDF artifacts from {ARTIFACTS_DIR}...")
        self.tfidf_matrix = joblib.load(matrix_path)
        self.movie_id_to_index = joblib.load(mapping_path)

        if vectorizer_path.exists():
            try:
                self.vectorizer = joblib.load(vectorizer_path)
            except Exception as e:
                logger.warning(f"Could not load vectorizer: {e}")

        # Ensure movie catalogue is loaded to know which movies have overviews
        if not catalogue.is_loaded:
            catalogue.load()

        movies_df = catalogue.movies_df
        if "overview_clean" in movies_df.columns:
            has_overview = movies_df["overview_clean"].fillna("").str.strip().ne("").to_numpy()
        else:
            has_overview = movies_df["overview"].fillna("").str.strip().ne("").to_numpy()

        self.valid_indices = np.flatnonzero(has_overview)
        self.is_loaded = True
        logger.info(
            f"TF-IDF recommender loaded matrix {self.tfidf_matrix.shape} "
            f"with {len(self.movie_id_to_index)} mapped movies."
        )

    def recommend(
        self,
        movie_ratings: Dict[int, float],
        k: int = TOP_K_RECOMMENDATIONS
    ) -> List[Dict]:
        """
        Generate personalized content-based recommendations from user's ratings.

        Parameters
        ----------
        movie_ratings : Dict[int, float]
            Dictionary of {tmdbId: rating} where rating is between 0.5 and 5.0.
        k : int
            Number of recommendations to return (default 10).

        Returns
        -------
        List[Dict]
            List of recommended movie dictionaries with content scores.
        """
        if not self.is_loaded:
            self.load()

        if not movie_ratings:
            return []

        # 1. Build weighted user preference profile
        # Ratings above 3 receive positive weights (rating - 3).
        # Ratings below 3 receive negative weights (rating - 3).
        # Neutral ratings (3.0) receive a small positive weight (0.1).
        profile = None
        rated_indices_set = set()

        for movie_id, rating in movie_ratings.items():
            if movie_id not in self.movie_id_to_index:
                continue

            idx = self.movie_id_to_index[movie_id]
            rated_indices_set.add(idx)
            movie_vector = self.tfidf_matrix[idx]
            weight = 0.1 if float(rating) == 3.0 else float(rating) - 3.0

            if profile is None:
                profile = weight * movie_vector
            else:
                profile = profile + weight * movie_vector

        if profile is None:
            return []

        # 2. Check profile informativeness
        profile_norm = np.sqrt(profile.multiply(profile).sum())
        if profile_norm < 1e-10:
            logger.info("User preference profile norm is near zero; returning empty recommendations.")
            return []

        # 3. Calculate cosine similarity with all movie vectors
        scores = cosine_similarity(profile, self.tfidf_matrix).ravel()

        # 4. Filter candidate movies: exclude watched/rated movies & movies without overviews
        candidate_indices = [
            idx for idx in self.valid_indices
            if idx not in rated_indices_set
        ]

        if not candidate_indices:
            return []

        # 5. Rank candidate indices by similarity score descending
        candidate_scores = scores[candidate_indices]
        top_k_positions = np.argsort(candidate_scores)[::-1][:k]
        top_indices = [candidate_indices[pos] for pos in top_k_positions]

        # 6. Format recommended movies
        recommendations = []
        for idx in top_indices:
            row = catalogue.movies_df.iloc[idx]
            tmdb_id = int(row["tmdbId"])
            movie_meta = catalogue.get_movie(tmdb_id)
            score = float(scores[idx])

            if movie_meta:
                item = dict(movie_meta)
            else:
                item = {
                    "tmdbId": tmdb_id,
                    "title": str(row.get("title", "")),
                    "release_year": int(row.get("release_year", 0)) if pd.notna(row.get("release_year")) else None,
                    "genres": row.get("genres_list", []),
                    "overview": str(row.get("overview", "")),
                    "avg_rating": round(float(row.get("avg_rating")), 2) if pd.notna(row.get("avg_rating")) else None,
                    "rating_count": int(row.get("rating_count", 0)) if pd.notna(row.get("rating_count")) else 0,
                    "poster_path": None,
                    "poster_url": None,
                }

            item["score"] = round(score, 4)
            item["score_type"] = "tfidf"
            recommendations.append(item)

        return recommendations


tfidf_recommender = TFIDFRecommender()
