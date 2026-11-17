import React from 'react';
import { Film, Compass, Search, Star, Sparkles, BookOpen } from 'lucide-react';
import { useRatings } from '../context/RatingsContext';

export const Navbar = ({ currentView, onViewChange }) => {
  const { ratingsCount, requiredRatings, personalizedUnlocked } = useRatings();

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="nav-brand" onClick={() => onViewChange('recommendations')}>
          <div className="brand-logo-glow">
            <Film className="brand-icon" size={24} />
          </div>
          <div>
            <span className="brand-title">
              Movie<span className="brand-accent">Match</span>
            </span>
            <span className="brand-subtag">ML Recommender</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          <button
            type="button"
            className={`nav-link ${currentView === 'recommendations' ? 'active' : ''}`}
            onClick={() => onViewChange('recommendations')}
          >
            <Compass size={17} />
            <span>Recommendations</span>
          </button>

          <button
            type="button"
            className={`nav-link ${currentView === 'search' ? 'active' : ''}`}
            onClick={() => onViewChange('search')}
          >
            <Search size={17} />
            <span>Explore & Search</span>
          </button>

          <button
            type="button"
            className={`nav-link ${currentView === 'ratings' ? 'active' : ''}`}
            onClick={() => onViewChange('ratings')}
          >
            <Star size={17} />
            <span>My Ratings</span>
            {ratingsCount > 0 && <span className="nav-badge">{ratingsCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-link ${currentView === 'analysis' ? 'active' : ''}`}
            onClick={() => onViewChange('analysis')}
          >
            <BookOpen size={17} />
            <span>Project Analysis</span>
          </button>
        </nav>

        {/* Anonymous Ratings Pill */}
        <div className="nav-user-controls">
          <div
            className={`ratings-pill ${personalizedUnlocked ? 'unlocked' : 'locked'}`}
            title={
              personalizedUnlocked
                ? 'Personalized TF-IDF & Genre recommendations unlocked!'
                : `Rate at least ${requiredRatings} movies to unlock personalized ML models.`
            }
            onClick={() => onViewChange('recommendations')}
          >
            <Sparkles size={14} />
            <span>
              <strong>{ratingsCount}</strong> / {requiredRatings} Rated
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
