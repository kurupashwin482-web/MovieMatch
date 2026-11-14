#!/usr/bin/env python3
"""
Format and reorganize Notebook 2: 02_popularity.ipynb
Simplifies academic language, uses first-person singular narration ("I"),
and provides concise step-by-step explanations below every key code cell.
"""
import json
from pathlib import Path

def make_cell(cell_type, source, outputs=None, execution_count=None):
    if isinstance(source, list):
        src = [s if s.endswith("\n") else s + "\n" for s in source]
    else:
        src = [s + "\n" for s in source.split("\n")]
    if src and src[-1] == "\n":
        src = src[:-1]
    cell = {
        "cell_type": cell_type,
        "metadata": {},
        "source": src
    }
    if cell_type == "code":
        cell["execution_count"] = execution_count
        cell["outputs"] = outputs or []
    return cell

def build_notebook_2():
    PROJECT_ROOT = Path(__file__).resolve().parent.parent
    cells = []

    # 1. Introduction and Objective
    cells.append(make_cell("markdown", """# 02 — Popularity-Based Movie Recommender (Bayesian Baseline)

## 1. Introduction and Objective

In this notebook, I build the **Popularity-Based Recommender** for MovieMatch. This is the first of my three recommendation approaches, and it serves as the foundation and baseline for my entire project.

### Why I Need a Popularity Baseline
1. **Solving the Cold-Start Problem**: When a new user visits my website, they have not rated any movies yet. Because personalized models need user preferences to work, a popularity-based model provides an immediate, high-quality list of recommendations without requiring any prior information.
2. **Serving as an Experimental Benchmark**: In machine learning, I cannot claim that a personalized algorithm (like TF-IDF or Genre) is effective without comparing it against a simple, non-personalized baseline. The popularity model serves as that benchmark.

### Objective
I implement the **IMDb Bayesian Weighted Rating formula** to rank all 12,652 rated movies in my catalogue and export the ranking table to `dataset/processed/popularity_ranking.csv`."""))

    # 2. Methodology
    cells.append(make_cell("markdown", """## 2. Methodology: IMDb Bayesian Weighted Rating

If I simply sorted movies by their raw average rating, an obscure movie with a single 5-star rating from one person would rank higher than *Inception* or *The Dark Knight* with tens of thousands of reviews.

To fix this problem, I use the **IMDb Bayesian Weighted Rating formula**:

$$WR = \\left(\\frac{v}{v + m}\\right) R + \\left(\\frac{m}{v + m}\\right) C$$

### Variables in the Formula
- **$v$ (`rating_count`)**: The number of ratings received by the movie.
- **$R$ (`avg_rating`)**: The movie's arithmetic average rating.
- **$m$**: The minimum vote threshold (I set this to the **70th percentile** of all rating counts).
- **$C$**: The global average rating across all rated movies in the catalogue.

### How Bayesian Shrinkage Works
The formula uses a concept called **shrinkage**:
- If a movie has very few ratings ($v$ is small compared to $m$), the term $\\frac{m}{v+m}$ is large, which pulls the score closer to the overall catalogue average $C$.
- If a movie has many ratings ($v$ is large compared to $m$), the term $\\frac{v}{v+m}$ is large, allowing the movie's actual average rating $R$ to dominate.
- This prevents low-sample flukes from reaching the top while fairly rewarding genuinely popular and highly rated movies."""))

    # 3. Data Preparation
    cells.append(make_cell("markdown", """## 3. Data Preparation

I import the required libraries and load the preprocessed movie catalogue (`movies_clean.csv`) that I created in Notebook 01."""))

    cells.append(make_cell("code", """from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Dynamic path resolution
NOTEBOOK_DIR = Path.cwd()
PROJECT_ROOT = NOTEBOOK_DIR.parent if NOTEBOOK_DIR.name == "Notebooks" else NOTEBOOK_DIR

candidates = [
    PROJECT_ROOT / "dataset" / "processed" / "movies_clean.csv",
    PROJECT_ROOT / "Backend Artifacts" / "movies_clean.csv",
    Path("/content/movies_clean.csv"),
    Path("/content/drive/MyDrive/MovieMatch/movies_clean.csv"),
]

catalogue_path = None
for p in candidates:
    if p.exists():
        catalogue_path = p
        break

if not catalogue_path:
    raise FileNotFoundError("movies_clean.csv not found.")

print(f"Loading catalogue from: {catalogue_path}")
movies_clean = pd.read_csv(catalogue_path)

print(f"Total movies loaded: {len(movies_clean):,}")
display(movies_clean[["tmdbId", "title", "release_year", "avg_rating", "rating_count"]].head(3))"""))

    cells.append(make_cell("markdown", """### What this step does
I load the 12,794 cleaned movies produced in Notebook 01. Each movie has its TMDB ID, title, release year, genres, plot overview, average rating, and rating count."""))

    cells.append(make_cell("code", """# Filter for movies that have received at least one rating
rated_movies = movies_clean.dropna(subset=["avg_rating", "rating_count"]).copy()
rated_movies["rating_count"] = rated_movies["rating_count"].astype(float)
rated_movies["avg_rating"] = rated_movies["avg_rating"].astype(float)

# Compute global prior constants
C = rated_movies["avg_rating"].mean()
m = rated_movies["rating_count"].quantile(0.70)

print(f"Number of rated movies: {len(rated_movies):,}")
print(f"Global mean rating (C): {C:.4f}")
print(f"70th percentile vote count threshold (m): {m:.2f}")"""))

    cells.append(make_cell("markdown", """### Explanation of Output
- **$C \\approx 3.05$**: The average rating across all rated movies in the catalogue. This acts as the baseline prior score.
- **$m = 17.00$** (or $43.0$ in the full dataset): The 70th percentile of rating counts. A movie needs roughly this many ratings before its score can move significantly away from $C$."""))

    # 4. Popularity Score Calculation
    cells.append(make_cell("markdown", """## 4. Popularity Score Calculation

Now I calculate the weighted rating ($WR$) for every rated movie in the catalogue using the formula above."""))

    cells.append(make_cell("code", """# Calculate the weighted rating
v = rated_movies["rating_count"]
R = rated_movies["avg_rating"]

rated_movies["weighted_rating"] = (v / (v + m)) * R + (m / (v + m)) * C

print("Weighted ratings calculated successfully.")
display(rated_movies[["title", "release_year", "rating_count", "avg_rating", "weighted_rating"]].head(5))"""))

    cells.append(make_cell("markdown", """### Explanation
Notice how movies with few ratings have their `weighted_rating` pulled towards $C \\approx 3.05$, while movies with high rating counts maintain scores closer to their empirical average $R$."""))

    # 5. Generating Recommendations
    cells.append(make_cell("markdown", """## 5. Generating Recommendations

I sort the catalogue by `weighted_rating` in descending order and define a reusable recommendation function."""))

    cells.append(make_cell("code", """# Sort catalogue by weighted rating
popularity_ranking = rated_movies.sort_values(
    by="weighted_rating",
    ascending=False
).reset_index(drop=True)

def recommend_popular_movies(k=10, exclude_ids=None):
    \"\"\"
    Return the top K movies ranked by Bayesian weighted rating.
    \"\"\"
    if k <= 0:
        raise ValueError("k must be positive.")

    df = popularity_ranking
    if exclude_ids:
        df = df[~df["tmdbId"].isin(set(exclude_ids))]

    cols = ["tmdbId", "title", "release_year", "genres", "avg_rating", "rating_count", "weighted_rating"]
    return df.head(k)[cols]

print("Top 10 Popularity-Based Recommendations:")
display(recommend_popular_movies(10))"""))

    cells.append(make_cell("markdown", """### What the Recommendations Show
The top-ranked movies are widely acclaimed titles like *Inception* (2010), *Planet Earth II* (2016), and *Whiplash* (2014). Each has accumulated both high volume and high average ratings. These are safe, high-confidence recommendations for visitors who have not yet rated any movies."""))

    # 6. Evaluation Methodology
    cells.append(make_cell("markdown", """## 6. Evaluation Methodology

### How I Evaluate the Baseline
In recommender systems, I compare popularity against personalized models using standard top-10 metrics:
- **Precision@10**: How many of the recommended 10 movies the user actually liked in their test set.
- **Recall@10**: What percentage of all the user's liked test movies were captured in the top 10.
- **NDCG@10**: Measures whether relevant movies appear near the top of the list.

Because the popularity model gives the same list of consensus movies to everyone, it achieves reasonable precision on popular items but low recall for users with niche tastes. This sets the benchmark that my TF-IDF and Genre models aim to beat."""))

    # 7. Results and Interpretation
    cells.append(make_cell("markdown", """## 7. Results and Interpretation

I create a scatter plot comparing raw average rating ($R$) against the Bayesian weighted rating ($WR$) to visualize how the shrinkage effect works across vote volumes."""))

    cells.append(make_cell("code", """# Plot raw rating vs weighted rating
fig, ax = plt.subplots(figsize=(8, 5))
scatter = ax.scatter(
    rated_movies["rating_count"],
    rated_movies["weighted_rating"],
    c=rated_movies["avg_rating"],
    cmap="plasma",
    alpha=0.6,
    s=25
)
ax.axhline(C, color="red", linestyle="--", label=f"Global Mean (C = {C:.2f})")
ax.axvline(m, color="blue", linestyle=":", label=f"70th Percentile (m = {m:.1f})")
ax.set_xscale("log")
ax.set_xlabel("Number of Ratings (Log Scale)", fontsize=10)
ax.set_ylabel("Bayesian Weighted Rating (WR)", fontsize=10)
ax.set_title("Bayesian Shrinkage: Weighted Rating vs Number of Ratings", fontsize=12, fontweight="bold")
ax.grid(True, alpha=0.3)
fig.colorbar(scatter, ax=ax, label="Raw Average Rating (R)")
ax.legend(loc="lower right")

plt.tight_layout()
plt.show()"""))

    cells.append(make_cell("markdown", """### What the Graph Shows and Why It Matters
This graph clearly shows the **funnel shape** of Bayesian shrinkage:
- On the left (movies with very few ratings), scores are squashed towards the red horizontal line ($C \\approx 3.05$), filtering out noisy 5-star ratings from small sample sizes.
- On the right (movies with hundreds or thousands of ratings), movies spread out according to their true quality, allowing genuinely great films to reach scores above 4.0."""))

    # 8. Error Analysis and Limitations
    cells.append(make_cell("markdown", """## 8. Error Analysis and Limitations

While this model is a robust baseline, it has clear limitations:
1. **No Personalization**: Every user receives the exact same list regardless of their individual preferences. A fan of indie horror receives the same suggestions as a fan of romantic comedies.
2. **Popularity Bias**: Blockbusters stay at the top, making it harder for lesser-known quality films to be discovered.
3. **Static Nature**: The recommendations do not change until global rating counts are updated."""))

    # 9. Conclusion
    cells.append(make_cell("markdown", """## 9. Conclusion

### Summary
The Popularity-Based Recommender provides an effective, reliable baseline that prevents small-sample rating bias and requires zero user input.

### Saving the Processed Artifact
I export the ranked table to `dataset/processed/popularity_ranking.csv`. My web application uses this file to serve instant popularity recommendations to visitors."""))

    cells.append(make_cell("code", """# Save canonical popularity rankings
output_csv = PROJECT_ROOT / "dataset" / "processed" / "popularity_ranking.csv"
output_csv.parent.mkdir(parents=True, exist_ok=True)

popularity_ranking.to_csv(output_csv, index=False)
print(f"Saved popularity rankings ({len(popularity_ranking):,} movies) to: {output_csv}")"""))

    nb_data = {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3 (ipykernel)",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "codemirror_mode": {"name": "ipython", "version": 3},
                "file_extension": ".py",
                "mimetype": "text/x-python",
                "name": "python",
                "nbconvert_exporter": "python",
                "pygments_lexer": "ipython3",
                "version": "3.12.3"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 5
    }

    out_file = PROJECT_ROOT / "Notebooks" / "02_popularity.ipynb"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(nb_data, f, indent=1)
    print(f"Successfully generated clean {out_file} ({len(cells)} cells)")

if __name__ == "__main__":
    build_notebook_2()
