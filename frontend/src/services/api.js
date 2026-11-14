const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

class ApiService {
  constructor() {
    this.token = localStorage.getItem('moviematch_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('moviematch_token', token);
    } else {
      localStorage.removeItem('moviematch_token');
    }
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('moviematch_token');
    }
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.detail || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.status === 401) {
        // Token expired or invalid
        this.setToken(null);
      }
      throw err;
    }
  }

  // Auth Endpoints
  async register(username, email, password) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async login(username, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Movies Endpoints
  async getGenres() {
    return this.request('/movies/genres');
  }

  async searchMovies({ query = '', genre = '', page = 1, limit = 20 } = {}) {
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

  // Ratings Endpoints
  async rateMovie(movieId, rating) {
    return this.request('/ratings', {
      method: 'POST',
      body: JSON.stringify({ movie_id: movieId, rating }),
    });
  }

  async getUserRatings() {
    return this.request('/ratings/me');
  }

  async updateRating(movieId, rating) {
    return this.request(`/ratings/${movieId}`, {
      method: 'PUT',
      body: JSON.stringify({ rating }),
    });
  }

  async deleteRating(movieId) {
    return this.request(`/ratings/${movieId}`, {
      method: 'DELETE',
    });
  }

  // Recommendation Endpoints
  async getPopularityRecommendations(k = 10) {
    return this.request(`/recommendations/popularity?k=${k}`);
  }

  async getTfidfRecommendations(k = 10) {
    return this.request(`/recommendations/tfidf?k=${k}`);
  }

  async getGenreRecommendations(k = 10) {
    return this.request(`/recommendations/genre?k=${k}`);
  }

  async checkHealth() {
    return this.request('/health');
  }
}

export const api = new ApiService();
