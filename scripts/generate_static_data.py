#!/usr/bin/env python3
"""
Generate static JSON assets for the MovieMatch frontend:
- frontend/public/data/genres.json (List of 20 unique genres)
- frontend/public/data/catalogue.json (Top ~2,500 popular & queryable movies)
- frontend/public/data/popularity.json (Top 50 IMDb Bayesian popular movies)

Ensures instantaneous, resilient client-side browsing, searching, and fallback
even when the backend instance is sleeping, cold-starting, or offline.
"""
import json
from pathlib import Path
import pandas as pd
from backend.app.utils.catalogue import catalogue

def main():
    print("Pre-loading movie catalogue...")
    catalogue.load()

    # 1. Genres
    genres = catalogue.all_genres
    print(f"Extracted {len(genres)} unique genres.")

    # 2. Popularity rankings
    pop_csv_path = Path("dataset/processed/popularity_ranking.csv")
    if not pop_csv_path.exists():
        raise FileNotFoundError(f"{pop_csv_path} not found.")

    pop_df = pd.read_csv(pop_csv_path)
    print(f"Loaded {len(pop_df)} popularity rankings.")

    # Select top 2,500 movies by popularity
    selected_ids = list(pop_df["tmdbId"].head(2500))

    # Ensure key test movies and franchises are always included
    extra_queries = [
        "Inception", "The Dark Knight", "Toy Story", "Batman", "Star Wars",
        "Avatar", "Interstellar", "Pulp Fiction", "Matrix", "Godfather",
        "Fight Club", "Forrest Gump", "Shawshank", "Avengers", "Lord of the Rings"
    ]
    selected_set = set(selected_ids)
    for q in extra_queries:
        total, movies = catalogue.search_movies(query=q, limit=50)
        for m in movies:
            if m["tmdbId"] not in selected_set:
                selected_ids.append(m["tmdbId"])
                selected_set.add(m["tmdbId"])

    print(f"Selected {len(selected_ids)} movies for static catalogue.")

    # Format catalogue list matching MovieResponse schema
    catalogue_list = []
    for mid in selected_ids:
        movie = catalogue.get_movie(mid)
        if movie:
            overview = movie.get("overview", "")
            trimmed_overview = (overview[:240] + "...") if len(overview) > 240 else overview
            rec = {
                "tmdbId": movie["tmdbId"],
                "title": movie["title"],
                "release_year": movie["release_year"],
                "genres": movie["genres"],
                "overview": trimmed_overview,
                "avg_rating": movie["avg_rating"],
                "rating_count": movie["rating_count"],
                "poster_url": movie["poster_url"],
                "score": round(float(movie.get("avg_rating", 0) or 0), 2),
                "score_type": "imdb_rating"
            }
            catalogue_list.append(rec)

    # Top 50 Bayesian popularity recommendations
    pop_recommendations = []
    for mid in pop_df["tmdbId"].head(50):
        m = catalogue.get_movie(mid)
        if m:
            overview = m.get("overview", "")
            trimmed_overview = (overview[:240] + "...") if len(overview) > 240 else overview
            rec = {
                "tmdbId": m["tmdbId"],
                "title": m["title"],
                "release_year": m["release_year"],
                "genres": m["genres"],
                "overview": trimmed_overview,
                "avg_rating": m["avg_rating"],
                "rating_count": m["rating_count"],
                "poster_url": m["poster_url"],
                "score": round(float(m.get("avg_rating", 0) or 0), 2),
                "score_type": "popularity_rank"
            }
            pop_recommendations.append(rec)

    out_dir = Path("frontend/public/data")
    out_dir.mkdir(parents=True, exist_ok=True)

    with open(out_dir / "genres.json", "w", encoding="utf-8") as f:
        json.dump(genres, f, indent=2)

    with open(out_dir / "catalogue.json", "w", encoding="utf-8") as f:
        json.dump(catalogue_list, f, separators=(",", ":"))

    with open(out_dir / "popularity.json", "w", encoding="utf-8") as f:
        json.dump(pop_recommendations, f, separators=(",", ":"))

    print(f"Generated genres.json ({out_dir / 'genres.json'})")
    print(f"Generated catalogue.json ({out_dir / 'catalogue.json'})")
    print(f"Generated popularity.json ({out_dir / 'popularity.json'})")

if __name__ == "__main__":
    main()
