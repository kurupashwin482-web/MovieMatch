import React, { useState } from 'react';
import { LogIn, UserPlus, Film, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!username.trim()) {
      setFormError('Please enter your username or email.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    if (mode === 'register') {
      if (!email.trim() || !email.includes('@')) {
        setFormError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), email.trim(), password);
      }
      if (onClose) onClose();
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setFormError('');
  };

  return (
    <div className="auth-modal-backdrop">
      <div className="auth-modal-card">
        {onClose && (
          <button className="auth-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        )}

        <div className="auth-brand-header">
          <div className="brand-icon-box">
            <Film size={26} className="text-red-500" />
          </div>
          <h2 className="auth-brand-title">MovieMatch</h2>
          <p className="auth-brand-subtitle">
            {mode === 'login'
              ? 'Log in to access your movie ratings & personalized ML recommendations'
              : 'Create your account and start discovering personalized movies'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            <LogIn size={16} /> Log In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            <UserPlus size={16} /> Register
          </button>
        </div>

        {formError && (
          <div className="auth-error-alert">
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{mode === 'login' ? 'Username or Email' : 'Username'}</label>
            <input
              type="text"
              placeholder={mode === 'login' ? 'Enter username or email' : 'e.g. cinemafan'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner-inline" /> Please wait...
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
