import logging
from typing import Dict, List, Set
import pandas as pd
from backend.app.config import POPULARITY_PATH, TOP_K_RECOMMENDATIONS
from backend.app.utils.catalogue import catalogue

logger = logging.getLogger("moviematch.recommenders.popularity")


class PopularityRecommender:
    """Popularity-Based Movie Recommender using Bayesian Weighted Rating (IMDb formula)."""

    def __init__(self):
        self.ranking_df: pd.DataFrame = pd.DataFrame()
        self.is_loaded: bool = False

    def load(self):
        """Load the precomputed popularity rankings from dataset/processed/popularity_ranking.csv."""
        if self.is_loaded:
            return

        if POPULARITY_PATH.exists():
            logger.info(f"Loading popularity ranking from {POPULARITY_PATH}...")
            df = pd.read_csv(POPULARITY_PATH)
        else:
            logger.info("Popularity ranking file not found; computing from catalogue...")
            if not catalogue.is_loaded:
                catalogue.load()
            movies = catalogue.movies_df.dropna(subset=["avg_rating", "rating_count"]).copy()
            c = movies["avg_rating"].mean()
            m = movies["rating_count"].quantile(0.70)
            movies["weighted_rating"] = (
                (movies["rating_count"] / (movies["rating_count"] + m)) * movies["avg_rating"]
                + (m / (movies["rating_count"] + m)) * c
            )
            df = movies.sort_values(by="weighted_rating", ascending=False).reset_index(drop=True)

        df["tmdbId"] = df["tmdbId"].astype(int)
        self.ranking_df = df
        self.is_loaded = True
        logger.info(f"Popularity recommender loaded {len(self.ranking_df)} ranked movies.")

    def recommend(self, rated_movie_ids: Set[int], k: int = TOP_K_RECOMMENDATIONS) -> List[Dict]:
        """
        Return the top K popular movies, strictly excluding movies already rated by the user.

        Parameters
        ----------
        rated_movie_ids : Set[int]
            Set of TMDB movie IDs that the user has rated.
        k : int
            Number of recommendations to return (default 10).

        Returns
        -------
        List[Dict]
            List of movie recommendation objects with metadata and weighted rating score.
        """
        if not self.is_loaded:
            self.load()

        # Exclude movies already rated by user
        candidate_mask = ~self.ranking_df["tmdbId"].isin(rated_movie_ids)
        candidates = self.ranking_df[candidate_mask].head(k)

        recommendations = []
        for _, row in candidates.iterrows():
            tmdb_id = int(row["tmdbId"])
            movie_meta = catalogue.get_movie(tmdb_id)
            score = float(row["weighted_rating"]) if "weighted_rating" in row else None

            if movie_meta:
                item = dict(movie_meta)
            else:
                item = {
                    "tmdbId": tmdb_id,
                    "title": str(row.get("title", "")),
                    "release_year": int(row.get("release_year", 0)) if pd.notna(row.get("release_year")) else None,
                    "genres": [],
                    "overview": str(row.get("overview", "")),
                    "avg_rating": round(float(row.get("avg_rating")), 2) if pd.notna(row.get("avg_rating")) else None,
                    "rating_count": int(row.get("rating_count", 0)) if pd.notna(row.get("rating_count")) else 0,
                    "poster_path": None,
                    "poster_url": None,
                }

            item["score"] = round(score, 4) if score is not None else None
            item["score_type"] = "popularity"
            recommendations.append(item)

        return recommendations


popularity_recommender = PopularityRecommender()
