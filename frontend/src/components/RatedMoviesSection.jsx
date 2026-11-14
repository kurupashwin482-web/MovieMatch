import React, { useState } from 'react';
import { Trash2, Film, Sparkles, CheckCircle2 } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { useRatings } from '../context/RatingsContext';

export const RatedMoviesSection = ({ onExploreClick, onRateMovie, onDeleteRating, onClearRatings }) => {
  const { ratings, ratingsCount, clearRatings } = useRatings();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const ratedList = Object.values(ratings).sort(
    (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
  );

  const handleClearAll = () => {
    clearRatings();
    setShowConfirmClear(false);
    if (onClearRatings) {
      onClearRatings();
    }
  };

  return (
    <div className="rated-movies-container">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">⭐ Your Rated Movies ({ratingsCount})</h2>
          <p className="section-subtitle">
            Stored locally in your browser. These ratings dynamically shape your personalized TF-IDF and Genre recommendation profiles.
          </p>
        </div>

        {ratingsCount > 0 && (
          <div className="rated-actions-bar">
            {showConfirmClear ? (
              <div className="confirm-clear-box">
                <span className="confirm-clear-text">Clear all {ratingsCount} ratings?</span>
                <button
                  type="button"
                  className="btn-danger-confirm"
                  onClick={handleClearAll}
                >
                  Yes, Clear All
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowConfirmClear(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-clear-all"
                onClick={() => setShowConfirmClear(true)}
                title="Remove all ratings from browser storage"
              >
                <Trash2 size={15} />
                <span>Clear All Ratings</span>
              </button>
            )}
          </div>
        )}
      </div>

      {ratingsCount === 0 ? (
        <div className="empty-state">
          <Film size={44} className="empty-icon" />
          <h3>No ratings stored yet!</h3>
          <p>
            Your ratings will be saved in your browser's local storage. Rate at least 5 movies to unlock personalized content-based and genre-based recommendations.
          </p>
          {onExploreClick && (
            <button className="btn-primary-action" onClick={onExploreClick}>
              <Sparkles size={18} />
              <span>Explore & Rate Movies</span>
            </button>
          )}
        </div>
      ) : (
        <div className="movies-grid">
          {ratedList.map((item) => {
            const movieData = {
              tmdbId: item.tmdbId,
              title: item.title,
              release_year: item.release_year,
              genres: item.genres,
              poster_url: item.poster_url,
              poster_path: item.poster_path,
              overview: item.overview,
              avg_rating: item.avg_rating,
              rating_count: item.rating_count,
              user_rating: item.rating,
            };

            return (
              <MovieCard
                key={item.tmdbId}
                movie={movieData}
                onRate={onRateMovie}
                onDeleteRating={onDeleteRating}
                isRatedView={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
