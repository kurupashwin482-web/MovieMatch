# MovieMatch — A Comparative Study of Movie Recommendation Approaches

**Course:** ES 335: Machine Learning (Undergraduate Course Project)  
**Public Web Application:** [https://kurupashwin482-web.github.io/MovieMatch/](https://kurupashwin482-web.github.io/MovieMatch/)  
**Live Backend API:** [https://moviematch-backend.onrender.com](https://moviematch-backend.onrender.com)  
**Development Repository Branch:** [`backend-n-api-integration`](https://github.com/kurupashwin482-web/MovieMatch/tree/backend-n-api-integration)

---

## 1. Project Title & Overview

**MovieMatch** is an end-to-end machine learning system and interactive web platform that investigates, evaluates, and deploys three distinct recommendation paradigms:
1. **Bayesian Popularity-Based Recommender** (Non-personalized consensus baseline using IMDb shrinkage)
2. **TF-IDF Content-Based Recommender** (High-dimensional plot semantic profile matching across 20,000 features)
3. **Multi-Hot Genre Hybrid Recommender** (20-dimensional categorical taste matching blended with Bayesian movie quality)

The project bridges theoretical machine learning research with practical software engineering:
- **Offline ML Research**: Four Jupyter notebooks document the complete data pipeline, mathematical modeling, parameter selection, and offline evaluation across ranking metrics (Precision@K, Recall@K, NDCG@K).
- **Production Web Application**: A React Single Page Application (SPA) deployed to GitHub Pages and a stateless FastAPI backend deployed to Render. The platform offers **anonymous, zero-setup access**: visitors search catalogue movies, submit star ratings persisted in browser `localStorage`, and dynamically unlock personalized ML recommendations after rating at least five films—without requiring account registration, passwords, or personal data.

---

## 2. Problem Formulation

Modern media and streaming platforms face fundamental algorithmic challenges when matching users to items:

- **The Cold-Start Dilemma:** New visitors have zero interaction history. The system must immediately surface engaging, high-confidence titles without crashing or returning empty results.
- **Extreme Vocabulary Sparsity:** Movie plot descriptions contain thousands of natural language terms. Raw word matching suffers from synonym mismatch, unobserved negatives, and severe sparsity.
- **Popularity Bias vs. Personalization:** Naive average ratings over-reward obscure titles with a single 5-star review, while uncalibrated popularity models continuously recommend the same blockbusters regardless of individual taste.

### Mathematical Definition of the Recommendation Task

Given a catalogue of movies $M = \{m_1, m_2, \ldots, m_N\}$ and a visitor $u$ who has rated a subset of movies, let the user's rating history be:

$$
R(u) = \{(m, r_{um}) \mid m \in M_u\}
$$

where:

- $M_u$ is the set of movies rated by user $u$.
- $r_{um}$ is the rating given by user $u$ to movie $m$, where $r_{um} \in [0.5, 5.0]$.

The goal is to generate an ordered list of $K = 10$ previously unrated candidate movies.

The set of candidate movies is:

$$
C(u) = M \setminus M_u
$$

The recommendation system calculates a model-specific score $S(u,m)$ for every candidate movie. It sorts the candidates in descending order of their scores and returns the 10 highest-scoring movies.

Here, $S(u,m)$ represents the scoring function specific to each recommendation method.

---

## 3. Recommendation Methods & Mathematical Formulations

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MovieMatch Recommendation Framework                    │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ 1. Bayesian Popularity   │ 2. TF-IDF Content Profile   │ 3. Multi-Hot Genre Hybrid     │
│ (IMDb Weighted Rating)   │ (20,000 Plot Text Features) │ (Taste & Quality Blend, α=0.5)│
│                          │                             │                               │
│  WR = (v/(v+m))R +       │  Pu = Σ w(r) · Vi           │  Pu = Σ max(0, r-3) · Gi      │
│       (m/(v+m))C         │  sim = (Pu · Vm)/(||Pu||||Vm||)│  S = α G(u,m) + (1-α) Q(m) │
│  - No ratings required   │  - Min 5 ratings required   │  - Min 5 ratings required     │
│  - Cold-start baseline   │  - Specific plot tropes     │  - Best offline Recall/NDCG   │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### A. Popularity-Based Recommender (Bayesian Shrinkage Baseline)
* **Notebook**: `Notebooks/02_popularity.ipynb`
* **Artifact**: `dataset/processed/popularity_ranking.csv` (12,652 movies)
* **Mathematical Formulation**:
  To prevent obscure movies with a single 5.0-star rating from dominating top ranks, I implement the **IMDb Bayesian Weighted Rating formula**:

$$
WR(m) = \left(\frac{v}{v + m}\right) R + \left(\frac{m}{v + m}\right) C
$$

  where:
  - $v$: Number of user ratings for the movie (`rating_count`).
  - $R$: Arithmetic mean rating of the movie (`avg_rating`).
  - $m$: 70th percentile rating volume threshold ($m = 17.0$ in small sample, $m = 43.0$ in full dataset).
  - $C$: Global mean rating across all rated catalogue movies ($C \approx 3.05$ / $3.52$).
* **Shrinkage Intuition**: For movies with low review volume ($v \ll m$), the score is pulled ($shrunk$) toward the global prior mean $C$. As rating volume grows ($v \gg m$), the empirical mean $R$ dominates.
* **Serving Rule**: Computes instantaneously with zero visitor ratings. Automatically filters out movies already rated by the visitor.

---

### B. TF-IDF Content-Based Recommender (Plot Semantic Profile)
* **Notebook**: `Notebooks/03_tfidf_recommender.ipynb`
* **Artifacts**: `Backend Artifacts/tfidf_matrix.pkl` ($12,794 \times 20,000$ sparse matrix), `movie_id_to_index.pkl`, `tfidf_vectorizer.pkl`.
* **Mathematical Formulation**:
  1. **Text Representation**: Term Frequency-Inverse Document Frequency extracts 20,000 unigrams and bigrams from cleaned plot summaries (`overview`):

$$
\text{TF}(t, d) = \frac{f_{t,d}}{\sum_{t' \in d} f_{t', d}}, \quad \text{IDF}(t, D) = \ln\left(\frac{1 + |D|}{1 + |\{d \in D : t \in d\}|}\right) + 1
$$

$$
\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \text{IDF}(t, D)
$$

  2. **Dynamic User Taste Profile**: Constructed from the visitor's ratings using a signed linear weighting scheme:

$$
P_u = \sum_{i \in \text{Rated}(u)} w(r_{ui}) \cdot V_i
$$

     where the rating weight $w(r)$ is:

$$
w(r) = \begin{cases} 0.1 & \text{if } r = 3.0 \\ r - 3.0 & \text{otherwise} \end{cases}
$$

     - Ratings above 3.0 positively amplify vocabulary terms (e.g., $r=5.0 \implies w=+2.0$).
     - Ratings below 3.0 penalize vocabulary terms (e.g., $r=1.0 \implies w=-2.0$).
     - Neutral ratings ($r=3.0$) provide mild positive anchoring ($w=+0.1$).
  3. **Similarity Scoring**: Computes cosine similarity between profile vector $P_u$ and all movie feature vectors $V_m$:

$$
\text{sim}(P_u, V_m) = \frac{P_u \cdot V_m}{\|P_u\| \|V_m\|}
$$

* **Serving Rule**: Requires at least **5 distinct rated movies**; excludes already-rated movies and movies without overviews.

---

### C. Genre-Based Hybrid Recommender (Taste & Quality Blend)

- **Notebook:** `Notebooks/04_Genre_Based_Movie_Recommendation_System.ipynb`
- **Artifact:** `Backend Artifacts/genre_model.pkl` (12,262 movies × 20 genres, normalized quality scores, and catalogue metadata).

**1. Multi-Hot Binary Encoding**

Each movie is represented by a binary vector containing 20 positions, one for each genre. A value of 1 indicates that the movie belongs to that genre; 0 indicates that it does not.

**2. Positive-Only User Profile**

The user's genre preference profile is calculated using only ratings above 3.

**Formula:**

Pᵤ = Σ max(0, rᵤᵢ − 3) × Gᵢ

Here:
- Pᵤ = User's genre preference profile.
- rᵤᵢ = Rating given by user u to movie i.
- Gᵢ = Genre vector of movie i.

Movies rated above 3 contribute to the user's genre preferences. Movies rated 3 or below do not contribute. This avoids assuming that disliking one movie means disliking its entire genre.

**3. Cosine Genre Similarity**

The similarity between the user's genre profile and a candidate movie is calculated using cosine similarity.

**Formula:**

G(u, m) = (Pᵤ · Gₘ) / (‖Pᵤ‖ × ‖Gₘ‖)

A higher similarity score indicates a stronger match between the candidate movie's genres and the user's preferences.

**4. Hybrid Quality Score Integration**

Genre similarity is combined with the normalized Bayesian movie quality score.

**Formula:**

S(u, m) = α × G(u, m) + (1 − α) × Q(m)

Where:
- G(u, m) = Genre similarity between the user and movie.
- Q(m) = Normalized Bayesian quality score of the movie.
- α = 0.5, giving equal importance to personal genre preferences and overall movie quality.

**Serving Rule:** Requires at least 5 distinct rated movies and returns the top 10 highest-ranked movies that the user has not already rated.
---

## 4. Dataset Description & Sources

The project utilizes **The Movies Dataset** (curated by Rounak Banik on Kaggle), combining metadata from The Movie Database (TMDB) API and user ratings from GroupLens Research (MovieLens):

| Dataset File | Source | Records | Important Columns | Unit of Observation & Role in MovieMatch |
| :--- | :--- | :--- | :--- | :--- |
| `movies_metadata.csv` | TMDB / Kaggle | 45,466 raw | `id`, `title`, `overview`, `release_date`, `genres`, `poster_path` | One row represents a film. Provides textual overviews and poster paths. |
| `links.csv` / `links_small.csv` | MovieLens / GroupLens | 45,843 / 9,125 | `movieId`, `imdbId`, `tmdbId` | Relational bridge linking MovieLens `movieId` to TMDB `tmdbId`. |
| `ratings.csv` / `ratings_small.csv` | MovieLens / GroupLens | 26M / 100k | `userId`, `movieId`, `rating`, `timestamp` | One row per rating event (0.5 to 5.0 stars). Used for offline evaluation and global rating statistics. |
| `movies_clean.csv` | Processed Output | 12,794 | `tmdbId`, `title`, `release_year`, `genres`, `overview`, `avg_rating`, `rating_count` | Cleaned modern catalogue (post-2010) powering all three recommendation models. |
| `popularity_ranking.csv` | Processed Output | 12,652 | `tmdbId`, `title`, `release_year`, `avg_rating`, `rating_count`, `weighted_rating` | Precomputed global ranking table using IMDb Bayesian weighted rating formula. |

### Dataset Access Instructions & Citations
- **Source Repository**: Kaggle — [The Movies Dataset](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset)
- **MovieLens Data**: GroupLens Research — [MovieLens Datasets](https://grouplens.org/datasets/movielens/)
- To inspect local files: `dataset/raw/` contains sample metadata, links, and ratings (`ratings_small.csv`).

---

## 5. Exploratory Data Analysis and Preprocessing Pipeline

Documented in detail in `Notebooks/01_data_preparation.ipynb`:
1. **Identifier Coercion & Quality Auditing**: Converted TMDB IDs to numeric values, dropping corrupted non-numeric records.
2. **Cardinality Resolution**: Resolved duplicate TMDB IDs in `links.csv` and metadata by prioritizing entries with complete plot overviews.
3. **Temporal Filtering**: Restricted the catalogue to modern films released from **2010 onward** (`release_date >= '2010-01-01'`) to ensure high overview coverage and contemporary relevance.
4. **Rating Aggregation**: Grouped interaction ratings by `tmdbId` to compute empirical sample means (`avg_rating`) and review counts (`rating_count`).
5. **Genre Deserialization**: Converted stringified JSON genre dictionaries into Python lists of genre names using `ast.literal_eval`.

---

## 6. Project Structure

```text
MovieMatch/
│
├── .github/
│   └── workflows/
│       └── deploy-pages.yml            # GitHub Pages automated build & deployment workflow
│
├── Backend Artifacts/                  # Precomputed production model artifacts
│   ├── genre_model.pkl                 # Multi-hot genre matrix (12,262 x 20), quality scores Q(m), alpha=0.5
│   ├── links_columns.csv               # MovieLens to TMDB ID mappings schema
│   ├── movie_id_to_index.pkl           # TMDB ID to TF-IDF matrix row index dictionary
│   ├── movies_clean.csv                # Cleaned movie catalogue (12,794 movies)
│   ├── tfidf_matrix.pkl                # Sparse TF-IDF matrix (12,794 x 20,000 float64)
│   └── tfidf_vectorizer.pkl            # Fitted TfidfVectorizer (English stopwords, 1-2 ngrams)
│
├── dataset/                            # Dataset directory
│   ├── processed/
│   │   ├── movies_clean.csv            # Cleaned post-2010 movie catalogue
│   │   └── popularity_ranking.csv      # Precomputed IMDb Bayesian weighted rating rankings
│   └── raw/
│       ├── keywords.csv
│       ├── links.csv                   # Full ID mappings
│       ├── links_small.csv             # Small ID mappings
│       ├── movies_metadata.csv         # Raw TMDB metadata (contains poster paths)
│       └── ratings_small.csv           # 100k sample interaction ratings
│
├── Notebooks/                          # Research, evaluation, and documentation notebooks
│   ├── 01_data_preparation.ipynb       # Data understanding, cleaning, and preprocessing
│   ├── 02_popularity.ipynb             # Bayesian popularity recommender baseline
│   ├── 03_tfidf_recommender.ipynb      # TF-IDF plot summary recommender & evaluation
│   └── 04_Genre_Based_Movie_Recommendation_System.ipynb # Hybrid genre recommender & tuning
│
├── backend/                            # FastAPI ML Inference Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                   # Paths, CORS origins, and hyperparameter constants
│   │   ├── main.py                     # FastAPI entry point, lifespan artifact loader, CORS
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── movies.py               # Catalogue search, genre listing, single movie lookup
│   │   │   └── recommendations.py      # Stateless ML inference endpoints
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── movie.py                # Pydantic response models
│   │   │   └── recommendation.py       # Recommendation payload & response schemas
│   │   ├── recommenders/
│   │   │   ├── __init__.py
│   │   │   ├── genre.py                # Multi-hot genre hybrid inference class
│   │   │   ├── popularity.py           # Bayesian popularity ranking class
│   │   │   └── tfidf.py                # TF-IDF cosine similarity inference class
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── catalogue.py            # In-memory catalogue index & poster resolver
│   │       └── tmdb.py                 # Optional TMDB image fallback client
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                 # Pytest test fixtures
│   │   ├── test_movies.py              # Search, filter, and pagination unit tests
│   │   └── test_recommendations.py     # ML inference fidelity & constraint unit tests
│   ├── .env.example                    # Backend environment template
│   ├── Procfile                        # Render start command
│   └── requirements.txt                # Pinned backend dependencies
│
├── frontend/                           # React (Vite) Frontend Application
│   ├── public/
│   │   └── data/                       # Bundled static data fallback assets
│   │       ├── catalogue.json          # Top 2,524 queryable movies with posters
│   │       ├── genres.json             # 20 unique genres list
│   │       └── popularity.json         # Top 50 Bayesian popularity recommendations
│   ├── src/
│   │   ├── components/
│   │   │   ├── MovieCard.jsx           # Movie card with poster, badges, overview & star rating
│   │   │   ├── MovieSearchSection.jsx  # Debounced catalogue search, genre filter & pagination
│   │   │   ├── Navbar.jsx              # Navigation header with rated movie counter
│   │   │   ├── RatedMoviesSection.jsx  # LocalStorage ratings manager & delete controls
│   │   │   ├── RatingProgressBar.jsx   # Visual unlocking progress bar (X / 5 rated)
│   │   │   ├── RecommendationSection.jsx # Algorithm tab switcher & locked state cards
│   │   │   ├── StarRating.jsx          # Interactive 0.5 to 5.0 star rating widget
│   │   │   └── Toast.jsx               # Floating feedback alerts
│   │   ├── context/
│   │   │   └── RatingsContext.jsx      # Browser localStorage state provider
│   │   ├── services/
│   │   │   ├── api.js                  # Resilient API client with AbortController & fallback
│   │   │   └── storage.js              # Versioned localStorage service (moviematch_ratings_v1)
│   │   ├── App.jsx                     # Top-level application layout
│   │   ├── index.css                   # Dark cinematic CSS styling
│   │   └── main.jsx                    # React DOM entry point
│   ├── .env.example                    # Frontend environment template
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # Node dependencies
│   ├── package-lock.json
│   └── vite.config.js                  # Vite configuration with base: /MovieMatch/
│
├── scripts/                            # Automation, verification & generation scripts
│   ├── format_notebook_1.py            # Formatter for 01_data_preparation.ipynb
│   ├── format_notebook_2.py            # Formatter for 02_popularity.ipynb
│   ├── format_notebook_3.py            # Formatter for 03_tfidf_recommender.ipynb
│   ├── format_notebook_4.py            # Formatter for 04_Genre_Based_Movie_Recommendation_System.ipynb
│   ├── generate_static_data.py         # Static dataset compiler for frontend public/data
│   └── test_frontend_functionality.mjs # 29-test automated node verification suite
│
├── render.yaml                         # Render blueprint configuration
├── .gitignore                          # Clean ignore rules
└── README.md                           # Comprehensive project documentation
```

---

## 7. Experimental Evaluation Methodology

### A. Data Splitting & User Filtering
To evaluate personalized models objectively, I filtered the interaction history for active users with at least **100 rated catalogue movies**:
- **TF-IDF Evaluation**: 80% training history, 20% held-out test ratings per user across **4,574 active users**.
- **Genre Evaluation**: 60% training history, 20% validation set (for hyperparameter tuning), and 20% held-out test set across **1,540 active users**.

### B. Relevance Ground Truth
A held-out test movie is classified as a true positive ("relevant") if the user gave it a favorable rating:

$$
\text{Relevant}(u) = \{m \in \text{Test}(u) \mid r_{um} \ge 3.5\}
$$

### C. Evaluation Metrics (at Cutoff $K = 10$)
1. **Precision@10**: Proportion of recommended movies that are relevant:

$$
\text{Precision}@K = \frac{|\text{Top-}K(u) \cap \text{Relevant}(u)|}{K}
$$

2. **Recall@10**: Proportion of all relevant test movies captured in the top-10 list:

$$
\text{Recall}@K = \frac{|\text{Top-}K(u) \cap \text{Relevant}(u)|}{|\text{Relevant}(u)|}
$$

3. **NDCG@10 (Normalized Discounted Cumulative Gain)**: Measures ranking quality, penalizing relevant items appearing lower in the recommended list:

$$
\text{DCG}@K = \sum_{i=1}^K \frac{2^{\text{rel}_i} - 1}{\log_2(i + 1)}, \quad \text{NDCG}@K = \frac{\text{DCG}@K}{\text{IDCG}@K}
$$

---

## 8. Results & Comparative Analysis

The table below summarizes the macro-averaged evaluation results obtained from the experimental research notebooks on held-out test users:

| Recommendation Model | Model Type | Precision@10 | Recall@10 | NDCG@10 | Key Strengths | Primary Weaknesses |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **Popularity Baseline** | Global Bayesian Prior | Baseline | Baseline | Baseline | Zero setup; resolves cold-start; surfaces consensus high-quality films. | Zero personalization; identical recommendations for all users; popularity bias. |
| **TF-IDF Content-Based** | 20,000-dim Text Profile | **0.0204** (2.04%) | **0.0096** (0.96%) | **0.0226** (2.26%) | Highly explainable; captures specific plot themes (e.g. superhero, space, heist). | Extreme vocabulary sparsity; quality blind; 82.7% zero-recall due to vocabulary mismatch. |
| **Genre-Based Hybrid ($\alpha = 0.5$)** | Multi-Hot & Quality Blend | **0.1698** (16.98%) | **0.0527** (5.27%) | **0.1836** (18.36%) | **8.3x higher Precision** and **8.1x higher NDCG** than TF-IDF; dense representation; balances taste and quality. | Coarser granularity (only 20 genres); cannot distinguish subgenres or directing style. |

### Technical Interpretation of Experimental Results
1. **The Power of Dense Categorical Representations**: The Multi-Hot Genre model dramatically outperforms pure TF-IDF across all ranking metrics (**Precision@10 of 16.98% vs 2.04%**). Because genres are curated and universal across all catalogue movies, the user profile avoids the vocabulary mismatch that plagues free-text plot summaries.
2. **The Necessity of Quality Blending ($\alpha = 0.5$)**: In validation tuning, pure genre matching without quality ($\alpha = 1.0$) achieved a Recall@10 of only $0.0069$. Blending genre similarity with normalized Bayesian quality scores ($\alpha = 0.5$) increased Recall@10 by **7.5x** (to $0.0520$), confirming that users evaluate recommendations based on both topical relevance and perceived cinematic quality.
3. **Offline Recommender Evaluation Realities**: In offline evaluation, any unrated test movie is scored as non-relevant ($0$), artificially depressing absolute precision and recall figures. However, relative comparisons remain rigorous and statistically robust.

---

## 9. Interactive Web Application

The MovieMatch web application allows evaluators to interact with the models directly:

1. **Explore & Search Catalogue**: Browse 2,524 catalogue movies across 106 pages, search by title with 250ms debouncing (e.g. *Inception*, *The Dark Knight*, *Toy Story*), and filter by 20 distinct genres.
2. **Rate Movies (Anonymous LocalStorage)**: Rate movies using interactive 0.5–5.0 star controls. Ratings persist across page refreshes under browser `localStorage` (`moviematch_ratings_v1`). No account, email, or password required.
3. **Progress Tracking**: A dynamic progress bar tracks rated movies ($X / 5$ rated).
4. **Compare All Three Models**:
   - **Popularity-Based Tab**: Available immediately upon landing (excludes movies you have rated).
   - **TF-IDF Content Tab**: Unlocks after 5 ratings; dynamically constructs a 20,000-dimensional vector profile.
   - **Genre-Based Tab**: Unlocks after 5 ratings; blends multi-hot genre profile with Bayesian quality scores ($\alpha = 0.5$).
5. **Manage & Clear Ratings**: View and delete individual ratings or clear all stored data in one click in the "My Ratings" view.

---

## 10. Technology Stack & Library Inventory

| Category | Technology / Library | Version | Purpose in MovieMatch |
| :--- | :--- | :--- | :--- |
| **Language** | Python | 3.12.3 | Core programming language for data pipelines, ML models, and backend API. |
| **Data Processing** | Pandas | 3.1.1 | High-performance DataFrame operations, grouping, and metadata filtering. |
| **Numerical Computing** | NumPy | 2.5.4 | Multi-hot binary genre matrices, cosine dot products, and vector norms. |
| **Machine Learning** | Scikit-Learn | 1.6.1 | `TfidfVectorizer`, sparse cosine similarity, and train/test evaluation splitting. |
| **Sparse Computation** | SciPy | 1.18.1 | Sparse CSR matrix representation (`scipy.sparse.csr_matrix`) for 20k TF-IDF vectors. |
| **Visualization** | Matplotlib | 3.11.2 | Bayesian shrinkage scatter plots and rating distribution figures in research notebooks. |
| **Serialization** | Joblib & Pickle | 1.6.0 | Serializing and loading production model matrices and index mappings. |
| **Backend Framework** | FastAPI | 0.162.7 | Asynchronous high-performance REST API serving stateless ML inference. |
| **Schema Validation** | Pydantic | 2.14.3 | Strict request/response typing and payload validation. |
| **ASGI Web Server** | Uvicorn | 0.54.0 | Production ASGI server powering the Render web service. |
| **Testing** | Pytest | 9.2.0 | Automated unit and integration testing suite for backend endpoints. |
| **Frontend Framework** | React | 18.3.1 | Declarative component-based user interface and state management. |
| **Build Tooling** | Vite | 5.4.10 | Modern high-speed frontend bundler configured for GitHub Pages subpaths. |
| **UI Iconography** | Lucide React | 0.453.0 | Modern SVG iconography for tabs, filters, and star rating widgets. |
| **Frontend Hosting** | GitHub Pages | CDN | Static hosting for the React SPA via automated GitHub Actions CI/CD. |
| **Backend Hosting** | Render | Free Tier | Cloud web service hosting the containerized FastAPI backend. |

---

## 11. Local Setup & Reproduction Instructions

Any student or evaluator can run MovieMatch locally in under two minutes:

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ and npm

### 1. Clone the Repository
```bash
git clone https://github.com/kurupashwin482-web/MovieMatch.git
cd MovieMatch
git checkout backend-n-api-integration
```

### 2. Backend Setup & Startup
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run backend test suite (all 14 tests pass)
PYTHONPATH=. pytest backend/tests/ -v

# Start FastAPI server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger documentation is available at: `http://localhost:8000/docs`

### 3. Frontend Setup & Startup
```bash
# In a new terminal window
cd frontend
npm ci

# Start Vite development server
npm run dev
```
Open your browser at: `http://localhost:5173`

### 4. Running the Jupyter Notebooks
```bash
# With virtual environment activated
jupyter notebook Notebooks/
```
All four notebooks are pre-executed with complete cell outputs and can be re-executed from beginning to end.

---

## 12. Deployment Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GitHub Pages (Frontend SPA)                     │
│               https://kurupashwin482-web.github.io/MovieMatch/         │
│  - React 18 + Vite static build                                        │
│  - Browser localStorage (moviematch_ratings_v1)                        │
│  - Bundled fallback dataset (public/data/) for zero-latency browsing   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (Stateless REST Payload)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Render (FastAPI ML Service)                     │
│                  https://moviematch-backend.onrender.com               │
│  - Python 3.12 + FastAPI                                               │
│  - In-memory pre-loaded artifacts (tfidf_matrix.pkl, genre_model.pkl)  │
│  - Sub-5ms stateless inference per recommendation request              │
│  - CORS enabled for GitHub Pages origin                                │
└────────────────────────────────────────────────────────────────────────┘
```

- **Resilient Fallback Design**: If the Render free-tier backend is cold-starting (~50s spin-up), the frontend automatically uses its client-side dataset (`frontend/public/data/catalogue.json`) with strict `AbortController` timeouts, ensuring visitors can browse, search, and rate movies without delays.

---

## 13. Limitations

1. **Temporal Catalogue Scope:** The catalogue is restricted to 12,794 films released between 2010 and 2017 with available TMDB mappings. Obscure foreign titles or post-2023 releases are not represented.
2. **Cold-Start Constraint:** Personalized models (TF-IDF and Genre) require at least 5 distinct movie ratings to construct a meaningful user profile.
3. **Vocabulary Sparsity in Text:** TF-IDF cannot recognize semantic synonyms (e.g., "astronaut" vs. "cosmonaut") without dense contextual embeddings.
4. **Coarse Genre Categorization:** With only 20 broad genres, the genre recommender cannot distinguish sub-genres (e.g., Psychological Thriller vs. Slasher Horror).
5. **Movie Image Availability:** Not all movies have available poster images in the catalogue or from the external image source. As a result, some movie cards may display a placeholder instead of a poster. This is a limitation of image availability and does not affect the recommendation algorithms or their ranking scores.
6. **Render Free-Tier Latency:** Render free instances sleep after 15 minutes of inactivity; the initial wake-up request may take approximately 50 seconds.
---

## 14. Future Improvements

1. **Dense Transformer Embeddings**: Replace sparse TF-IDF with pre-trained sentence transformers (e.g., `all-MiniLM-L6-v2`) to capture deep semantic synonyms across plot descriptions.
2. **Collaborative Filtering & Matrix Factorization**: Integrate Singular Value Decomposition (SVD) or Alternating Least Squares (ALS) to capture latent collaborative community patterns.
3. **Neural Hybrid Recommenders**: Implement a two-tower neural network architecture combining user demographic features, genre embeddings, and text vectors.
4. **Cross-Device Cloud Syncing**: Add optional anonymous session tokens (e.g. magic link or QR code) to transfer browser ratings across devices.

---

## 15. References & Academic Citations

1. **MovieLens Dataset**: Harper, F. M., & Konstan, J. A. (2015). *The MovieLens Datasets: History and Context.* ACM Transactions on Interactive Intelligent Systems (TiiS), 5(4), 1-19. [https://doi.org/10.1145/2827872](https://doi.org/10.1145/2827872)
2. **The Movies Dataset**: Banik, R. (2017). *The Movies Dataset (Kaggle).* [https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset)
3. **Information Retrieval & TF-IDF**: Manning, C. D., Raghavan, P., & Schütze, H. (2008). *Introduction to Information Retrieval.* Cambridge University Press. [https://nlp.stanford.edu/IR-book/](https://nlp.stanford.edu/IR-book/)
4. **Recommender Systems Handbook**: Ricci, F., Rokach, L., & Shapira, B. (2015). *Recommender Systems Handbook.* Springer.
5. **Scikit-Learn**: Pedregosa, F., et al. (2011). *Scikit-learn: Machine Learning in Python.* Journal of Machine Learning Research, 12, 2825-2830. [https://scikit-learn.org/](https://scikit-learn.org/)
6. **FastAPI**: Ramírez, S. (2018). *FastAPI framework, high performance, easy to learn, fast to code, ready for production.* [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)

---

## 16. AI Assistance & Ethical Disclosure

In accordance with academic integrity guidelines for **ES 335: Machine Learning**:

- **Theoretical & Algorithmic Ownership**: The foundational recommendation algorithms, formulas, rating-weighting schemes ($w(r)$), hyperparameter grid search choices ($\alpha = 0.5$), and experimental evaluations were conceived, implemented, and analyzed independently by the author.
- **ChatGPT (OpenAI)**: Used during early project phases for conceptual discussions, exploring alternative weighting functions for rating profiles, comparing evaluation metrics (Recall vs NDCG), debugging complex Pandas merge syntax, and reviewing documentation drafts.
- **Google Antigravity (Advanced Agentic Assistant)**: Used during system engineering phases as an interactive pair-programmer to assist with:
  - Refactoring research notebook code into modular, typed FastAPI services (`backend/app/`).
  - Developing React UI components and browser `localStorage` management.
  - Adding `AbortController` timeouts and static catalogue fallbacks to eliminate infinite loading spinners.
  - Generating automated pytest and Node integration test suites.
  - Organizing and standardizing Jupyter Notebook structures into 9–11 section academic reports.
- **Verification**: All AI-assisted code, mathematical equations, and documentation were thoroughly reviewed, verified, and locally executed by the author. I take full academic responsibility for the final submission.

---

## 17. Project Author & Academic Context

- **Author**: Ashwin Kurup
- **Course**: ES 335: Machine Learning
- **Institution**: Undergraduate Academic Coursework
- **Project Structure**: Individual Course Project
- **Core Focus**: Recommender systems, Bayesian shrinkage estimators, TF-IDF feature extraction, multi-hot genre representations, offline top-K evaluation, and full-stack ML deployment.
- **Statement of Independence**: This project was conceived, implemented, evaluated, and documented independently by Ashwin Kurup as an individual course project for ES 335: Machine Learning.
