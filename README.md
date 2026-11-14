# MovieMatch — Machine Learning Movie Recommendation System

MovieMatch is a full-stack, machine learning-driven movie recommendation platform developed for the **ES 335: Machine Learning** undergraduate course project. It demonstrates how three distinct recommendation methodologies (Bayesian Popularity, TF-IDF Content-Based Filtering, and Multi-Hot Genre Vector Blending) can be evaluated experimentally and deployed as an interactive web application.

The application is designed for **anonymous, zero-setup access**: visitors and course evaluators can immediately explore movies, submit ratings stored locally in their browser (`localStorage`), and generate personalized recommendations without creating accounts, providing passwords, or installing local software.

---

## 1. Project Overview & Public Access

* **Public Web Application (GitHub Pages)**: [https://kurupashwin482-web.github.io/MovieMatch/](https://kurupashwin482-web.github.io/MovieMatch/)
* **Backend API (Render Web Service)**: [https://moviematch-backend.onrender.com](https://moviematch-backend.onrender.com)
* **GitHub Repository Branch**: [https://github.com/kurupashwin482-web/MovieMatch/tree/backend-n-api-integration](https://github.com/kurupashwin482-web/MovieMatch/tree/backend-n-api-integration)

---

## 2. Problem Statement

Recommender systems in streaming and media services face fundamental algorithmic trade-offs:
1. **Cold-Start Problem**: New users have no prior watch or rating history.
2. **Feature Sparsity**: Movie descriptions contain thousands of vocabulary terms, requiring effective feature representation and weighting.
3. **Popularity Bias vs. Niche Alignment**: Balancing universally acclaimed titles against highly specific individual genre tastes.

MovieMatch investigates and integrates three distinct algorithmic paradigms to address these challenges:
- Baseline Bayesian global ranking for new visitors.
- High-dimensional content profile modeling across 20,000 text features for semantic affinity.
- Multi-hot genre vector similarity blended with Bayesian movie quality scores ($\alpha = 0.5$) for calibrated taste matching.

---

## 3. The Three Recommendation Methods

### A. Popularity-Based Recommender (Global Bayesian Baseline)
* **Reference Notebook**: `Notebooks/02_popularity.ipynb`
* **Artifact**: `dataset/processed/popularity_ranking.csv`
* **Mathematical Formulation**:
  Uses the IMDb Bayesian weighted rating formula:
  $$WR = \left(\frac{v}{v+m}\right) R + \left(\frac{m}{v+m}\right) C$$
  where:
  - $v$: number of ratings for the movie (`rating_count`).
  - $R$: average rating of the movie (`avg_rating`).
  - $m$: 70th percentile threshold of rating counts ($m = 43.0$).
  - $C$: overall mean rating across all rated movies ($C \approx 3.52$).
* **Inference Rule**: Returns top 10 movies ranked by $WR$. Automatically filters out any movies the visitor has already rated. Does not require 5 ratings.

### B. TF-IDF Content-Based Recommender (Plot Semantic Profile)
* **Reference Notebook**: `Notebooks/03_tfidf_recommender.ipynb`
* **Artifacts**: `Backend Artifacts/tfidf_matrix.pkl` (12,794 $\times$ 20,000 sparse matrix), `movie_id_to_index.pkl`, `tfidf_vectorizer.pkl`.
* **Mathematical Formulation**:
  1. Constructs a dynamic visitor preference profile $P_u$ from submitted ratings:
     $$P_u = \sum_{i \in \text{Rated}} w(r_{ui}) \cdot V_i$$
     where rating weights are defined as:
     $$w(r) = \begin{cases} 0.1 & \text{if } r = 3.0 \\ r - 3.0 & \text{otherwise} \end{cases}$$
  2. Ratings above 3.0 positively weight overview vocabulary terms; ratings below 3.0 penalize terms.
  3. Computes cosine similarity between profile vector $P_u$ and all movie vectors in the catalogue:
     $$\text{sim}(P_u, V_m) = \frac{P_u \cdot V_m}{\|P_u\| \|V_m\|}$$
  4. Filters out movies without overviews and all movies already rated by the visitor.
* **Inference Rule**: Requires at least **5 distinct rated movies**; returns top 10 ranked recommendations.

### C. Genre-Based Hybrid Recommender (Taste & Quality Blend)
* **Reference Notebook**: `Notebooks/04_Genre_Based_Movie_Recommendation_System.ipynb`
* **Artifact**: `Backend Artifacts/genre_model.pkl` (12,262 $\times$ 20 multi-hot matrix, Bayesian quality scores $Q(m)$, catalogue mappings).
* **Mathematical Formulation**:
  1. Constructs a 20-dimensional user genre preference profile using positive-only rating weights:
     $$P_u = \sum_{i \in \text{Rated}} \max(0, r_{ui} - 3) \cdot G_i$$
     where $G_i$ is movie $i$'s multi-hot genre vector.
  2. Computes cosine similarity $G(u, m)$ between normalized profile $P_u / \|P_u\|$ and normalized movie genre vectors $G_m / \|G_m\|$.
  3. Blends genre similarity with precomputed normalized Bayesian quality scores $Q(m)$:
     $$S(u, m) = \alpha G(u, m) + (1 - \alpha) Q(m)$$
     with optimal hyperparameter $\alpha = 0.5$.
  4. Excludes already-rated movies.
* **Inference Rule**: Requires at least **5 distinct rated movies**; returns top 10 ranked recommendations.

---

## 4. Project Structure

```text
MovieMatch/
│
├── .github/
│   └── workflows/
│       └── deploy-pages.yml            # Automated GitHub Pages CI/CD workflow
│
├── Backend Artifacts/                  # Precomputed machine learning artifacts
│   ├── genre_model.pkl                 # Multi-hot genre matrix & Bayesian quality scores
│   ├── links_columns.csv               # MovieLens to TMDB ID mappings
│   ├── movie_id_to_index.pkl           # TMDB ID to TF-IDF matrix row index mapping
│   ├── movies_clean.csv                # Cleaned movie catalogue (12,794 movies)
│   ├── tfidf_matrix.pkl                # Precomputed TF-IDF sparse matrix (12,794 x 20,000)
│   └── tfidf_vectorizer.pkl            # Fitted TfidfVectorizer
│
├── dataset/                            # Dataset files
│   ├── processed/
│   │   ├── movies_clean.csv
│   │   └── popularity_ranking.csv      # Precomputed IMDb weighted rating rankings
│   └── raw/
│       ├── keywords.csv
│       ├── links.csv
│       ├── links_small.csv
│       ├── movies_metadata.csv         # Raw metadata (contains poster paths)
│       └── ratings_small.csv
│
├── Notebooks/                          # Original research and evaluation notebooks
│   ├── 01_data_preparation.ipynb       # Data cleaning & catalogue creation
│   ├── 02_popularity.ipynb             # Popularity recommender implementation
│   ├── 03_tfidf_recommender.ipynb      # TF-IDF recommender & evaluation
│   └── 04_Genre_Based_Movie_Recommendation_System.ipynb # Genre model tuning
│
├── backend/                            # FastAPI ML Inference Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                   # Paths, CORS, and recommendation settings
│   │   ├── main.py                     # FastAPI entry point, lifespan loader, CORS, health
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── movies.py               # Movie search, genre listing, metadata
│   │   │   └── recommendations.py      # Stateless ML inference endpoints
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── movie.py                # Movie response schemas
│   │   │   └── recommendation.py       # Recommendation request/response schemas
│   │   ├── recommenders/
│   │   │   ├── __init__.py
│   │   │   ├── genre.py                # Multi-hot genre inference module
│   │   │   ├── popularity.py           # Bayesian popularity ranking module
│   │   │   └── tfidf.py                # TF-IDF content inference module
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── catalogue.py            # In-memory search & poster resolver
│   │       └── tmdb.py                 # Optional TMDB fallback client
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                 # Pytest test fixtures
│   │   ├── test_movies.py              # Search & catalogue tests
│   │   └── test_recommendations.py     # ML inference fidelity tests
│   ├── .env.example                    # Backend environment template
│   ├── Procfile                        # Render start command
│   └── requirements.txt                # Pinned Python dependencies
│
├── frontend/                           # React (Vite) Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── MovieCard.jsx           # Card with poster, badges & star rating
│   │   │   ├── MovieSearchSection.jsx  # Catalogue search & genre filter
│   │   │   ├── Navbar.jsx              # Navigation header with progress indicator
│   │   │   ├── RatedMoviesSection.jsx  # LocalStorage ratings manager
│   │   │   ├── RatingProgressBar.jsx   # X / 5 rated unlocking progress
│   │   │   ├── RecommendationSection.jsx # 3 algorithm tabs & locked states
│   │   │   ├── StarRating.jsx          # Interactive 0.5-5.0 star rating widget
│   │   │   └── Toast.jsx               # Floating feedback alerts
│   │   ├── context/
│   │   │   └── RatingsContext.jsx      # Browser localStorage state provider
│   │   ├── services/
│   │   │   ├── api.js                  # Centralized REST API client
│   │   │   └── storage.js              # Versioned localStorage service
│   │   ├── App.jsx                     # Main application layout
│   │   ├── index.css                   # Modern cinematic dark styling
│   │   └── main.jsx                    # React entry point
│   ├── .env.example                    # Frontend environment template
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # Node dependencies
│   ├── package-lock.json
│   └── vite.config.js                  # Vite build config with base: /MovieMatch/
│
├── .env.example                        # Root environment template
├── .gitignore                          # Clean ignore rules
├── render.yaml                         # Render blueprint configuration
└── README.md                           # Project documentation
```

---

## 5. Dataset Sources & Access Instructions

The models are built using **The Movies Dataset** (MovieLens 100k subset + TMDB metadata), publicly available on Kaggle:
* **Source**: [The Movies Dataset on Kaggle](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset)
* **Files Used**:
  - `movies_metadata.csv`: Contains movie titles, overviews, release dates, TMDB IDs, and poster paths.
  - `links.csv` / `links_small.csv`: Mapping between MovieLens `movieId` and TMDB `tmdbId`.
  - `ratings_small.csv`: 100,000 ratings from 700 users on 9,000 movies used in offline evaluation.
* **Processed Dataset**:
  - `dataset/processed/movies_clean.csv`: Post-2010 cleaned catalogue of 12,794 movies.
  - `dataset/processed/popularity_ranking.csv`: 12,652 movies ranked by Bayesian weighted rating.

---

## 6. Model Artifact Descriptions

| Artifact Name | File Path | Dimensions / Type | Description |
|---|---|---|---|
| `tfidf_matrix.pkl` | `Backend Artifacts/` | `(12794, 20000)` Sparse Float64 | Precomputed TF-IDF feature matrix from cleaned movie plot overviews. |
| `tfidf_vectorizer.pkl` | `Backend Artifacts/` | Scikit-Learn `TfidfVectorizer` | Fitted vectorizer with English stopwords, 1-2 ngrams, min_df=2, max_features=20,000. |
| `movie_id_to_index.pkl` | `Backend Artifacts/` | Dict `(12,794 entries)` | Maps TMDB movie ID to row index in `tfidf_matrix.pkl`. |
| `genre_model.pkl` | `Backend Artifacts/` | Python dictionary pickle | Contains 20-dim multi-hot `genre_matrix` (12,262 $\times$ 20), Bayesian `quality_scores`, catalogue movie IDs, titles, and hyperparameter $\alpha = 0.5$. |
| `movies_clean.csv` | `Backend Artifacts/` | CSV `(12,794 rows)` | Cleaned movie catalogue used for metadata lookups, titles, overviews, and genres. |

---

## 7. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 GitHub Pages (Frontend)                     │
│        https://kurupashwin482-web.github.io/MovieMatch/     │
│  - React 18 + Vite (SPA)                                    │
│  - Browser localStorage (moviematch_ratings_v1)             │
│  - No login / Zero setup required                           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (Anonymous REST Payload)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Render (ML Web Service)                   │
│             https://moviematch-backend.onrender.com         │
│  - FastAPI (Python 3.12)                                    │
│  - Artifacts loaded once at startup into memory             │
│  - Pure stateless ML inference (< 5ms per request)          │
│  - No database required                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. REST API Specification

| Method | Endpoint | Payload | Description |
|---|---|---|---|
| `GET` | `/health` | None | Health check verifying model readiness |
| `GET` | `/movies/genres` | None | Returns all 20 unique genres |
| `GET` | `/movies/search` | Query params: `query`, `genre`, `page`, `limit` | Full-text title search and genre filter |
| `GET` | `/movies/{movie_id}` | Path param: `movie_id` | Metadata for a single movie by TMDB ID |
| `POST` | `/recommendations/popularity` | `{ "rated_movie_ids": [int], "k": 10 }` | Popularity ranking excluding rated movies |
| `POST` | `/recommendations/tfidf` | `{ "ratings": { movieId: rating }, "k": 10 }` | Dynamic TF-IDF content inference (min 5 ratings) |
| `POST` | `/recommendations/genre` | `{ "ratings": { movieId: rating }, "k": 10 }` | Hybrid genre & quality inference (min 5 ratings) |

---

## 9. Local Setup & Reproduction Instructions

Any instructor or student can reproduce and run MovieMatch locally in under two minutes without setting up a database or personal accounts.

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ and npm

### Backend Setup
1. Clone the repository and navigate to the project root:
   ```bash
   git clone https://github.com/kurupashwin482-web/MovieMatch.git
   cd MovieMatch
   git checkout backend-n-api-integration
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Interactive Swagger API documentation will be available at: `http://localhost:8000/docs`

### Frontend Setup
1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   npm ci
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:5173`.

---

## 10. Automated Testing

Run the automated backend test suite:
```bash
PYTHONPATH=. pytest backend/tests/ -v
```

All 14 tests verify:
- In-memory catalogue search and genre filtering.
- Popularity recommendations with rated movie exclusion.
- TF-IDF 5-rating minimum validation.
- Genre 5-rating minimum validation.
- TF-IDF recommendation ground truth matches notebook results (`Prologue` score $> 0.14$).
- Genre recommendation score calibration ($[0, 1]$).
- Different rating profiles produce distinct personalized recommendations.

---

## 11. Known Limitations

1. **Catalogue Coverage**: The catalogue is restricted to 12,794 movies released after 2010 with available TMDB mappings. Extremely recent releases (post-2023) or obscure foreign films without metadata are not represented.
2. **Cold Start**: TF-IDF and Genre models strictly require 5 distinct ratings before computing personalized recommendations; for fewer ratings, the system guides visitors to use Popularity recommendations or rate additional films.
3. **Render Free Tier Spin-Up**: When using the free Render deployment tier, instances spin down after 15 minutes of inactivity. The initial request after inactivity may take ~50 seconds to wake up the service.
4. **Jupyter Notebook Status**: The research notebooks in `Notebooks/` reflect the original experimental progress and Colab development environment. Formal cleanup, standardized styling, and notebook re-execution will be performed in a dedicated post-deployment phase.

---

## 12. AI-Use Disclosure

In accordance with academic integrity guidelines for ES 335:
- **Algorithms & Mathematical Modeling**: The foundational recommendation algorithms, formulas, weighting schemes ($w(r)$), and hyperparameter choices ($\alpha = 0.5$, $k = 10$) were conceived, implemented, and evaluated by the project authors in Jupyter notebooks.
- **AI Assistance**: Antigravity (Google DeepMind coding agent) was utilized as a pair programmer to assist with software engineering tasks: refactoring notebook code into modular FastAPI services, building React UI components, configuring Vite subpaths, and writing automated test suites.
