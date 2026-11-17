import React, { useState } from 'react';
import { Film, Calendar, Star } from 'lucide-react';
import { StarRating } from './StarRating';
import { useRatings } from '../context/RatingsContext';

function getPosterTheme(genres = []) {
  const g = genres[0] || '';
  if (['Action', 'Adventure'].includes(g)) {
    return {
      gradient: 'linear-gradient(150deg, #450a0a 0%, #1e1b4b 60%, #030712 100%)',
      accent: '#f87171',
      badge: 'ACTION • ADVENTURE',
    };
  }
  if (['Science Fiction', 'Fantasy'].includes(g)) {
    return {
      gradient: 'linear-gradient(150deg, #0c4a6e 0%, #1e1b4b 60%, #020617 100%)',
      accent: '#38bdf8',
      badge: 'SCI-FI & FANTASY',
    };
  }
  if (['Animation', 'Family'].includes(g)) {
    return {
      gradient: 'linear-gradient(150deg, #065f46 0%, #0f172a 60%, #020617 100%)',
      accent: '#34d399',
      badge: 'ANIMATION • FAMILY',
    };
  }
  if (['Comedy', 'Romance'].includes(g)) {
    return {
      gradient: 'linear-gradient(150deg, #831843 0%, #2e1065 60%, #050508 100%)',
      accent: '#f472b6',
      badge: 'COMEDY & ROMANCE',
    };
  }
  if (['Crime', 'Thriller', 'Mystery'].includes(g)) {
    return {
      gradient: 'linear-gradient(150deg, #78350f 0%, #1c1917 60%, #09090b 100%)',
      accent: '#fbbf24',
      badge: 'THRILLER • CRIME',
    };
  }
  if (['Horror'].includes(g)) {
    return {
      gradient: 'linear-gradient(150deg, #450a0a 0%, #180808 60%, #000000 100%)',
      accent: '#ef4444',
      badge: 'HORROR CINEMA',
    };
  }
  if (['Drama', 'History', 'War'].includes(g)) {
    return {
      gradient: 'linear-gradient(150deg, #3b2506 0%, #18181b 60%, #09090b 100%)',
      accent: '#f59e0b',
      badge: 'DRAMA & CINEMA',
    };
  }
  return {
    gradient: 'linear-gradient(150deg, #1e1b4b 0%, #1e293b 60%, #030712 100%)',
    accent: '#818cf8',
    badge: 'MOVIEMATCH SELECTION',
  };
}

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

  const posterTheme = getPosterTheme(genres);

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
            alt={title}
            className="movie-poster"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="poster-fallback branded-poster"
            style={{ background: posterTheme.gradient }}
          >
            <div className="branded-poster-header">
              <span className="branded-logo-tag">
                <Film size={11} className="branded-mini-icon" style={{ color: posterTheme.accent }} />
                <span>MOVIEMATCH</span>
              </span>
              <span className="branded-genre-tag" style={{ color: posterTheme.accent }}>
                {posterTheme.badge}
              </span>
            </div>

            <div className="branded-poster-body">
              <div
                className="branded-emblem"
                style={{
                  borderColor: `${posterTheme.accent}40`,
                  boxShadow: `0 0 24px ${posterTheme.accent}25`,
                }}
              >
                <Film size={32} style={{ color: posterTheme.accent }} />
              </div>
              <h4 className="branded-poster-title" title={title}>
                {title}
              </h4>
              {release_year ? (
                <span className="branded-poster-year">
                  <Calendar size={12} />
                  {release_year}
                </span>
              ) : null}
            </div>

            <div className="branded-poster-footer">
              <div
                className="branded-cinema-stripe"
                style={{
                  background: `linear-gradient(90deg, transparent, ${posterTheme.accent}, transparent)`,
                }}
              />
              <span className="branded-edition-text">
                {genres && genres.length > 0 ? genres.slice(0, 2).join(' • ') : 'Cinematic Release'}
              </span>
            </div>
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
