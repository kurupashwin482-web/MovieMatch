import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(api.getToken());
  const [ratingsCount, setRatingsCount] = useState(0);
  const [requiredRatings, setRequiredRatings] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshRatingsCount = useCallback(async () => {
    if (!api.getToken()) {
      setRatingsCount(0);
      return;
    }
    try {
      const summary = await api.getUserRatings();
      setRatingsCount(summary.total_ratings);
      setRequiredRatings(summary.required_ratings || 5);
    } catch (err) {
      // Ignore background refresh failure
    }
  }, []);

  const initAuth = useCallback(async () => {
    const currentToken = api.getToken();
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await api.getMe();
      setUser(profile);
      setRatingsCount(profile.ratings_count || 0);
      await refreshRatingsCount();
    } catch (err) {
      api.logout();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [refreshRatingsCount]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (username, password) => {
    setError(null);
    try {
      const res = await api.login(username, password);
      setUser(res.user);
      setToken(res.access_token);
      setRatingsCount(res.user.ratings_count || 0);
      await refreshRatingsCount();
      return res;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (username, email, password) => {
    setError(null);
    try {
      const res = await api.register(username, email, password);
      setUser(res.user);
      setToken(res.access_token);
      setRatingsCount(0);
      return res;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setToken(null);
    setRatingsCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        ratingsCount,
        requiredRatings,
        personalizedUnlocked: ratingsCount >= requiredRatings,
        loading,
        error,
        login,
        register,
        logout,
        refreshRatingsCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
