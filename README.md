# MovieMatch — ML-Based Movie Recommendation System

MovieMatch is a full-stack, machine learning-driven movie recommendation platform developed as a course project. It integrates three distinct recommendation algorithms into an interactive web application featuring JWT authentication, dynamic user preference modeling, interactive movie rating, and comprehensive metadata search.

---

## 1. Project Overview

MovieMatch allows users to:
1. **Register and Log In**: Secure password hashing with `bcrypt` and signed JWT bearer tokens.
2. **Search and Explore Movies**: Query over 12,000 films with title search and genre filters.
3. **Rate Movies**: Rate movies on a scale of 0.5 to 5.0 stars with persistent database storage.
4. **Track Recommendation Progress**: Visual `X / 5 movies rated` progress tracking.
5. **Receive Multi-Model Recommendations**:
   - **Popularity-Based**: Bayesian weighted ranking formula (IMDb formula).
   - **TF-IDF Content-Based**: Dynamic preference vectorization across 20,000 plot features (unlocked after 5 ratings).
   - **Genre-Based**: Multi-hot genre vector cosine similarity blended with Bayesian quality scores ($\alpha = 0.5$, unlocked after 5 ratings).

---

## 2. System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│               Frontend: React (Vite) + Modern CSS             │
│        (AuthModal, MovieCards, StarRating, 3 Rec Tabs)        │
└───────────────────────────────┬───────────────────────────────┘
                                │ HTTP / REST (JWT Bearer Auth)
                                ▼
┌───────────────────────────────────────────────────────────────┐
│               Backend: FastAPI (Python 3.12)                  │
│   ├── Routers: /auth, /movies, /ratings, /recommendations     │
│   └── In-Memory Model Inference (Loaded Once on Lifespan)     │
└───────────────┬───────────────────────────────┬───────────────┘
                │                               │
                ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│  Database: SQLite (Local) /   │ │       Model Artifacts        │
│    Neon PostgreSQL (Prod)    │ │ ├── popularity_ranking.csv   │
│  ├── Users Table             │ │ ├── tfidf_matrix.pkl         │
│  └── Ratings Table           │ │ ├── movie_id_to_index.pkl    │
│      (Unique user_id, movie) │ │ └── genre_model.pkl          │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 3. Project Structure

```text
MovieMatch/
│
├── .github/
│   └── workflows/
│       └── deploy-pages.yml         # GitHub Actions workflow for Pages deployment
│
├── Backend Artifacts/               # Precomputed ML artifacts (Loaded once at startup)
│   ├── genre_model.pkl              # Multi-hot genre matrix, movie mappings, quality scores
│   ├── links_columns.csv            # MovieLens to TMDB ID mappings
│   ├── movie_id_to_index.pkl        # TMDB ID to TF-IDF row index mapping
│   ├── movies_clean.csv             # Clean movie catalogue (12,794 titles)
│   ├── tfidf_matrix.pkl             # Sparse TF-IDF matrix (12,794 x 20,000)
│   └── tfidf_vectorizer.pkl         # Fitted Scikit-Learn TfidfVectorizer
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                # Environment, paths, and application settings
│   │   ├── database.py              # SQLAlchemy engine (SQLite & Neon PostgreSQL)
│   │   ├── main.py                  # FastAPI app entry point, lifespan, CORS, health
│   │   ├── models/                  # Database entity definitions
│   │   │   ├── __init__.py
│   │   │   ├── rating.py            # Ratings model (unique constraint per user/movie)
│   │   │   └── user.py              # Users model (hashed passwords, timestamps)
│   │   ├── schemas/                 # Pydantic validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── movie.py             # Movie search and card response schemas
│   │   │   ├── rating.py            # Rating create, update, and progress schemas
│   │   │   ├── recommendation.py    # Recommendation output schemas
│   │   │   └── user.py              # Registration, login, and token schemas
│   │   ├── routers/                 # Modular API route controllers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # /auth/register, /auth/login, /auth/me
│   │   │   ├── movies.py            # /movies/search, /movies/{id}, /movies/genres
│   │   │   ├── ratings.py           # /ratings, /ratings/me, /ratings/{id}
│   │   │   └── recommendations.py   # /recommendations/{popularity,tfidf,genre}
│   │   ├── recommenders/            # ML recommendation inference modules
│   │   │   ├── __init__.py
│   │   │   ├── genre.py             # Positive-weight genre preference + Bayesian quality
│   │   │   ├── popularity.py        # Bayesian weighted rating popularity ranking
│   │   │   └── tfidf.py             # Content-based TF-IDF user preference profile
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── auth.py              # Bcrypt hashing & PyJWT token utilities
│   │       ├── catalogue.py         # In-memory fast movie search & poster resolver
│   │       └── tmdb.py              # TMDB fallback client with caching
│   ├── tests/                       # Automated pytest suite
│   │   ├── conftest.py              # In-memory test database & auth fixtures
│   │   ├── test_auth.py             # Registration and login test cases
│   │   ├── test_movies.py           # Search, filtering, and detail tests
│   │   ├── test_ratings.py          # Rating CRUD and progress counter tests
│   │   └── test_recommendations.py  # ML recommendation fidelity tests
│   ├── .env.example                 # Backend environment variable template
│   ├── Procfile                     # Process file for Render production deployment
│   └── requirements.txt             # Pinned backend Python dependencies
│
├── dataset/
│   ├── processed/
│   │   ├── movies_clean.csv         # Cleaned catalogue data
│   │   └── popularity_ranking.csv   # Precomputed weighted popularity ranking
│   └── raw/
│       ├── keywords.csv
│       ├── links.csv
│       ├── links_small.csv
│       ├── movies_metadata.csv      # Raw metadata (contains poster_path)
│       └── ratings_small.csv
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.jsx        # Login & registration tabs with validation
│   │   │   ├── MovieCard.jsx        # Movie card with poster, badges & star rating
│   │   │   ├── MovieSearchSection.jsx # Title search, genre filter, pagination
│   │   │   ├── Navbar.jsx           # Sticky nav with logo, tabs, rating counter
│   │   │   ├── RatedMoviesSection.jsx # User's rated movies manager
│   │   │   ├── RatingProgressBar.jsx # Animated X / 5 rated unlocking progress
│   │   │   ├── RecommendationSection.jsx # Tabs for Popularity, TF-IDF, Genre
│   │   │   ├── StarRating.jsx       # Interactive star rating widget (0.5 - 5.0)
│   │   │   └── Toast.jsx            # Floating feedback alerts
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication & ratings progress state
│   │   ├── services/
│   │   │   └── api.js               # Centralized REST API client
│   │   ├── App.jsx                  # Main dashboard layout
│   │   ├── index.css                # Cinematic dark theme design
│   │   └── main.jsx                 # React root mounting
│   ├── .env.example                 # Frontend environment template
│   ├── index.html                   # HTML entry point
│   ├── package.json                 # Node dependencies (React 18, Vite, Lucide)
│   └── vite.config.js               # Vite config with /MovieMatch/ base path
│
├── Notebooks/                       # Original machine learning research notebooks
│   ├── 01_data_preparation.ipynb    # Data ingestion, cleaning, and preprocessing
│   ├── 02_popularity.ipynb          # Bayesian weighted rating recommender
│   ├── 03_tfidf_recommender.ipynb   # Content-based TF-IDF recommender & evaluation
│   └── 04_Genre_Based_Movie_Recommendation_System.ipynb # Hybrid genre model
│
├── .env.example                     # Root environment variable template
├── .gitignore                       # Git ignore configuration
├── render.yaml                      # Render Blueprint configuration
└── README.md                        # Project documentation
```

---

## 4. Recommendation Algorithms

### A. Popularity-Based Recommendation
* **Reference Notebook**: `Notebooks/02_popularity.ipynb`
* **Artifact**: `dataset/processed/popularity_ranking.csv`
* **Methodology**: Ranks films globally using the IMDb Bayesian weighted rating formula:
  $$WR = \left(\frac{v}{v+m}\right) R + \left(\frac{m}{v+m}\right) C$$
  where:
  - $v$: number of user ratings for the movie (`rating_count`).
  - $R$: average rating of the movie (`avg_rating`).
  - $m$: 70th percentile of rating counts across rated movies.
  - $C$: overall mean rating across all rated movies.
* **Inference Rule**: Returns the top 10 popular movies, strictly filtering out any movies the authenticated user has already rated. Available immediately.

### B. TF-IDF Content-Based Recommendation
* **Reference Notebook**: `Notebooks/03_tfidf_recommender.ipynb`
* **Artifacts**: `tfidf_matrix.pkl` (12,794 $\times$ 20,000), `movie_id_to_index.pkl`, `tfidf_vectorizer.pkl`.
* **Methodology**:
  1. Constructs a dynamic user preference profile $P_u$ from the user's ratings:
     $$P_u = \sum_{i \in \text{Rated}} w(r_{ui}) \cdot V_i$$
     where rating weights are defined as:
     $$w(r) = \begin{cases} 0.1 & \text{if } r = 3.0 \\ r - 3.0 & \text{otherwise} \end{cases}$$
  2. Ratings above 3.0 positively weight features, while ratings below 3.0 penalize features.
  3. Computes cosine similarity between $P_u$ and all movie vectors in the catalogue.
  4. Excludes movies without overviews and movies already rated by the user.
* **Inference Rule**: Requires at least **5 rated movies**; returns top 10 content recommendations.

### C. Genre-Based Recommendation
* **Reference Notebook**: `Notebooks/04_Genre_Based_Movie_Recommendation_System.ipynb`
* **Artifact**: `Backend Artifacts/genre_model.pkl` (12,262 $\times$ 20 genre matrix, Bayesian quality scores, mappings).
* **Methodology**:
  1. User Preference Profile using positive-only rating weights:
     $$P_u = \sum_{i \in \text{Rated}} \max(0, r_{ui} - 3) \cdot G_i$$
     where $G_i$ is movie $i$'s multi-hot genre vector.
  2. Genre similarity $G(u, m)$ is calculated as cosine similarity between normalized profile $P_u / \|P_u\|$ and normalized movie genre vectors $G_m / \|G_m\|$.
  3. Combined recommendation score blends genre similarity with precomputed normalized Bayesian quality scores $Q(m)$:
     $$S(u, m) = \alpha G(u, m) + (1 - \alpha) Q(m)$$
     with selected optimal configuration $\alpha = 0.5$.
* **Inference Rule**: Requires at least **5 rated movies**; returns top 10 hybrid recommendations excluding already-rated films.

---

## 5. API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Health check & model loaded status | No |
| `POST` | `/auth/register` | Register new user account | No |
| `POST` | `/auth/login` | Authenticate and obtain JWT token | No |
| `GET` | `/auth/me` | Get authenticated user profile | Yes |
| `GET` | `/movies/search` | Search movies by title & genre filter | Optional |
| `GET` | `/movies/genres` | List all unique genres in catalogue | No |
| `GET` | `/movies/{movie_id}` | Get single movie metadata & user rating | Optional |
| `POST` | `/ratings` | Submit or update movie rating (0.5 to 5.0) | Yes |
| `GET` | `/ratings/me` | Get all movies rated by user & progress count | Yes |
| `PUT` | `/ratings/{movie_id}` | Update existing movie rating | Yes |
| `DELETE` | `/ratings/{movie_id}` | Remove a movie rating | Yes |
| `GET` | `/recommendations/popularity` | Top 10 Popularity-based recommendations | Yes |
| `GET` | `/recommendations/tfidf` | Top 10 TF-IDF recommendations (min 5 ratings) | Yes |
| `GET` | `/recommendations/genre` | Top 10 Genre recommendations (min 5 ratings) | Yes |

---

## 6. Environment Variables

Create a `.env` file in the project root or in `backend/` based on `.env.example`:

| Variable | Description | Default / Example |
|---|---|---|
| `ENVIRONMENT` | Application mode (`development` / `production`) | `development` |
| `PORT` | Backend server port | `8000` |
| `HOST` | Backend host address | `0.0.0.0` |
| `SECRET_KEY` | Secret key for signing JWT tokens ($\ge 32$ chars) | `<secure-random-key>` |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token validity duration | `1440` (24 hours) |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./moviematch.db` (local) or `postgresql://...` (Neon) |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,https://kurupashwin482-web.github.io` |
| `TMDB_API_KEY` | TMDB API key for fallback poster fetching (backend only) | Optional |
| `VITE_API_BASE_URL` | Frontend API base URL (in `frontend/.env`) | `http://localhost:8000` |

---

## 7. Local Setup and Execution Instructions

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ and npm

### Backend Setup

1. **Activate virtual environment**:
   ```bash
   source .venv/bin/activate
   ```
2. **Install backend dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. **Configure environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   ```
4. **Run the FastAPI server**:
   ```bash
   python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   API interactive documentation is available at: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
2. **Install frontend dependencies**:
   ```bash
   npm install
   ```
3. **Run the Vite development server**:
   ```bash
   npm run dev
   ```
   Open your browser at: `http://localhost:5173`

---

## 8. Testing Instructions

Automated tests verify authentication, movie searching, rating persistence, progress tracking, and recommendation logic against notebook ground truth.

Run the test suite with:

```bash
PYTHONPATH=. pytest backend/tests/ -v
```

All 23 unit and integration tests will execute against an in-memory SQLite database.

---

## 9. Future Deployment Architecture (Part 2 Readiness)

This application is architected for Part 2 cloud deployment:
- **Frontend**: Prepared for GitHub Pages with `base: '/MovieMatch/'` configuration in `vite.config.js` and automated workflow in `.github/workflows/deploy-pages.yml`.
- **Backend**: Prepared for Render with `render.yaml`, `backend/Procfile`, and `PORT` environment variable binding.
- **Database**: Compatible with Neon PostgreSQL via SQLAlchemy (connection URL normalization handles `postgresql://` and `postgres://`).
