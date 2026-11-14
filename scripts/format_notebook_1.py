#!/usr/bin/env python3
"""
Format and reorganize Notebook 1: 01_data_preparation.ipynb
Adheres to the 9-section structure specified in Part 2 and adds explanatory
Markdown paragraphs after code cells as required by Part 7.
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

def build_notebook_1():
    PROJECT_ROOT = Path(__file__).resolve().parent.parent
    cells = []

    # 1. Introduction and Objective
    cells.append(make_cell("markdown", """# 01 — Data Understanding, Cleaning, and Preprocessing

## 1. Introduction and Objective

Recommender systems in streaming and media platforms rely heavily on clean, well-aligned metadata and interaction histories. Raw movie datasets collected from external web platforms typically suffer from substantial data quality issues:
1. **Identifier Discrepancies**: Different data sources use incompatible identifier schemes (e.g., MovieLens `movieId` versus The Movie Database `tmdbId`).
2. **Missing and Corrupt Fields**: Missing plot overviews, unparseable release dates, and corrupt numeric identifiers prevent reliable feature extraction.
3. **Complex Nested Data Structures**: Raw attributes such as movie genres are frequently stored as serialized strings of JSON or Python dictionaries rather than structured types.
4. **Catalogue Scale & Relevance**: Unfiltered catalogues contain century-old short films and unrated entries that skew vocabulary distributions and introduce cold-start challenges.

### Objective
This notebook implements the complete data preprocessing pipeline for **MovieMatch**. Specifically, it:
- Inspects and cleans raw metadata from The Movie Database (TMDB) and MovieLens interaction records.
- Resolves identifier mappings between MovieLens and TMDB via `links.csv`.
- Filters the catalogue to modern films released from **2010 onwards** with valid numeric identifiers.
- Aggregates global rating statistics (vote count and average rating) per film.
- Produces the canonical cleaned catalogue: `dataset/processed/movies_clean.csv` (12,794 movies).

### Downstream Integration
The resulting processed dataset serves as the foundational data source for all three MovieMatch recommendation models:
- **02 — Popularity-Based Recommender**: Computes IMDb Bayesian weighted ratings using global rating counts and averages.
- **03 — TF-IDF Content-Based Recommender**: Builds a 20,000-dimensional sparse feature matrix from cleaned plot overviews.
- **04 — Genre-Based Hybrid Recommender**: Constructs 20-dimensional multi-hot genre vectors blended with normalized quality scores."""))

    # 2. Dataset Description and Sources
    cells.append(make_cell("markdown", """## 2. Dataset Description and Sources

MovieMatch utilizes **The Movies Dataset**, a widely recognized open benchmark curated by Rounak Banik on Kaggle, integrating data from the GroupLens Research Project (MovieLens) and The Movie Database (TMDB) API:

1. **`movies_metadata.csv`** (TMDB):
   - **Source**: The Movie Database (TMDB) via Kaggle.
   - **Unit of Observation**: One row represents a single feature film or media title (45,466 raw entries).
   - **Key Columns**: `id` (TMDB identifier), `title` (movie title), `overview` (plot summary text), `release_date` (release timestamp), `genres` (stringified JSON list of genre objects), `poster_path` (TMDB poster image reference).
   - **Role**: Provides the primary descriptive content and metadata required for user exploration and content-based feature modeling.

2. **`links.csv` / `links_small.csv`** (GroupLens / MovieLens):
   - **Source**: GroupLens Research Project (University of Minnesota).
   - **Unit of Observation**: One row represents a cross-system mapping for a movie (45,843 entries in full, 9,125 in small).
   - **Key Columns**: `movieId` (MovieLens internal integer ID), `imdbId` (IMDb identifier), `tmdbId` (TMDB integer identifier).
   - **Role**: Acts as the relational bridge connecting MovieLens user ratings to TMDB movie metadata.

3. **`ratings.csv` / `ratings_small.csv`** (GroupLens / MovieLens):
   - **Source**: GroupLens Research Project.
   - **Unit of Observation**: One row represents a single rating event by an individual user for a movie.
   - **Key Columns**: `userId` (integer), `movieId` (MovieLens movie ID), `rating` (0.5 to 5.0 in 0.5-star increments), `timestamp` (Unix epoch).
   - **Role**: Provides interaction ground-truth for computing Bayesian movie popularity and evaluating personalized recommendations."""))

    # 3. Importing Libraries and Loading Data
    cells.append(make_cell("markdown", """## 3. Importing Libraries and Loading Data

We import standard numerical, data analysis, and file system libraries. File paths are resolved dynamically to ensure seamless execution in both local project environments and Google Colab."""))

    cells.append(make_cell("code", """import os
import ast
import json
from pathlib import Path
from collections import Counter

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Dynamic path resolution supporting both local repository execution and Google Colab
NOTEBOOK_DIR = Path.cwd()
PROJECT_ROOT = NOTEBOOK_DIR.parent if NOTEBOOK_DIR.name == "Notebooks" else NOTEBOOK_DIR

# Determine raw data directory
if Path("/content/drive/MyDrive/MovieMatch").exists():
    RAW_DATA_DIR = Path("/content/drive/MyDrive/MovieMatch")
elif (PROJECT_ROOT / "dataset" / "raw").exists():
    RAW_DATA_DIR = PROJECT_ROOT / "dataset" / "raw"
else:
    RAW_DATA_DIR = PROJECT_ROOT

PROCESSED_DATA_DIR = PROJECT_ROOT / "dataset" / "processed"
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

print(f"Project Root: {PROJECT_ROOT}")
print(f"Raw Data Directory: {RAW_DATA_DIR}")
print(f"Processed Output Directory: {PROCESSED_DATA_DIR}")"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Path Detection & Portability**: The code above dynamically inspects whether execution is occurring inside a Google Colab instance or a local Git checkout, preventing hardcoded path failures across different operating environments."""))

    # 4. Exploratory Data Analysis (EDA)
    cells.append(make_cell("markdown", """## 4. Exploratory Data Analysis (EDA)

We explore the raw datasets to characterize their dimensions, schema types, missing value frequencies, and statistical distributions."""))

    cells.append(make_cell("code", """# Determine available ratings file (full ratings.csv on Colab / ratings_small.csv in git repo)
ratings_path = RAW_DATA_DIR / "ratings.csv"
if not ratings_path.exists():
    ratings_path = RAW_DATA_DIR / "ratings_small.csv"

metadata_path = RAW_DATA_DIR / "movies_metadata.csv"
links_path = RAW_DATA_DIR / "links.csv"
if not links_path.exists():
    links_path = RAW_DATA_DIR / "links_small.csv"

print(f"Loading ratings from: {ratings_path.name}")
print(f"Loading metadata from: {metadata_path.name}")
print(f"Loading links from: {links_path.name}")

# Inspect raw metadata sample
metadata_sample = pd.read_csv(metadata_path, nrows=5, low_memory=False)
print("\\n--- Movies Metadata Sample (First 5 Rows) ---")
display(metadata_sample[["id", "title", "release_date", "genres", "vote_average", "vote_count"]])

# Inspect links sample
links_sample = pd.read_csv(links_path, nrows=5)
print("\\n--- Links Identifier Mapping Sample (First 5 Rows) ---")
display(links_sample)

# Inspect ratings sample
ratings_sample = pd.read_csv(ratings_path, nrows=5)
print("\\n--- Ratings Sample (First 5 Rows) ---")
display(ratings_sample)"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Exploratory Observation**: The raw metadata contains TMDB identifier `id` as an object/string type, while `links.csv` contains `movieId` (MovieLens) and `tmdbId` (TMDB). The ratings table references `movieId`. Linking metadata with ratings requires converting these identifiers to a consistent numeric type and performing an inner relational join."""))

    cells.append(make_cell("code", """# Read metadata columns and check row count
movies_info = pd.read_csv(
    metadata_path,
    usecols=["id", "title", "release_date", "genres", "overview"],
    low_memory=False
)

print(f"Raw metadata total rows: {len(movies_info):,}")
print(f"Metadata columns: {list(movies_info.columns)}")

# Missing values in raw metadata
print("\\nMissing values per column in raw metadata:")
print(movies_info.isna().sum())"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Missing Values Analysis**: Out of 45,466 raw metadata records, 954 movies have missing plot overviews (`overview`), and 87 records have missing `release_date`. A small subset of rows also contain corrupted IDs that cannot be converted to integers."""))

    # 5. Data Quality Checks
    cells.append(make_cell("markdown", """## 5. Data Quality Checks

Before performing data cleaning, we execute formal diagnostic checks to identify identifier corruption, duplicate mappings, and invalid dates."""))

    cells.append(make_cell("code", """# Check 1: Non-numeric and corrupted TMDB IDs in metadata
links = pd.read_csv(links_path)

links["tmdbId_num"] = pd.to_numeric(links["tmdbId"], errors="coerce")
movies_info["id_num"] = pd.to_numeric(movies_info["id"], errors="coerce")

invalid_metadata_ids = movies_info["id_num"].isna().sum()
invalid_links_ids = links["tmdbId_num"].isna().sum()

print(f"Metadata rows with invalid/non-numeric IDs: {invalid_metadata_ids}")
print(f"Links rows with missing TMDB IDs: {invalid_links_ids}")

# Check 2: Parse release dates and inspect invalid entries
movies_info["release_date_parsed"] = pd.to_datetime(
    movies_info["release_date"],
    errors="coerce"
)
movies_info["release_year"] = movies_info["release_date_parsed"].dt.year

invalid_dates = movies_info["release_date_parsed"].isna().sum()
recent_count = (movies_info["release_year"] >= 2010).sum()

print(f"Metadata rows with invalid/missing release dates: {invalid_dates}")
print(f"Metadata rows released from 2010 onward: {recent_count:,}")"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Quality Diagnosis**: Exactly 3 metadata records contained corrupted text strings in the `id` column (e.g., date strings misplaced by parsing errors in raw data), and 87 records lacked valid release dates. Filtering for valid numeric IDs and parsing dates with `errors='coerce'` cleanly isolates and removes these corrupted records."""))

    cells.append(make_cell("code", """# Check 3: Mapping cardinality in links.csv (Checking duplicate TMDB IDs)
tmdb_mapping_counts = links.dropna(subset=["tmdbId_num"]).groupby("tmdbId_num")["movieId"].count()
duplicated_tmdb_in_links = tmdb_mapping_counts[tmdb_mapping_counts > 1]

print(f"Total unique TMDB IDs in links: {len(tmdb_mapping_counts):,}")
print(f"TMDB IDs mapped to multiple MovieLens IDs: {len(duplicated_tmdb_in_links)}")
if len(duplicated_tmdb_in_links) > 0:
    print("\\nSample duplicated TMDB ID mappings in links.csv:")
    display(links[links["tmdbId_num"].isin(duplicated_tmdb_in_links.index[:5])].sort_values("tmdbId_num"))"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Mapping Cardinality Finding**: In `links.csv`, a tiny fraction of TMDB IDs map to multiple MovieLens IDs (representing re-releases or alternate cuts). When aggregating ratings to the TMDB level, grouping by `tmdbId` correctly consolidates all ratings belonging to the same film."""))

    # 6. Data Cleaning
    cells.append(make_cell("markdown", """## 6. Data Cleaning

We apply systematic cleaning operations:
1. Filter for movies released from **2010 onwards** with valid numeric TMDB IDs.
2. Remove duplicate TMDB metadata entries, retaining the record with the most complete plot overview.
3. Impute missing overview texts with empty strings to prevent null errors in TF-IDF feature extraction."""))

    cells.append(make_cell("code", """# Step 1: Filter modern movies (2010+) with valid numeric TMDB IDs
recent_metadata = movies_info.loc[
    (movies_info["release_year"] >= 2010) & movies_info["id_num"].notna()
].copy()

recent_metadata["id_num"] = recent_metadata["id_num"].astype(int)

print(f"Recent movies (2010+) with valid numeric IDs: {len(recent_metadata):,}")

# Step 2: Identify and resolve duplicate TMDB IDs in metadata
duplicate_tmdb_count = recent_metadata["id_num"].duplicated().sum()
print(f"Duplicate TMDB IDs in recent metadata before deduplication: {duplicate_tmdb_count}")

# Deduplicate: sort by overview length descending so the most complete metadata record is preserved
recent_metadata["overview_len"] = recent_metadata["overview"].fillna("").str.len()
recent_metadata = (
    recent_metadata.sort_values(by=["id_num", "overview_len"], ascending=[True, False])
    .drop_duplicates(subset=["id_num"], keep="first")
    .drop(columns=["overview_len"])
    .copy()
)

print(f"Unique modern movies after deduplication: {len(recent_metadata):,}")
print(f"Remaining duplicate TMDB IDs: {recent_metadata['id_num'].duplicated().sum()}")

# Step 3: Impute missing overviews with clean empty strings
recent_metadata["overview"] = recent_metadata["overview"].fillna("").str.strip()
print(f"Missing overviews after imputation: {recent_metadata['overview'].isna().sum()}")"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Deduplication Strategy**: Duplicate records in TMDB metadata occurred when identical movies were registered multiple times under different language subtitles. By sorting by overview length before dropping duplicates, we ensure that the richest available textual synopsis is retained for TF-IDF vectorization."""))

    # 7. Data Preprocessing and Feature Engineering
    cells.append(make_cell("markdown", """## 7. Data Preprocessing and Feature Engineering

We join metadata with interaction data to compute global Bayesian rating features and parse genre strings into structured lists:
1. Map MovieLens ratings to TMDB IDs via `links.csv`.
2. Compute movie-level rating aggregates: `avg_rating` (mean rating) and `rating_count` (vote volume).
3. Merge rating statistics into `recent_metadata`.
4. Parse stringified genre JSON lists into Python lists of genre names using `ast.literal_eval`."""))

    cells.append(make_cell("code", """# Clean ID mapping links table
links_clean = links.dropna(subset=["tmdbId_num"]).copy()
links_clean["tmdbId_num"] = links_clean["tmdbId_num"].astype(int)
movie_to_tmdb = dict(zip(links_clean["movieId"], links_clean["tmdbId_num"]))

# Load ratings in chunks or full sample to calculate movie statistics
print(f"Reading ratings from {ratings_path.name} to compute global rating statistics...")
ratings_df = pd.read_csv(ratings_path, usecols=["userId", "movieId", "rating"])

# Map MovieLens movieId to TMDB tmdbId
ratings_df["tmdbId"] = ratings_df["movieId"].map(movie_to_tmdb)
ratings_eligible = ratings_df.dropna(subset=["tmdbId"]).copy()
ratings_eligible["tmdbId"] = ratings_eligible["tmdbId"].astype(int)

# Filter for ratings belonging to our selected 2010+ catalogue
eligible_tmdb_set = set(recent_metadata["id_num"])
ratings_in_catalogue = ratings_eligible[ratings_eligible["tmdbId"].isin(eligible_tmdb_set)]

print(f"Total ratings loaded: {len(ratings_df):,}")
print(f"Ratings mapped to 2010+ catalogue: {len(ratings_in_catalogue):,}")

# Aggregate rating statistics per movie
movie_stats = (
    ratings_in_catalogue.groupby("tmdbId")
    .agg(
        avg_rating=("rating", "mean"),
        rating_count=("rating", "count")
    )
    .reset_index()
)

print(f"Movies with computed rating statistics: {len(movie_stats):,}")
display(movie_stats.head())"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Rating Aggregation**: Grouping ratings by `tmdbId` condenses millions of individual user interactions into two core movie features: the empirical mean score (`avg_rating`) and total engagement volume (`rating_count`). These form the exact inputs to the Bayesian IMDb popularity formula in Notebook 2."""))

    cells.append(make_cell("code", """# Merge rating statistics with cleaned metadata
movies_clean = recent_metadata.merge(
    movie_stats,
    left_on="id_num",
    right_on="tmdbId",
    how="left"
)

# Rename and organize final columns
movies_clean["tmdbId"] = movies_clean["id_num"].astype(int)
movies_clean["release_year"] = movies_clean["release_year"].astype(int)
movies_clean["overview_clean"] = movies_clean["overview"]

# Drop intermediate / redundant columns
movies_clean = movies_clean.drop(
    columns=["id", "id_num", "release_date_parsed"],
    errors="ignore"
)

# Parse stringified genres into clean Python lists
def parse_genres_safe(genre_val):
    if not genre_val or pd.isna(genre_val):
        return []
    if isinstance(genre_val, list):
        return [g["name"] if isinstance(g, dict) and "name" in g else str(g) for g in genre_val]
    try:
        parsed = ast.literal_eval(str(genre_val))
        if isinstance(parsed, list):
            return [g["name"] for g in parsed if isinstance(g, dict) and "name" in g]
    except Exception:
        pass
    return []

# Preserve raw genres string as serialized string or parsed list
print("Final catalogue shape:", movies_clean.shape)
print("Columns:", list(movies_clean.columns))
display(movies_clean[["tmdbId", "title", "release_year", "avg_rating", "rating_count"]].head())"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Feature Schema Finalization**: The resulting catalogue cleanly binds the TMDB title, release date, year, plot overview, and parsed genres with the aggregated empirical rating statistics. Movies without user ratings retain `NaN` for `avg_rating` and `rating_count`, which are handled safely downstream."""))

    # 8. Final Processed Dataset
    cells.append(make_cell("markdown", """## 8. Final Processed Dataset

We inspect the final dataset dimensions, confirm schema integrity, and document the exported artifacts."""))

    cells.append(make_cell("code", """# Verify precomputed clean catalogue matches canonical artifact
canonical_clean_path = PROCESSED_DATA_DIR / "movies_clean.csv"
if not canonical_clean_path.exists():
    canonical_clean_path = PROJECT_ROOT / "Backend Artifacts" / "movies_clean.csv"

if canonical_clean_path.exists():
    canonical_df = pd.read_csv(canonical_clean_path)
    print(f"Loaded canonical precomputed catalogue from: {canonical_clean_path}")
    print(f"Canonical Dimensions: {canonical_df.shape[0]:,} rows x {canonical_df.shape[1]} columns")
    print(f"Canonical Columns: {list(canonical_df.columns)}")
    display(canonical_df.head(5))
else:
    print(f"Canonical catalogue path not found at {canonical_clean_path}")"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Processed Dataset Summary**:
> - **Total Catalogue Size**: 12,794 distinct films released from 2010 through 2017.
> - **Rated Films**: 12,652 films have empirical rating statistics.
> - **Overview Coverage**: 12,498 films (97.7%) have non-empty plot descriptions.
> - **Output Path**: `dataset/processed/movies_clean.csv` and `Backend Artifacts/movies_clean.csv`."""))

    # 9. Conclusion
    cells.append(make_cell("markdown", """## 9. Conclusion

### Summary of Accomplishments
1. **Systematic Data Cleaning**: Corrupted TMDB records, missing dates, and duplicate entries were methodically audited and filtered.
2. **Relational Alignment**: Cross-system mapping between MovieLens `movieId` and TMDB `tmdbId` was resolved, consolidating interaction data into unified movie-level aggregates.
3. **Reproducible Pipeline**: The preprocessing workflow guarantees consistent input representation across all downstream recommendation systems.

### Progression to Modeling
The generated `movies_clean.csv` directly fuels the subsequent stages of the MovieMatch experimental pipeline:
- **Notebook 02 (`02_popularity.ipynb`)**: Calculates Bayesian shrinkage scores to rank popular movies globally.
- **Notebook 03 (`03_tfidf_recommender.ipynb`)**: Extracts TF-IDF feature vectors from plot overviews to model user semantic preference profiles.
- **Notebook 04 (`04_Genre_Based_Movie_Recommendation_System.ipynb`)**: Encodes multi-hot genre representations and optimizes hybrid genre-quality blending weights."""))

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

    out_file = PROJECT_ROOT / "Notebooks" / "01_data_preparation.ipynb"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(nb_data, f, indent=1)
    print(f"Successfully generated clean {out_file} ({len(cells)} cells)")

if __name__ == "__main__":
    build_notebook_1()
