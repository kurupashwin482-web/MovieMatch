import React, { useState } from 'react';
import { useRatings } from './context/RatingsContext';
import { Navbar } from './components/Navbar';
import { RatingProgressBar } from './components/RatingProgressBar';
import { RecommendationSection } from './components/RecommendationSection';
import { MovieSearchSection } from './components/MovieSearchSection';
import { RatedMoviesSection } from './components/RatedMoviesSection';
import { Toast } from './components/Toast';

export default function App() {
  const { loading } = useRatings();
  const [currentView, setCurrentView] = useState('recommendations'); // 'recommendations', 'search', 'ratings'
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleRateMovie = (movie, rating) => {
    showToast(`Saved ${rating.toFixed(1)} ★ for "${movie.title}"`);
  };

  const handleDeleteRating = (movieId) => {
    showToast('Rating removed from local storage');
  };

  const handleClearRatings = () => {
    showToast('All ratings cleared from local storage');
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
      {/* Header / Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <div className="dashboard-container">
          {/* Rating Progress Bar */}
          <RatingProgressBar
            onExploreClick={() => setCurrentView('search')}
          />

          {/* Active View Container */}
          {currentView === 'recommendations' && (
            <RecommendationSection
              onExploreClick={() => setCurrentView('search')}
              onRateMovie={handleRateMovie}
            />
          )}

          {currentView === 'search' && (
            <MovieSearchSection
              onRateMovie={handleRateMovie}
            />
          )}

          {currentView === 'ratings' && (
            <RatedMoviesSection
              onExploreClick={() => setCurrentView('search')}
              onRateMovie={handleRateMovie}
              onDeleteRating={handleDeleteRating}
              onClearRatings={handleClearRatings}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>
            <strong>MovieMatch</strong> &bull; ES 335 Machine Learning Course Project &bull; Anonymous Browser-Based ML Inference
          </p>
          <p className="footer-subtext">
            Three distinct recommendation algorithms: Bayesian Popularity, 20k-feature TF-IDF Content Profile, and Multi-Hot Genre Hybrid (&alpha; = 0.5).
          </p>
        </div>
      </footer>

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
