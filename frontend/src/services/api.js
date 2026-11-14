const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

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
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const offlineError = new Error('Backend server is currently unreachable. If using Render, the free instance may take ~50 seconds to spin up. Please try again in a moment.');
        offlineError.status = 503;
        throw offlineError;
      }
      throw err;
    }
  }

  // Catalogue Endpoints
  async getGenres() {
    return this.request('/movies/genres');
  }

  async searchMovies({ query = '', genre = '', page = 1, limit = 24 } = {}) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (genre) params.append('genre', genre);
    params.append('page', page);
    params.append('limit', limit);
    return this.request(`/movies/search?${params.toString()}`);
  }

  async getMovieById(movieId) {
    return this.request(`/movies/${movieId}`);
  }

  // Recommendation Endpoints (Stateless Anonymous Inference)
  async getPopularityRecommendations(ratedMovieIds = [], k = 10) {
    return this.request('/recommendations/popularity', {
      method: 'POST',
      body: JSON.stringify({
        rated_movie_ids: ratedMovieIds,
        k,
      }),
    });
  }

  async getTfidfRecommendations(ratingsDict, k = 10) {
    return this.request('/recommendations/tfidf', {
      method: 'POST',
      body: JSON.stringify({
        ratings: ratingsDict,
        k,
      }),
    });
  }

  async getGenreRecommendations(ratingsDict, k = 10) {
    return this.request('/recommendations/genre', {
      method: 'POST',
      body: JSON.stringify({
        ratings: ratingsDict,
        k,
      }),
    });
  }

  async checkHealth() {
    return this.request('/health');
  }
}

export const api = new ApiService();
