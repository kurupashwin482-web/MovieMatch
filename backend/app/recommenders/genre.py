import logging
import pickle
from typing import Dict, List, Set
import numpy as np
import pandas as pd
from backend.app.config import ARTIFACTS_DIR, TOP_K_RECOMMENDATIONS
from backend.app.utils.catalogue import catalogue

logger = logging.getLogger("moviematch.recommenders.genre")


class GenreRecommender:
    """
    Genre-Based Movie Recommender using Multi-Hot Genre Vectors,
    Positive-Only Rating Profiles, and Bayesian Movie Quality Blending.
    """

    def __init__(self):
        self.all_genres: List[str] = []
        self.genre_matrix: np.ndarray = np.array([])
        self.movie_genre_normalized: np.ndarray = np.array([])
        self.movie_to_idx: Dict[int, int] = {}
        self.catalogue_movie_ids: np.ndarray = np.array([])
        self.catalogue_titles: np.ndarray = np.array([])
        self.quality_scores: np.ndarray = np.array([])
        self.profile_method: str = "positive"
        self.alpha: float = 0.5
        self.top_k: int = TOP_K_RECOMMENDATIONS
        self.is_loaded: bool = False

    def load(self):
        """Load precomputed genre model artifact once during startup."""
        if self.is_loaded:
            return

        genre_model_path = ARTIFACTS_DIR / "genre_model.pkl"
        logger.info(f"Loading genre model from {genre_model_path}...")

        with open(genre_model_path, "rb") as f:
            artifacts = pickle.load(f)

        self.all_genres = artifacts["all_genres"]
        self.genre_matrix = artifacts["genre_matrix"].astype(np.float32)
        self.movie_to_idx = artifacts["movie_to_idx"]
        self.catalogue_movie_ids = artifacts["catalogue_movie_ids"]
        self.catalogue_titles = artifacts["catalogue_titles"]
        self.quality_scores = artifacts["quality_scores"].astype(np.float32)
        self.profile_method = artifacts.get("profile_method", "positive")
        self.alpha = float(artifacts.get("alpha", 0.5))
        self.top_k = int(artifacts.get("top_k", TOP_K_RECOMMENDATIONS))

        # Precompute normalized movie genre vectors for fast cosine similarity
        movie_genre_norms = np.linalg.norm(self.genre_matrix, axis=1, keepdims=True)
        movie_genre_norms[movie_genre_norms == 0] = 1.0
        self.movie_genre_normalized = self.genre_matrix / movie_genre_norms

        self.is_loaded = True
        logger.info(
            f"Genre recommender loaded matrix {self.genre_matrix.shape} "
            f"for {len(self.catalogue_movie_ids)} catalogue movies (alpha={self.alpha})."
        )

    def recommend(
        self,
        movie_ratings: Dict[int, float],
        k: int = TOP_K_RECOMMENDATIONS
    ) -> List[Dict]:
        """
        Generate personalized genre recommendations from user ratings.

        Mathematical Formulation:
            1. User Preference Profile:
               P_u = sum_i max(0, r_{ui} - 3) * G_i
            2. Genre Similarity:
               G(u, m) = clip( (P_u / ||P_u||) . (G_m / ||G_m||), 0, 1 )
            3. Final Recommendation Score:
               S(u, m) = alpha * G(u, m) + (1 - alpha) * Q(m)
               where Q(m) is the Bayesian movie quality score and alpha = 0.5.

        Parameters
        ----------
        movie_ratings : Dict[int, float]
            User ratings {tmdbId: rating}.
        k : int
            Number of movies to return (default 10).

        Returns
        -------
        List[Dict]
            List of top K recommended movies.
        """
        if not self.is_loaded:
            self.load()

        if not movie_ratings:
            return []

        # 1. Build user genre preference profile using positive weighting: w(r) = max(0, r - 3)
        profile = np.zeros(len(self.all_genres), dtype=np.float32)
        rated_ids_set = set(movie_ratings.keys())

        for movie_id, rating in movie_ratings.items():
            if movie_id not in self.movie_to_idx:
                continue
            weight = max(0.0, float(rating) - 3.0)
            if weight > 0:
                profile += weight * self.genre_matrix[self.movie_to_idx[movie_id]]

        # 2. Normalize profile vector
        norm = np.linalg.norm(profile)
        if norm > 0:
            profile_norm = profile / norm
            genre_scores = np.clip(profile_norm @ self.movie_genre_normalized.T, 0.0, 1.0)
        else:
            # If all ratings <= 3.0, profile is 0; fallback to zero similarity
            genre_scores = np.zeros(len(self.catalogue_movie_ids), dtype=np.float32)

        # 3. Combine genre similarity and Bayesian quality scores
        combined_scores = (
            self.alpha * genre_scores
            + (1.0 - self.alpha) * self.quality_scores
        )

        # 4. Exclude movies already rated by the user
        candidate_mask = ~np.isin(self.catalogue_movie_ids, list(rated_ids_set))
        candidate_indices = np.flatnonzero(candidate_mask)

        if len(candidate_indices) == 0:
            return []

        # 5. Rank eligible candidates by combined score descending
        candidate_combined = combined_scores[candidate_indices]
        top_positions = np.argsort(candidate_combined)[::-1][:k]
        top_indices = candidate_indices[top_positions]

        # 6. Format recommended movies
        recommendations = []
        for idx in top_indices:
            tmdb_id = int(self.catalogue_movie_ids[idx])
            movie_meta = catalogue.get_movie(tmdb_id)
            score = float(combined_scores[idx])

            if movie_meta:
                item = dict(movie_meta)
            else:
                item = {
                    "tmdbId": tmdb_id,
                    "title": str(self.catalogue_titles[idx]),
                    "release_year": None,
                    "genres": [],
                    "overview": "",
                    "avg_rating": None,
                    "rating_count": 0,
                    "poster_path": None,
                    "poster_url": None,
                }

            item["score"] = round(score, 4)
            item["score_type"] = "genre"
            item["genre_similarity"] = round(float(genre_scores[idx]), 4)
            item["bayesian_quality"] = round(float(self.quality_scores[idx]), 4)
            recommendations.append(item)

        return recommendations


genre_recommender = GenreRecommender()
