import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Filter, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { api } from '../services/api';

export const MovieSearchSection = ({ onRateMovie }) => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track latest request ID to ignore stale responses
  const requestIdRef = useRef(0);

  // Load genres once at mount
  useEffect(() => {
    let isMounted = true;
    const fetchGenres = async () => {
      try {
        const list = await api.getGenres();
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setGenres(list);
        }
      } catch (err) {
        console.error('Failed to load genres:', err);
      }
    };
    fetchGenres();
    return () => {
      isMounted = false;
    };
  }, []);

  const searchMovies = useCallback(async (q, g, p) => {
    const currentId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const data = await api.searchMovies({
        query: q,
        genre: g,
        page: p,
        limit,
      });

      // Ignore if a newer request was dispatched
      if (currentId !== requestIdRef.current) return;

      setMovies(data.movies || []);
      setTotal(data.total || 0);
    } catch (err) {
      if (currentId !== requestIdRef.current) return;
      setError(err.message || 'Failed to search movies. Please try again.');
      setMovies([]);
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [limit]);

  // Debounced search trigger on query, genre, or page change
  useEffect(() => {
    const timer = setTimeout(
      () => {
        searchMovies(query, selectedGenre, page);
      },
      query ? 250 : 0
    );

    return () => clearTimeout(timer);
  }, [query, selectedGenre, page, searchMovies]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    searchMovies(query, selectedGenre, 1);
  };

  const handleClearQuery = () => {
    setQuery('');
    setPage(1);
  };

  const handleGenreChange = (e) => {
    setSelectedGenre(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedGenre('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const hasActiveFilters = Boolean(query || selectedGenre);

  return (
    <div className="search-section-container">
      {/* Search Bar & Filters */}
      <div className="search-controls-card">
        <form onSubmit={handleSearchSubmit} className="search-input-form">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search movies by title (e.g. Inception, Dark Knight, Toy Story)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="search-input"
            />
            {query && (
              <button
                type="button"
                className="btn-clear-query"
                onClick={handleClearQuery}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="genre-filter-wrap">
            <Filter size={16} className="genre-filter-icon" />
            <select
              value={selectedGenre}
              onChange={handleGenreChange}
              className="genre-select"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={handleResetFilters}
              title="Reset all search filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </form>

        <div className="search-summary-row">
          <span className="results-count">
            {loading ? 'Searching...' : `Found ${total.toLocaleString()} movie${total === 1 ? '' : 's'}`}
          </span>
          {totalPages > 1 && (
            <span className="page-indicator">
              Page {page} of {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Movies Grid / Status */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading catalogue movies...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => searchMovies(query, selectedGenre, page)}
          >
            Try Again
          </button>
        </div>
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <p>No movies matched your search query. Try another keyword or genre.</p>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleResetFilters}
              style={{ marginTop: '1rem' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="movies-grid">
          {movies.map((movie) => (
            <MovieCard
              key={movie.tmdbId}
              movie={movie}
              onRate={onRateMovie}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            type="button"
            className="btn-page"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="page-current">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-page"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
