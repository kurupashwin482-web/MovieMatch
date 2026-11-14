import React from 'react';
import { Film, Compass, Search, Star, LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ currentView, onViewChange, onAuthClick }) => {
  const { user, isAuthenticated, logout, ratingsCount, requiredRatings, personalizedUnlocked } = useAuth();

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="nav-brand" onClick={() => onViewChange('recommendations')}>
          <div className="brand-logo-glow">
            <Film className="brand-icon" size={24} />
          </div>
          <span className="brand-title">
            Movie<span className="brand-accent">Match</span>
          </span>
        </div>

        {/* Navigation Tabs */}
        {isAuthenticated && (
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
          </nav>
        )}

        {/* User / Auth Controls */}
        <div className="nav-user-controls">
          {isAuthenticated ? (
            <>
              {/* Ratings progress pill */}
              <div
                className={`ratings-pill ${personalizedUnlocked ? 'unlocked' : 'locked'}`}
                title={
                  personalizedUnlocked
                    ? 'Personalized recommendations unlocked!'
                    : `Rate at least ${requiredRatings} movies to unlock personalized models.`
                }
                onClick={() => onViewChange('recommendations')}
              >
                <Sparkles size={14} />
                <span>
                  <strong>{ratingsCount}</strong> / {requiredRatings}
                </span>
              </div>

              {/* User Dropdown / Info */}
              <div className="user-profile-info">
                <div className="user-avatar">
                  <User size={15} />
                </div>
                <span className="user-name">{user.username}</span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                className="btn-logout"
                onClick={logout}
                title="Log out of MovieMatch"
              >
                <LogOut size={16} />
                <span className="logout-text">Logout</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-login-nav"
              onClick={onAuthClick}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
