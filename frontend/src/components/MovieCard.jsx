import React, { useState } from 'react';
import { Film, Calendar, Star, Info } from 'lucide-react';
import { StarRating } from './StarRating';

export const MovieCard = ({
  movie,
  rank,
  onRate,
  onDeleteRating,
  isRatedView = false,
  isSubmitting = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);

  const {
    tmdbId,
    title,
    release_year,
    genres = [],
    overview,
    avg_rating,
    rating_count,
    poster_url,
    user_rating,
    score,
    score_type,
  } = movie;

  const handleRatingChange = (newRating) => {
    if (onRate) {
      onRate(tmdbId, newRating);
    }
  };

  const formatScoreBadge = () => {
    if (score === undefined || score === null) return null;
    if (score_type === 'popularity') {
      return (
        <span className="score-badge popularity" title="Bayesian Weighted Rating (IMDb formula)">
          ★ {score.toFixed(2)} Popularity
        </span>
      );
    }
    if (score_type === 'tfidf') {
      return (
        <span className="score-badge tfidf" title="TF-IDF Cosine Similarity Score">
          🎯 {(score * 100).toFixed(1)}% Match
        </span>
      );
    }
    if (score_type === 'genre') {
      return (
        <span className="score-badge genre" title="Hybrid Genre Similarity + Bayesian Quality">
          🧬 {score.toFixed(3)} Hybrid Score
        </span>
      );
    }
    return (
      <span className="score-badge generic">
        Score: {score.toFixed(2)}
      </span>
    );
  };

  return (
    <div className={`movie-card ${user_rating ? 'is-rated' : ''}`}>
      {rank !== undefined && <div className="rank-badge">#{rank}</div>}

      <div className="poster-container">
        {poster_url && !imageError ? (
          <img
            src={poster_url}
            alt={title}
            className="movie-poster"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="poster-fallback">
            <Film size={40} className="fallback-icon" />
            <span className="fallback-title">{title}</span>
            {release_year && <span className="fallback-year">{release_year}</span>}
          </div>
        )}

        <div className="poster-overlay">
          {formatScoreBadge()}
          {avg_rating && (
            <span className="global-rating-badge" title={`${rating_count || 0} global ratings`}>
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              {avg_rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="movie-details">
        <div className="title-row">
          <h3 className="movie-title" title={title}>
            {title}
          </h3>
          {release_year ? (
            <span className="release-year">
              <Calendar size={13} />
              {release_year}
            </span>
          ) : null}
        </div>

        {genres && genres.length > 0 && (
          <div className="genre-tags">
            {genres.slice(0, 3).map((g) => (
              <span key={g} className="genre-pill">
                {g}
              </span>
            ))}
          </div>
        )}

        {overview && (
          <div className="overview-container">
            <p className={`movie-overview ${showFullOverview ? 'expanded' : 'clamped'}`}>
              {overview}
            </p>
            {overview.length > 120 && (
              <button
                type="button"
                className="btn-toggle-overview"
                onClick={() => setShowFullOverview(!showFullOverview)}
              >
                {showFullOverview ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        <div className="card-rating-footer">
          <div className="rating-action-wrap">
            <span className="rating-label-hint">
              {user_rating ? 'Your Rating:' : 'Rate this movie:'}
            </span>
            <StarRating
              rating={user_rating || 0}
              onRate={handleRatingChange}
              disabled={isSubmitting}
              size={18}
            />
          </div>

          {isRatedView && onDeleteRating && (
            <button
              type="button"
              className="btn-delete-rating"
              onClick={() => onDeleteRating(tmdbId)}
              disabled={isSubmitting}
              title="Remove your rating"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
