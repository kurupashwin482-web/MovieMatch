import React, { useState, useEffect, useCallback } from 'react';
import { Star, Film, Sparkles, RefreshCw } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const RatedMoviesSection = ({ onRateMovie, onDeleteRating, onExploreClick }) => {
  const { refreshRatingsCount } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserRatings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUserRatings();
      setRatings(data.ratings || []);
    } catch (err) {
      setError(err.message || 'Failed to load your rated movies.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRatings();
  }, [fetchUserRatings]);

  const handleDelete = async (movieId) => {
    if (onDeleteRating) {
      await onDeleteRating(movieId);
      setRatings((prev) => prev.filter((r) => r.movie_id !== movieId));
    }
  };

  const handleRate = async (movieId, score) => {
    if (onRateMovie) {
      await onRateMovie(movieId, score);
      setRatings((prev) =>
        prev.map((r) => (r.movie_id === movieId ? { ...r, rating: score } : r))
      );
    }
  };

  return (
    <div className="rated-movies-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">⭐ Your Rated Movies</h2>
          <p className="section-subtitle">
            These ratings shape your personalized TF-IDF and Genre recommendation profiles.
          </p>
        </div>

        <button
          type="button"
          className="btn-refresh"
          onClick={fetchUserRatings}
          disabled={loading}
          title="Reload rated movies"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Reload</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your ratings...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn-secondary" onClick={fetchUserRatings}>
            Retry
          </button>
        </div>
      ) : ratings.length === 0 ? (
        <div className="empty-state">
          <Film size={44} className="empty-icon" />
          <h3>No ratings yet!</h3>
          <p>You haven't rated any movies yet. Explore the catalogue and rate at least 5 movies.</p>
          {onExploreClick && (
            <button className="btn-primary-action" onClick={onExploreClick}>
              <Sparkles size={18} />
              <span>Explore Movies Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="movies-grid">
          {ratings.map((item) => {
            if (!item.movie) return null;
            const movieData = {
              ...item.movie,
              user_rating: item.rating,
            };
            return (
              <MovieCard
                key={item.movie_id}
                movie={movieData}
                onRate={handleRate}
                onDeleteRating={handleDelete}
                isRatedView={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
