import React from 'react';
import { Sparkles, Lock, Unlock, Film } from 'lucide-react';
import { useRatings } from '../context/RatingsContext';

export const RatingProgressBar = ({ onExploreClick }) => {
  const { ratingsCount, requiredRatings, personalizedUnlocked } = useRatings();

  const progressPercent = Math.min(100, Math.round((ratingsCount / requiredRatings) * 100));

  return (
    <div className={`rating-progress-card ${personalizedUnlocked ? 'unlocked' : 'locked'}`}>
      <div className="progress-header">
        <div className="progress-title-wrap">
          {personalizedUnlocked ? (
            <Unlock className="progress-icon text-emerald-400" size={20} />
          ) : (
            <Lock className="progress-icon text-amber-400" size={20} />
          )}
          <div>
            <h4 className="progress-title">
              {personalizedUnlocked
                ? 'Personalized Recommendations Unlocked!'
                : 'Unlock Personalized Recommendations'}
            </h4>
            <p className="progress-subtitle">
              {personalizedUnlocked
                ? `You have rated ${ratingsCount} movies. Your ratings are stored locally in your browser and used to compute TF-IDF and Genre models.`
                : `Rate at least ${requiredRatings} movies to construct your dynamic TF-IDF and Genre preference profiles.`}
            </p>
          </div>
        </div>

        <div className="progress-stats">
          <span className="count-badge">
            <Film size={14} />
            <strong>{ratingsCount}</strong> / {requiredRatings} rated
          </span>
          {!personalizedUnlocked && onExploreClick && (
            <button className="btn-explore-prompt" onClick={onExploreClick}>
              <Sparkles size={14} /> Explore Movies
            </button>
          )}
        </div>
      </div>

      <div className="progress-track">
        <div
          className={`progress-fill ${personalizedUnlocked ? 'fill-emerald' : 'fill-amber'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
