const API_BASE_URL = ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8000').replace(/\/+$/, '');
const BASE_PATH = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';

// Fallback genres in case of offline/disconnected environment
const FALLBACK_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'Foreign',
  'History', 'Horror', 'Music', 'Mystery', 'Romance',
  'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
];

let cachedCatalogue = null;
let cachedGenres = null;
let cachedPopularity = null;

async function loadStaticCatalogue() {
  if (cachedCatalogue) return cachedCatalogue;
  try {
    const url = `${BASE_PATH.replace(/\/+$/, '')}/data/catalogue.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cachedCatalogue = await res.json();
    return cachedCatalogue;
  } catch (err) {
    console.warn('Could not load static catalogue.json:', err);
    return [];
  }
}

async function loadStaticGenres() {
  if (cachedGenres) return cachedGenres;
  try {
    const url = `${BASE_PATH.replace(/\/+$/, '')}/data/genres.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cachedGenres = await res.json();
    return cachedGenres;
  } catch (err) {
    console.warn('Could not load static genres.json, using fallback:', err);
    cachedGenres = FALLBACK_GENRES;
    return cachedGenres;
  }
}

async function loadStaticPopularity() {
  if (cachedPopularity) return cachedPopularity;
  try {
    const url = `${BASE_PATH.replace(/\/+$/, '')}/data/popularity.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cachedPopularity = await res.json();
    return cachedPopularity;
  } catch (err) {
    console.warn('Could not load static popularity.json:', err);
    return null;
  }
}

class ApiService {
  async request(endpoint, options = {}, timeoutMs = 4500) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.detail || `Request failed with status ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        const timeoutError = new Error(`Request to ${endpoint} timed out after ${timeoutMs}ms.`);
        timeoutError.status = 504;
        throw timeoutError;
      }

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const offlineError = new Error(
          'Backend service is unreachable. Serving data from high-speed client-side catalogue.'
        );
        offlineError.status = 503;
        throw offlineError;
      }

      throw err;
    }
  }

  // Catalogue Endpoints
  async getGenres() {
    try {
      const list = await this.request('/movies/genres', {}, 3500);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    } catch (err) {
      // Backend unavailable or timed out; fall back to static genres
    }
    return loadStaticGenres();
  }

  async searchMovies({ query = '', genre = '', page = 1, limit = 24 } = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (genre) params.append('genre', genre);
      params.append('page', page);
      params.append('limit', limit);

      return await this.request(`/movies/search?${params.toString()}`, {}, 4000);
    } catch (err) {
      // Client-side fallback search
      const catalogue = await loadStaticCatalogue();
      let filtered = catalogue;

      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        filtered = filtered.filter((m) => m.title && m.title.toLowerCase().includes(q));
      }

      if (genre && genre.trim()) {
        const g = genre.trim();
        filtered = filtered.filter((m) => Array.isArray(m.genres) && m.genres.includes(g));
      }

      const total = filtered.length;
      const start = Math.max(0, (page - 1) * limit);
      const end = start + limit;
      const movies = filtered.slice(start, end);

      return {
        total,
        page,
        limit,
        movies,
      };
    }
  }

  async getMovieById(movieId) {
    try {
      return await this.request(`/movies/${movieId}`, {}, 3500);
    } catch (err) {
      const catalogue = await loadStaticCatalogue();
      const numId = Number(movieId);
      const found = catalogue.find((m) => m.tmdbId === numId);
      if (found) return found;
      const notFoundError = new Error(`Movie with ID ${movieId} not found.`);
      notFoundError.status = 404;
      throw notFoundError;
    }
  }

  // Recommendation Endpoints (Stateless Anonymous Inference)
  async getPopularityRecommendations(ratedMovieIds = [], k = 10, timeoutMs = 4500) {
    try {
      const data = await this.request(
        '/recommendations/popularity',
        {
          method: 'POST',
          body: JSON.stringify({
            rated_movie_ids: ratedMovieIds,
            k,
          }),
        },
        timeoutMs
      );
      return {
        ...data,
        is_fallback: false,
      };
    } catch (err) {
      if (err.status === 400 || err.status === 422) {
        throw err;
      }
      // Fallback popularity ranking
      const ratedSet = new Set((ratedMovieIds || []).map(Number));
      const popList = (await loadStaticPopularity()) || (await loadStaticCatalogue());
      const filtered = popList.filter((m) => !ratedSet.has(m.tmdbId)).slice(0, k);
      return {
        algorithm: 'popularity',
        is_fallback: true,
        movies: filtered.map((m) => ({
          ...m,
          score_type: 'popularity_rank',
        })),
      };
    }
  }

  async getTfidfRecommendations(ratingsDict, k = 10, timeoutMs = 6000) {
    const ratingsCount = Object.keys(ratingsDict || {}).length;
    if (ratingsCount < 5) {
      const err = new Error(`At least 5 movie ratings are required for personalized TF-IDF recommendations. Currently provided: ${ratingsCount}.`);
      err.status = 400;
      throw err;
    }
    try {
      const data = await this.request(
        '/recommendations/tfidf',
        {
          method: 'POST',
          body: JSON.stringify({
            ratings: ratingsDict,
            k,
          }),
        },
        timeoutMs
      );
      return {
        ...data,
        is_fallback: false,
      };
    } catch (err) {
      if (err.status === 400 || err.status === 422) {
        throw err;
      }
      // Client-side fallback content-based matching
      const catalogue = await loadStaticCatalogue();
      const ratedIds = new Set(Object.keys(ratingsDict).map(Number));

      // Build preference terms from highly rated movies
      const positiveMovies = catalogue.filter(
        (m) => ratedIds.has(m.tmdbId) && (ratingsDict[m.tmdbId] || 0) >= 3.0
      );

      const prefGenres = new Set();
      const prefWords = new Set();
      for (const m of positiveMovies) {
        (m.genres || []).forEach((g) => prefGenres.add(g));
        (m.overview || '')
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 4)
          .forEach((w) => prefWords.add(w));
      }

      const scored = catalogue
        .filter((m) => !ratedIds.has(m.tmdbId))
        .map((m) => {
          let genreMatches = 0;
          (m.genres || []).forEach((g) => {
            if (prefGenres.has(g)) genreMatches += 1;
          });

          let wordMatches = 0;
          const words = (m.overview || '')
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, '')
            .split(/\s+/);
          for (const w of words) {
            if (prefWords.has(w)) wordMatches += 1;
          }

          const score = (genreMatches * 0.4) + Math.min(1.0, wordMatches * 0.05) + ((m.avg_rating || 3.0) * 0.1);
          return {
            ...m,
            score: Number(score.toFixed(4)),
            score_type: 'tfidf_content',
          };
        });

      scored.sort((a, b) => (b.score || 0) - (a.score || 0));
      return {
        algorithm: 'tfidf',
        is_fallback: true,
        movies: scored.slice(0, k),
      };
    }
  }

  async getGenreRecommendations(ratingsDict, k = 10, timeoutMs = 6000) {
    const ratingsCount = Object.keys(ratingsDict || {}).length;
    if (ratingsCount < 5) {
      const err = new Error(`At least 5 movie ratings are required for personalized Genre recommendations. Currently provided: ${ratingsCount}.`);
      err.status = 400;
      throw err;
    }
    try {
      const data = await this.request(
        '/recommendations/genre',
        {
          method: 'POST',
          body: JSON.stringify({
            ratings: ratingsDict,
            k,
          }),
        },
        timeoutMs
      );
      return {
        ...data,
        is_fallback: false,
      };
    } catch (err) {
      if (err.status === 400 || err.status === 422) {
        throw err;
      }
      // Client-side genre preference profile matching
      const catalogue = await loadStaticCatalogue();
      const ratedIds = new Set(Object.keys(ratingsDict).map(Number));

      // Build genre profile: profile[g] = sum(max(0, rating - 3.0))
      const genreScores = {};
      for (const [idStr, rating] of Object.entries(ratingsDict)) {
        const id = Number(idStr);
        const weight = Math.max(0, Number(rating) - 3.0);
        const movie = catalogue.find((m) => m.tmdbId === id);
        if (movie && Array.isArray(movie.genres)) {
          for (const g of movie.genres) {
            genreScores[g] = (genreScores[g] || 0) + weight;
          }
        }
      }

      const normProfile = Math.sqrt(
        Object.values(genreScores).reduce((sum, v) => sum + v * v, 0)
      ) || 1.0;

      const scored = catalogue
        .filter((m) => !ratedIds.has(m.tmdbId))
        .map((m) => {
          const mGenres = m.genres || [];
          let dotProduct = 0;
          for (const g of mGenres) {
            if (genreScores[g]) {
              dotProduct += genreScores[g];
            }
          }
          const mNorm = Math.sqrt(mGenres.length) || 1.0;
          const genreSim = Math.min(1.0, Math.max(0.0, dotProduct / (normProfile * mNorm)));
          const quality = Math.min(1.0, Math.max(0.0, ((m.avg_rating || 3.0) - 1.0) / 4.0));
          const score = 0.5 * genreSim + 0.5 * quality;

          return {
            ...m,
            score: Number(score.toFixed(4)),
            score_type: 'genre_blend',
          };
        });

      scored.sort((a, b) => (b.score || 0) - (a.score || 0));
      return {
        algorithm: 'genre',
        is_fallback: true,
        movies: scored.slice(0, k),
      };
    }
  }

  getBaseUrl() {
    return API_BASE_URL;
  }

  async checkHealth(timeoutMs = 4000) {
    try {
      const data = await this.request('/health', {}, timeoutMs);
      return Boolean(data && data.status === 'ok');
    } catch {
      return false;
    }
  }

  async waitForBackend({ maxAttempts = 5, timeoutPerAttempt = 9000, intervalMs = 2500, onProgress } = {}) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (onProgress) {
        onProgress({
          attempt,
          maxAttempts,
          message: `Pinging backend (attempt ${attempt} of ${maxAttempts})...`,
        });
      }
      try {
        const isHealthy = await this.checkHealth(timeoutPerAttempt);
        if (isHealthy) {
          return { ready: true, attempts: attempt };
        }
      } catch {
        // Attempt failed, continue to next
      }
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
    return {
      ready: false,
      error: `Could not reach live backend at ${API_BASE_URL} after ${maxAttempts} attempts. The service may be asleep, suspended on Render, or experiencing network limits.`,
    };
  }
}

export const api = new ApiService();
