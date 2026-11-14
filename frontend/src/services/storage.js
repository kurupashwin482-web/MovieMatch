const STORAGE_KEY = 'moviematch_ratings_v1';

class StorageService {
  /**
   * Retrieve all stored ratings.
   * Returns an object mapping movieId -> { movie_id, rating, title, release_year, genres, poster_url, overview, updated_at }
   */
  getRatings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {};
      }
      return parsed;
    } catch (e) {
      console.warn('Failed to parse ratings from localStorage:', e);
      return {};
    }
  }

  /**
   * Save or update a movie rating.
   */
  saveRating(movie, rating) {
    if (!movie || !movie.tmdbId) return;
    const movieId = String(movie.tmdbId);
    const validRating = Math.max(0.5, Math.min(5.0, Number(rating)));

    const currentRatings = this.getRatings();
    currentRatings[movieId] = {
      tmdbId: movie.tmdbId,
      movie_id: movie.tmdbId,
      title: movie.title || 'Untitled',
      release_year: movie.release_year || null,
      genres: Array.isArray(movie.genres) ? movie.genres : [],
      poster_url: movie.poster_url || null,
      poster_path: movie.poster_path || null,
      overview: movie.overview || '',
      avg_rating: movie.avg_rating || null,
      rating_count: movie.rating_count || 0,
      rating: validRating,
      updated_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentRatings));
    } catch (e) {
      console.error('Failed to save rating to localStorage:', e);
    }

    return currentRatings;
  }

  /**
   * Remove a single movie rating.
   */
  removeRating(movieId) {
    const key = String(movieId);
    const currentRatings = this.getRatings();
    if (key in currentRatings) {
      delete currentRatings[key];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentRatings));
      } catch (e) {
        console.error('Failed to update localStorage after delete:', e);
      }
    }
    return currentRatings;
  }

  /**
   * Clear all stored ratings.
   */
  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear ratings from localStorage:', e);
    }
  }

  /**
   * Helper: extract a clean { movieId: rating } dictionary for recommendation APIs.
   */
  getRatingsPayload() {
    const ratings = this.getRatings();
    const payload = {};
    for (const [idStr, data] of Object.entries(ratings)) {
      const numId = parseInt(idStr, 10);
      if (!isNaN(numId) && data.rating) {
        payload[numId] = Number(data.rating);
      }
    }
    return payload;
  }

  /**
   * Helper: get list of rated TMDB IDs.
   */
  getRatedMovieIds() {
    return Object.keys(this.getRatings()).map((id) => parseInt(id, 10));
  }
}

export const storage = new StorageService();
