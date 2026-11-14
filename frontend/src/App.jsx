import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RatingProgressBar } from './components/RatingProgressBar';
import { RecommendationSection } from './components/RecommendationSection';
import { MovieSearchSection } from './components/MovieSearchSection';
import { RatedMoviesSection } from './components/RatedMoviesSection';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';
import { api } from './services/api';
import { Film, Sparkles, LogIn } from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading, refreshRatingsCount } = useAuth();
  const [currentView, setCurrentView] = useState('recommendations'); // 'recommendations', 'search', 'ratings'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleRateMovie = async (movieId, rating) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await api.rateMovie(movieId, rating);
      await refreshRatingsCount();
      showToast(`Rating saved: ${rating.toFixed(1)} ★`);
    } catch (err) {
      showToast(err.message || 'Failed to submit rating', 'error');
    }
  };

  const handleDeleteRating = async (movieId) => {
    if (!isAuthenticated) return;
    try {
      await api.deleteRating(movieId);
      await refreshRatingsCount();
      showToast('Rating removed', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete rating', 'error');
    }
  };

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="spinner" />
        <h2>Loading MovieMatch...</h2>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onAuthClick={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {!isAuthenticated ? (
          /* Unauthenticated Landing / Welcome Hero */
          <div className="unauth-hero-container">
            <div className="hero-content">
              <div className="hero-icon-glow">
                <Film size={54} />
              </div>
              <h1 className="hero-title">
                Find Your Next Favorite Movie with <span className="hero-highlight">Machine Learning</span>
              </h1>
              <p className="hero-description">
                MovieMatch combines <strong>Bayesian Popularity Ranking</strong>, <strong>TF-IDF Plot Content Similarity</strong>,
                and <strong>Multi-Hot Genre Profile Blending</strong> to recommend films tailored specifically to your taste.
              </p>

              <div className="hero-actions">
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  <LogIn size={20} />
                  <span>Get Started / Sign In</span>
                </button>
              </div>

              {/* Feature pillars */}
              <div className="features-grid">
                <div className="feature-card">
                  <span className="feature-badge">Algorithm 1</span>
                  <h3>🔥 Popularity-Based</h3>
                  <p>Bayesian weighted ranking formula trained on extensive MovieLens rating distributions.</p>
                </div>

                <div className="feature-card">
                  <span className="feature-badge">Algorithm 2</span>
                  <h3>🎯 TF-IDF Content-Based</h3>
                  <p>Dynamic preference vectorization across 20,000 text features extracted from movie overviews.</p>
                </div>

                <div className="feature-card">
                  <span className="feature-badge">Algorithm 3</span>
                  <h3>🧬 Genre-Based Hybrid</h3>
                  <p>Multi-hot genre cosine similarity blended with Bayesian quality scores at &alpha; = 0.5.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="authenticated-dashboard">
            {/* Rating Progress Bar */}
            <RatingProgressBar
              onExploreClick={() => setCurrentView('search')}
            />

            {/* Active View Container */}
            {currentView === 'recommendations' && (
              <RecommendationSection
                onRateMovie={handleRateMovie}
                onExploreClick={() => setCurrentView('search')}
              />
            )}

            {currentView === 'search' && (
              <MovieSearchSection
                onRateMovie={handleRateMovie}
              />
            )}

            {currentView === 'ratings' && (
              <RatedMoviesSection
                onRateMovie={handleRateMovie}
                onDeleteRating={handleDeleteRating}
                onExploreClick={() => setCurrentView('search')}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>MovieMatch &bull; ML-Based Movie Recommendation System &bull; Course Project</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
