import React, { useState, useEffect, useCallback } from 'react';
import { Flame, Compass, Dna, RefreshCw, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const RecommendationSection = ({ onRateMovie, onExploreClick }) => {
  const { ratingsCount, requiredRatings, personalizedUnlocked } = useAuth();
  const [activeTab, setActiveTab] = useState('popularity');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async (tab) => {
    setLoading(true);
    setError(null);

    try {
      let data;
      if (tab === 'popularity') {
        data = await api.getPopularityRecommendations(10);
      } else if (tab === 'tfidf') {
        data = await api.getTfidfRecommendations(10);
      } else if (tab === 'genre') {
        data = await api.getGenreRecommendations(10);
      }
      setMovies(data.movies || []);
    } catch (err) {
      if (err.status === 400 && (tab === 'tfidf' || tab === 'genre')) {
        setError(err.message || 'At least 5 ratings required for personalized recommendations.');
      } else {
        setError(err.message || 'Failed to load recommendations.');
      }
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only attempt personalized fetch if unlocked, or if popularity
    if (activeTab === 'popularity' || personalizedUnlocked) {
      fetchRecommendations(activeTab);
    } else {
      setMovies([]);
      setError(null);
    }
  }, [activeTab, personalizedUnlocked, fetchRecommendations]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const isTabLocked = (activeTab === 'tfidf' || activeTab === 'genre') && !personalizedUnlocked;

  return (
    <div className="recommendations-container">
      {/* Algorithm Tabs */}
      <div className="algo-tabs-header">
        <div className="algo-tabs">
          <button
            type="button"
            className={`algo-tab ${activeTab === 'popularity' ? 'active' : ''}`}
            onClick={() => handleTabChange('popularity')}
          >
            <Flame size={18} />
            <span>Popularity-Based</span>
          </button>

          <button
            type="button"
            className={`algo-tab ${activeTab === 'tfidf' ? 'active' : ''}`}
            onClick={() => handleTabChange('tfidf')}
          >
            {!personalizedUnlocked ? <Lock size={16} className="tab-lock-icon" /> : <Compass size={18} />}
            <span>TF-IDF Content</span>
          </button>

          <button
            type="button"
            className={`algo-tab ${activeTab === 'genre' ? 'active' : ''}`}
            onClick={() => handleTabChange('genre')}
          >
            {!personalizedUnlocked ? <Lock size={16} className="tab-lock-icon" /> : <Dna size={18} />}
            <span>Genre-Based</span>
          </button>
        </div>

        <button
          type="button"
          className="btn-refresh"
          onClick={() => fetchRecommendations(activeTab)}
          disabled={loading || isTabLocked}
          title="Refresh recommendations"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Algorithm Explanatory Banner */}
      <div className="algo-info-card">
        {activeTab === 'popularity' && (
          <div>
            <h4 className="info-title">🔥 Bayesian Popularity Ranking</h4>
            <p className="info-desc">
              Ranks movies using the IMDb weighted rating formula based on overall mean rating and rating frequency.
              Excludes movies you have already rated. Available immediately.
            </p>
          </div>
        )}
        {activeTab === 'tfidf' && (
          <div>
            <h4 className="info-title">🎯 Content-Based Profile Matching (TF-IDF)</h4>
            <p className="info-desc">
              Builds a personalized vector profile across 20,000 TF-IDF plot summary features from your movie ratings.
              Positive ratings amplify themes, while negative ratings suppress them.
            </p>
          </div>
        )}
        {activeTab === 'genre' && (
          <div>
            <h4 className="info-title">🧬 Multi-Hot Genre & Bayesian Quality Hybrid</h4>
            <p className="info-desc">
              Blends your genre preference profile with Bayesian movie quality scores (&alpha; = 0.5) using positive-only
              rating weights: w(r) = max(0, r - 3).
            </p>
          </div>
        )}
      </div>

      {/* Locked State for TF-IDF / Genre if ratings < 5 */}
      {isTabLocked ? (
        <div className="locked-view-card">
          <div className="locked-icon-badge">
            <Lock size={36} />
          </div>
          <h3 className="locked-heading">
            Personalized Recommendations Locked
          </h3>
          <p className="locked-subtext">
            {activeTab === 'tfidf' ? 'TF-IDF Content' : 'Genre-Based'} recommendations require at least{' '}
            <strong>{requiredRatings} movie ratings</strong> to learn your taste profile.
          </p>
          <div className="locked-progress-badge">
            Currently rated: <strong>{ratingsCount}</strong> / {requiredRatings}
          </div>
          <p className="locked-hint">
            Rate {requiredRatings - ratingsCount} more movie{requiredRatings - ratingsCount > 1 ? 's' : ''} to unlock this recommender.
          </p>
          {onExploreClick && (
            <button className="btn-primary-action" onClick={onExploreClick}>
              <Sparkles size={18} />
              <span>Explore & Rate Movies</span>
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Computing recommendations via machine learning models...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={28} />
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => fetchRecommendations(activeTab)}>
            Try Again
          </button>
        </div>
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <p>No recommendations available. Try rating different movies.</p>
        </div>
      ) : (
        <div className="movies-grid">
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.tmdbId}
              movie={movie}
              rank={index + 1}
              onRate={onRateMovie}
            />
          ))}
        </div>
      )}
    </div>
  );
};
