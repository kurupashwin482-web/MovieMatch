import React, { useState } from 'react';
import { Film, Calendar, Star } from 'lucide-react';
import { StarRating } from './StarRating';
import { useRatings } from '../context/RatingsContext';

export const MovieCard = ({
  movie,
  rank,
  onRate,
  onDeleteRating,
  isRatedView = false,
}) => {
  const { getRatingForMovie, rateMovie, removeRating } = useRatings();
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
    score,
    score_type,
  } = movie;

  const currentRating = movie.user_rating !== undefined ? movie.user_rating : getRatingForMovie(tmdbId);

  const handleRatingChange = (newRating) => {
    rateMovie(movie, newRating);
    if (onRate) {
      onRate(movie, newRating);
    }
  };

  const handleDelete = () => {
    removeRating(tmdbId);
    if (onDeleteRating) {
      onDeleteRating(tmdbId);
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
    <div className={`movie-card ${currentRating ? 'is-rated' : ''}`}>
      {rank !== undefined && <div className="rank-badge">#{rank}</div>}

      <div className="poster-container">
        {poster_url && !imageError ? (
          <img
            src={poster_url}
            alt={title ? `${title} (${release_year || 'Movie'}) poster` : 'Movie poster'}
            className="movie-poster"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="poster-fallback neutral-fallback">
            <div className="neutral-fallback-body">
              <div className="neutral-fallback-icon">
                <Film size={36} strokeWidth={1.5} className="neutral-film-icon" />
              </div>
              <h4 className="neutral-fallback-title" title={title}>
                {title}
              </h4>
              {release_year ? (
                <span className="neutral-fallback-year">
                  <Calendar size={12} />
                  {release_year}
                </span>
              ) : null}
              <span className="neutral-fallback-badge">
                Poster Unavailable
              </span>
            </div>
            {genres && genres.length > 0 && (
              <div className="neutral-fallback-footer">
                <span className="neutral-genre-text">
                  {genres.slice(0, 2).join(' • ')}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="poster-overlay">
          {formatScoreBadge()}
          {avg_rating && (
            <span className="global-rating-badge" title={`${rating_count || 0} global ratings`}>
              <Star size={12} fill="#fbbf24" color="#fbbf24" className="star-icon filled" />
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
              {currentRating ? 'Your Rating:' : 'Rate this movie:'}
            </span>
            <StarRating
              rating={currentRating || 0}
              onRate={handleRatingChange}
              size={18}
            />
          </div>

          {isRatedView && (
            <button
              type="button"
              className="btn-delete-rating"
              onClick={handleDelete}
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
