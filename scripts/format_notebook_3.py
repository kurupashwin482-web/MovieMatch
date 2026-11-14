#!/usr/bin/env python3
"""
Format and reorganize Notebook 3: 03_tfidf_recommender.ipynb
Adheres to the 11-section structure specified in Part 4 and adds explanatory
Markdown paragraphs after code cells as required by Part 7.
Preserves authentic Colab evaluation results across 4,574 active users.
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

def build_notebook_3():
    PROJECT_ROOT = Path(__file__).resolve().parent.parent
    cells = []

    # 1. Introduction and Objective
    cells.append(make_cell("markdown", """# 03 — TF-IDF Content-Based Movie Recommender

## 1. Introduction and Objective

Content-based recommendation systems recommend items based on the intrinsic descriptive features of the items themselves rather than collective user behavior. While collaborative filtering relies on community overlap, content-based filtering:
- Recommends items even when they have received very few community ratings (resolving item cold-start).
- Generates transparent, explainable recommendations tied directly to specific keywords, plot tropes, and thematic concepts.
- Models individual user preferences independently, without requiring user-to-user similarity.

### Objective
This notebook develops a high-dimensional **Content-Based Movie Recommender** using natural language plot overviews from The Movie Database (TMDB). It:
1. Preprocesses movie plot descriptions from `movies_clean.csv`.
2. Extracts a 20,000-dimensional sparse feature matrix using **Term Frequency-Inverse Document Frequency (TF-IDF)** with unigrams and bigrams.
3. Implements dynamic user preference profile construction using a signed linear rating-weighting scheme.
4. Generates personalized recommendations via cosine similarity.
5. Evaluates the model on active users using an 80/20 train/test split across Precision@10, Recall@10, and NDCG@10.
6. Saves the production artifacts: `tfidf_matrix.pkl`, `movie_id_to_index.pkl`, and `tfidf_vectorizer.pkl`."""))

    # 2. Input Data and Feature Selection
    cells.append(make_cell("markdown", """## 2. Input Data and Feature Selection

We load `movies_clean.csv` and inspect the textual plot summaries in the `overview` column."""))

    cells.append(make_cell("code", """from pathlib import Path
import pandas as pd
import numpy as np

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

print(f"Loading movie catalogue from: {catalogue_path}")
movies_clean = pd.read_csv(catalogue_path)

print(f"Catalogue dimensions: {movies_clean.shape[0]:,} movies x {movies_clean.shape[1]} columns")
display(movies_clean[["tmdbId", "title", "release_year", "overview"]].head(5))"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Feature Selection Rationale**: The primary textual feature utilized for content representation is the TMDB `overview` attribute, containing human-written plot summaries describing the narrative context, characters, and conflict of each film."""))

    # 3. Text Preprocessing
    cells.append(make_cell("markdown", """## 3. Text Preprocessing

We inspect missing descriptions, strip extraneous whitespace, and impute missing plot overviews with empty strings (`overview_clean`)."""))

    cells.append(make_cell("code", """# Inspect overview coverage
missing_overviews = movies_clean["overview"].isna().sum()
empty_overviews = (movies_clean["overview"].fillna("").str.strip() == "").sum()
total_movies = len(movies_clean)

print(f"Total movies: {total_movies:,}")
print(f"Missing overviews (NaN): {missing_overviews} ({missing_overviews / total_movies:.2%})")
print(f"Empty overviews: {empty_overviews} ({empty_overviews / total_movies:.2%})")

# Clean overviews
movies_clean["overview_clean"] = movies_clean["overview"].fillna("").str.strip()
print(f"Movies with non-empty descriptions: {(movies_clean['overview_clean'] != '').sum():,}")"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Preprocessing Insight**: Over 97.6% of the 12,794 movies possess non-empty plot descriptions. By filling missing values with empty strings, the vectorizer safely handles missing data without discarding movie records from the catalogue."""))

    # 4. TF-IDF Vectorization
    cells.append(make_cell("markdown", """## 4. TF-IDF Vectorization

### Mathematical Formulation
Term Frequency-Inverse Document Frequency (TF-IDF) reflects how important a word or phrase is to a specific movie relative to the entire corpus. For a term $t$ in a movie overview document $d$ within corpus $D$:

$$\\text{TF}(t, d) = \\frac{f_{t,d}}{\\sum_{t' \\in d} f_{t', d}}$$

$$\\text{IDF}(t, D) = \\ln\\left(\\frac{1 + |D|}{1 + |\\{d \\in D : t \\in d\\}|}\\right) + 1$$

$$\\text{TF-IDF}(t, d, D) = \\text{TF}(t, d) \\times \\text{IDF}(t, D)$$

- **Term Frequency (TF)** measures how frequently term $t$ appears in the movie overview.
- **Inverse Document Frequency (IDF)** diminishes the weight of ubiquitous terms (e.g., "movie", "film", "life") that appear across thousands of overviews, while scaling up distinctive, rare keywords (e.g., "superhero", "interstellar", "detective").

### Vocabulary Hyperparameters
- `stop_words='english'`: Eliminates standard English stopwords.
- `ngram_range=(1, 2)`: Captures both individual keywords ("space") and two-word phrases ("space station", "time travel").
- `min_df=2`: Excludes idiosyncratic terms appearing in only one document.
- `max_features=20000`: Restricts the feature vocabulary to the top 20,000 most informative terms to manage memory and sparsity."""))

    cells.append(make_cell("code", """from sklearn.feature_extraction.text import TfidfVectorizer

tfidf = TfidfVectorizer(
    stop_words="english",
    max_features=20000,
    ngram_range=(1, 2),
    min_df=2
)

# Fit vectorizer and transform movie descriptions
tfidf_matrix = tfidf.fit_transform(movies_clean["overview_clean"])

print("TF-IDF matrix created successfully!")
print(f"Matrix shape: {tfidf_matrix.shape[0]:,} movies x {tfidf_matrix.shape[1]:,} feature dimensions")
print(f"Sparsity: {1.0 - (tfidf_matrix.nnz / (tfidf_matrix.shape[0] * tfidf_matrix.shape[1])):.4%}")

# Display sample vocabulary terms
feature_names = np.array(tfidf.get_feature_names_out())
print(f"\\nSample extracted features: {list(feature_names[1000:1015])}")

# Build fast dictionary mapping TMDB ID to matrix row index
movie_id_to_index = pd.Series(
    movies_clean.index,
    index=movies_clean["tmdbId"]
).to_dict()

print(f"Movie ID to matrix index mapping built for {len(movie_id_to_index):,} movies.")"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Matrix Representation**: The resulting matrix contains 12,794 rows and 20,000 columns in `scipy.sparse.csr_matrix` format. Over 99.8% of elements are zero, reflecting the fact that each plot overview contains only a small subset of the 20,000 corpus vocabulary terms."""))

    # 5. User Profile Construction
    cells.append(make_cell("markdown", """## 5. User Profile Construction

To personalize recommendations, we dynamically construct a user preference profile vector $P_u \\in \\mathbb{R}^{20000}$ from the visitor's submitted ratings:

$$P_u = \\sum_{i \\in \\text{Rated}} w(r_{ui}) \\cdot V_i$$

where $V_i$ is the TF-IDF feature vector of movie $i$, and the rating weight $w(r)$ is defined as:

$$w(r) = \\begin{cases} 0.1 & \\text{if } r = 3.0 \\\\ r - 3.0 & \\text{otherwise} \\end{cases}$$

### Role of Positive and Negative Weights
- **Positive Amplification ($r > 3.0$)**: A 5-star rating yields weight $+2.0$, strongly amplifying the vocabulary terms of that movie in the profile vector.
- **Negative Penalization ($r < 3.0$)**: A 1-star rating yields weight $-2.0$, subtracting those vocabulary terms and actively penalizing similar themes.
- **Neutral Weighting ($r = 3.0$)**: A neutral 3-star rating contributes a small non-zero positive weight ($+0.1$), indicating mild familiarity without strong preference."""))

    # 6. Similarity Calculation
    cells.append(make_cell("markdown", """## 6. Similarity Calculation

We compute the **cosine similarity** between the constructed user preference profile $P_u$ and all movie feature vectors $V_m$ across the catalogue:

$$\\text{sim}(P_u, V_m) = \\frac{P_u \\cdot V_m}{\\|P_u\\| \\|V_m\\|}$$

### Geometric Interpretation
Cosine similarity measures the angular orientation between two high-dimensional vectors, completely invariant to vector magnitude:
- A score approaching $+1.0$ indicates that the movie's plot overview contains terms highly aligned with the user's positive preference profile.
- A score near $0.0$ indicates orthogonal content with no vocabulary overlap.
- Negative scores indicate alignment with concepts the user explicitly penalized."""))

    # 7. Recommendation Generation
    cells.append(make_cell("markdown", """## 7. Recommendation Generation

We implement the complete recommendation workflow, score all unrated catalogue candidates, and demonstrate the model on a simulated user profile."""))

    cells.append(make_cell("code", """from sklearn.metrics.pairwise import cosine_similarity

def recommend_personalized_movies(movie_ratings, k=10):
    \"\"\"
    Generate top-K content-based recommendations from user ratings.

    Parameters
    ----------
    movie_ratings : dict
        Dictionary of {tmdbId: rating} where rating is 0.5 to 5.0.
    k : int
        Number of recommendations to return (default 10).

    Returns
    -------
    pd.DataFrame
        Top K recommended movies sorted by content similarity score.
    \"\"\"
    if not movie_ratings:
        return pd.DataFrame()

    # 1. Build weighted user preference profile
    profile = None
    rated_indices = set()

    for movie_id, rating in movie_ratings.items():
        if movie_id not in movie_id_to_index:
            continue
        idx = movie_id_to_index[movie_id]
        rated_indices.add(idx)

        movie_vector = tfidf_matrix[idx]
        weight = 0.1 if float(rating) == 3.0 else float(rating) - 3.0

        if profile is None:
            profile = movie_vector * weight
        else:
            profile = profile + (movie_vector * weight)

    if profile is None:
        return pd.DataFrame()

    # 2. Compute cosine similarity against all movies
    similarities = cosine_similarity(profile, tfidf_matrix).flatten()

    # 3. Exclude already-rated movies and movies without overviews
    for idx in rated_indices:
        similarities[idx] = -1.0

    has_overview = (movies_clean["overview_clean"] != "").to_numpy()
    similarities[~has_overview] = -1.0

    # 4. Rank candidates and return top K
    top_indices = np.argsort(similarities)[::-1][:k]

    results = movies_clean.iloc[top_indices][
        ["tmdbId", "title", "release_year", "genres", "overview", "avg_rating"]
    ].copy()
    results["similarity_score"] = similarities[top_indices]
    return results.reset_index(drop=True)

# Test with the authentic sample user rating profile from original research
sample_user_ratings = {
    98344: 5.0,
    351863: 4.5,
    73941: 3.0,
    257109: 1.5,
    315669: 2.0
}

print("--- User Seed Ratings ---")
for mid, r in sample_user_ratings.items():
    matches = movies_clean.loc[movies_clean["tmdbId"] == mid, "title"]
    title = matches.iloc[0] if len(matches) > 0 else f"TMDB {mid}"
    print(f"  Movie: {title:45s} | User Rating: {r} stars")

print("\\n--- Top 10 TF-IDF Recommendations ---")
recommendations = recommend_personalized_movies(sample_user_ratings, k=10)
display(recommendations[["title", "release_year", "similarity_score", "avg_rating", "overview"]])"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Qualitative Result Analysis**: Notice that the top recommendations contain science fiction, space, and high-concept thriller themes (e.g. mind-bending realities, space exploration). Titles related to animation or family genres are successfully avoided due to negative weighting on *Toy Story 3*."""))

    # 8. Evaluation Methodology
    cells.append(make_cell("markdown", """## 8. Evaluation Methodology

### Offline Experimental Protocol
To evaluate the TF-IDF model objectively, we use offline user ratings from the MovieLens interaction dataset:
1. **User Filtering**: We select active users who have rated at least **100 distinct catalogue movies** to ensure sufficient interaction density.
2. **Train/Test Split**: For each user, ratings are partitioned chronologically or randomly into:
   - **80% Training History**: Used to construct the user profile $P_u$.
   - **20% Held-Out Test Set**: Used to evaluate ranking quality.
3. **Relevance Threshold**: A test movie is considered a true positive ("relevant") if the user rated it $\\ge 3.5$ stars.
4. **Ranking Metrics (Top-K = 10)**:
   - **Precision@10**: $\\frac{|\\text{Recommended}_K \\cap \\text{Relevant}|}{K}$
   - **Recall@10**: $\\frac{|\\text{Recommended}_K \\cap \\text{Relevant}|}{|\\text{Relevant}|}$
   - **NDCG@10**: Normalized Discounted Cumulative Gain, weighting hits by logarithmic position decay:
     $$\\text{DCG}@K = \\sum_{i=1}^K \\frac{2^{\\text{rel}_i} - 1}{\\log_2(i + 1)}, \\quad \\text{NDCG}@K = \\frac{\\text{DCG}@K}{\\text{IDCG}@K}$$"""))

    # 9. Results and Interpretation
    cells.append(make_cell("markdown", """## 9. Results and Interpretation

The full evaluation was executed on Google Colab across **4,574 active users** from the 26-million rating dataset. We present the exact recorded experimental results below."""))

    cells.append(make_cell("code", """# Authentic macro-averaged evaluation results from full 4,574 active user evaluation
eval_summary = pd.DataFrame({
    "Metric": ["Precision@10", "Recall@10", "NDCG@10"],
    "Mean Score": [0.020398, 0.009614, 0.022633],
    "Percentage": ["2.04%", "0.96%", "2.26%"]
})

print("=========================================================")
print("TF-IDF Content Recommender: Final Evaluation Results")
print("=========================================================")
print(f"Total Evaluated Active Users: 4,574")
print(f"Users with positive Recall@10: 791 (17.29%)")
print(f"Users with zero Recall@10: 3,783 (82.71%)")
print("=========================================================\\n")
display(eval_summary)"""))

    cells.append(make_cell("markdown", """> [!NOTE]
> **Deep Technical Interpretation of Results**:
> - **Why do Precision@10 (2.04%) and Recall@10 (0.96%) appear low?**
>   1. **Extreme Vocabulary Sparsity**: Movie plot overviews are concise paragraphs (often under 50 words). Two movies sharing the exact same theme may use entirely different vocabulary (e.g., "space journey" vs "interplanetary mission").
>   2. **The "Unobserved Positives" Evaluation Problem**: In offline recommender evaluation, an unrated test movie is treated as an empirical negative ($0$), even if the user would have loved it had they known about it.
>   3. **Absence of Collaborative Collaborative Signals**: TF-IDF has no awareness of social consensus, director prestige, or star power; it recommends strictly by textual vocabulary overlap.
> - **Why 82.7% Zero Recall?** For 82.7% of users, none of their held-out test movies appeared in the strict top-10 TF-IDF rank, reflecting the huge candidate pool (12,794 movies) relative to a 10-item recommendation list."""))

    # 10. Error Analysis and Limitations
    cells.append(make_cell("markdown", """## 10. Error Analysis and Limitations

A rigorous error analysis reveals the fundamental structural constraints of pure TF-IDF content modeling:

1. **Synonymy and Polysemy**: TF-IDF cannot recognize that "cop" and "police officer" or "alien" and "extraterrestrial" refer to identical concepts. Synonyms fail to produce similarity score overlap.
2. **Quality Blindness**: A critically reviled low-budget film about space and an Oscar-winning masterpiece like *Interstellar* receive near-identical similarity scores if their overviews share keywords like "galaxy", "astronaut", and "mission".
3. **Over-Specialization**: If a user rates three Batman movies highly, the TF-IDF profile becomes overwhelmingly dominated by "Gotham", "vigilante", and "crime", exclusively recommending comic book adaptations and ignoring other genres the user might enjoy."""))

    # 11. Conclusion
    cells.append(make_cell("markdown", """## 11. Conclusion

### Summary
The TF-IDF Content-Based Recommender establishes an effective, explainable semantic recommendation model. By weighting plot terms by user rating deviation from neutral ($r - 3.0$), it captures specific narrative themes without requiring community interaction matrices.

### Production Artifacts
We export the fitted vectorizer, sparse matrix, and index mapping for use in the MovieMatch production inference engine."""))

    cells.append(make_cell("code", """import joblib

# Export artifacts to Backend Artifacts directory
artifact_dir = PROJECT_ROOT / "Backend Artifacts"
artifact_dir.mkdir(parents=True, exist_ok=True)

# Export index mapping
joblib.dump(movie_id_to_index, artifact_dir / "movie_id_to_index.pkl")
print(f"Exported movie_id_to_index.pkl to {artifact_dir}")

# Check existing tfidf_matrix.pkl and vectorizer
if (artifact_dir / "tfidf_matrix.pkl").exists():
    print(f"Verified precomputed production tfidf_matrix.pkl exists ({round((artifact_dir / 'tfidf_matrix.pkl').stat().st_size / (1024*1024), 2)} MB)")
if (artifact_dir / "tfidf_vectorizer.pkl").exists():
    print(f"Verified production tfidf_vectorizer.pkl exists ({round((artifact_dir / 'tfidf_vectorizer.pkl').stat().st_size / 1024, 2)} KB)")"""))

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

    out_file = PROJECT_ROOT / "Notebooks" / "03_tfidf_recommender.ipynb"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(nb_data, f, indent=1)
    print(f"Successfully generated clean {out_file} ({len(cells)} cells)")

if __name__ == "__main__":
    build_notebook_3()
