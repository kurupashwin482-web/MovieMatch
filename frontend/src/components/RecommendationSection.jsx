import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Flame, Compass, Dna, RefreshCw, Lock, Sparkles, AlertCircle, SlidersHorizontal } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { api } from '../services/api';
import { useRatings } from '../context/RatingsContext';

export const RecommendationSection = ({ onExploreClick, onRateMovie }) => {
  const { ratingsCount, requiredRatings, personalizedUnlocked, getRatingsPayload, getRatedMovieIds } = useRatings();
  const [activeTab, setActiveTab] = useState('popularity');
  const [topK, setTopK] = useState(10);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [retryingLive, setRetryingLive] = useState(false);

  // Track request sequence to prevent tab-switching race conditions
  const requestIdRef = useRef(0);

  const fetchRecommendations = useCallback(async (tab, kVal = topK, isRetry = false) => {
    const currentId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    if (isRetry) {
      setRetryingLive(true);
    }

    const targetK = Math.max(5, Math.min(20, Number(kVal) || 10));
    const timeoutMs = isRetry ? 45000 : undefined;

    try {
      let data;
      if (tab === 'popularity') {
        const ratedIds = getRatedMovieIds();
        data = await api.getPopularityRecommendations(ratedIds, targetK, timeoutMs);
      } else if (tab === 'tfidf') {
        const payload = getRatingsPayload();
        data = await api.getTfidfRecommendations(payload, targetK, timeoutMs);
      } else if (tab === 'genre') {
        const payload = getRatingsPayload();
        data = await api.getGenreRecommendations(payload, targetK, timeoutMs);
      }

      if (currentId !== requestIdRef.current) return;
      setMovies(data?.movies || []);
      setIsFallback(Boolean(data?.is_fallback));
    } catch (err) {
      if (currentId !== requestIdRef.current) return;
      if (err.status === 400 && (tab === 'tfidf' || tab === 'genre')) {
        setError(err.message || 'At least 5 ratings required for personalized recommendations.');
        setMovies([]);
      } else {
        if (!isRetry) {
          setError(err.message || 'Failed to load recommendations. Please try again.');
          setMovies([]);
        }
      }
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
        setRetryingLive(false);
      }
    }
  }, [getRatingsPayload, getRatedMovieIds, topK]);

  useEffect(() => {
    if (activeTab === 'popularity' || personalizedUnlocked) {
      fetchRecommendations(activeTab, topK);
    } else {
      setMovies([]);
      setError(null);
      setLoading(false);
    }
  }, [activeTab, personalizedUnlocked, topK, fetchRecommendations]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const isTabLocked = (activeTab === 'tfidf' || activeTab === 'genre') && !personalizedUnlocked;

  return (
    <div className="recommendations-container">
      {/* Algorithm Tabs & Top-K Controls Header */}
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

        <div className="recommendation-controls-bar">
          <div className="top-k-slider-container">
            <div className="top-k-label-group">
              <label htmlFor="top-k-slider" className="top-k-slider-label">
                <SlidersHorizontal size={15} />
                <span>Number of recommendations: <strong className="top-k-value-pill">{topK}</strong></span>
              </label>
              <span className="top-k-range-indicator">(5 – 20)</span>
            </div>
            <div className="top-k-slider-track-wrap">
              <span className="slider-endpoint">5</span>
              <input
                id="top-k-slider"
                type="range"
                min="5"
                max="20"
                step="1"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="top-k-range-input"
                aria-label="Number of recommendations"
              />
              <span className="slider-endpoint">20</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-refresh"
            onClick={() => fetchRecommendations(activeTab, topK)}
            disabled={loading || isTabLocked}
            title="Regenerate recommendations with selected K"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Generate / Refresh</span>
          </button>
        </div>
      </div>

      {/* Algorithm Explanatory Banner */}
      <div className="algo-info-card">
        {activeTab === 'popularity' && (
          <div>
            <h4 className="info-title">🔥 Bayesian Popularity Ranking</h4>
            <p className="info-desc">
              Ranks movies using the IMDb weighted rating formula based on global rating counts and averages.
              Automatically excludes movies you have already rated. Does not require 5 ratings.
            </p>
          </div>
        )}
        {activeTab === 'tfidf' && (
          <div>
            <h4 className="info-title">🎯 Content-Based Profile Matching (TF-IDF)</h4>
            <p className="info-desc">
              Builds a personalized vector profile across 20,000 TF-IDF plot summary features from your submitted ratings.
              Ratings above 3 amplify themes, while ratings below 3 penalize them.
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

      {/* Fallback notification when cloud ML backend is asleep or spinning up */}
      {isFallback && !isTabLocked && !loading && (
        <div className="fallback-banner">
          <div className="fallback-banner-content">
            <span className="fallback-pill">Offline / Cold-Start Fallback</span>
            <span className="fallback-text">
              The live cloud ML backend (Render free tier) is currently asleep or spinning up. Displaying high-speed client-side recommendations.
            </span>
          </div>
          <button
            type="button"
            className="btn-retry-live"
            onClick={() => fetchRecommendations(activeTab, topK, true)}
            disabled={loading || retryingLive}
            title="Attempt to connect to the live FastAPI backend on Render"
          >
            <RefreshCw size={14} className={retryingLive ? 'animate-spin' : ''} />
            <span>{retryingLive ? 'Connecting (~30s)...' : 'Connect to Live Backend'}</span>
          </button>
        </div>
      )}

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
            <strong>{requiredRatings} movie ratings</strong> to construct your taste profile.
          </p>
          <div className="locked-progress-badge">
            Currently rated: <strong>{ratingsCount}</strong> / {requiredRatings}
          </div>
          <p className="locked-hint">
            Rate {requiredRatings - ratingsCount} more movie{requiredRatings - ratingsCount > 1 ? 's' : ''} in the explore section to unlock this model.
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
          <p>
            {retryingLive
              ? 'Waking up cloud ML backend container on Render (this may take up to 45 seconds)...'
              : 'Computing recommendations via machine learning models...'}
          </p>
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
