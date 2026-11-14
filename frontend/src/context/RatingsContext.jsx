import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';

const RatingsContext = createContext(null);

export const RatingsProvider = ({ children }) => {
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const requiredRatings = 5;

  // Load ratings from localStorage on mount
  useEffect(() => {
    const loaded = storage.getRatings();
    setRatings(loaded);
    setLoading(false);
  }, []);

  const rateMovie = useCallback((movie, ratingScore) => {
    const updated = storage.saveRating(movie, ratingScore);
    if (updated) {
      setRatings({ ...updated });
    }
  }, []);

  const removeRating = useCallback((movieId) => {
    const updated = storage.removeRating(movieId);
    if (updated) {
      setRatings({ ...updated });
    }
  }, []);

  const clearRatings = useCallback(() => {
    storage.clearAll();
    setRatings({});
  }, []);

  const getRatingForMovie = useCallback(
    (movieId) => {
      const entry = ratings[String(movieId)];
      return entry ? entry.rating : null;
    },
    [ratings]
  );

  const getRatingsPayload = useCallback(() => {
    return storage.getRatingsPayload();
  }, []);

  const getRatedMovieIds = useCallback(() => {
    return storage.getRatedMovieIds();
  }, []);

  const ratingsCount = Object.keys(ratings).length;
  const personalizedUnlocked = ratingsCount >= requiredRatings;

  return (
    <RatingsContext.Provider
      value={{
        ratings,
        ratingsCount,
        requiredRatings,
        personalizedUnlocked,
        loading,
        rateMovie,
        removeRating,
        clearRatings,
        getRatingForMovie,
        getRatingsPayload,
        getRatedMovieIds,
      }}
    >
      {children}
    </RatingsContext.Provider>
  );
};

export const useRatings = () => {
  const context = useContext(RatingsContext);
  if (!context) {
    throw new Error('useRatings must be used within a RatingsProvider');
  }
  return context;
};
