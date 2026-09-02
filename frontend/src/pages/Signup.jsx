import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.signup({ fullName, username, email, password });
      loginSuccess(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="auth-screen">
        <h1 className="brand-title">Speakman</h1>
        <p className="brand-subtitle">Create your account to get started</p>

        <div className="signup-avatar-placeholder">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.5" stroke="#22C55E" strokeWidth="1.8" />
            <path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="signup-avatar-plus">+</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="banner-error">{error}</div>}
          <div className="field">
            <label>Full Name</label>
            <div className="input-icon-wrap">
              <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label>Unique User ID</label>
            <div className="input-icon-wrap">
              <span className="input-icon input-icon-at">@</span>
              <input
                type="text"
                placeholder="choose_a_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label>Email</label>
            <div className="input-icon-wrap">
              <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
                <path d="m4.5 7 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label>Password</label>
            <div className="input-icon-wrap">
              <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
                <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="input-icon-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M9.9 5.1A10.7 10.7 0 0 1 12 5c5.5 0 9 5 9 7 0 .7-.5 2-1.6 3.4M6.1 6.7C3.9 8.1 2 10.3 2 12c0 2 3.5 7 10 7 1.4 0 2.7-.2 3.8-.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link className="link" to="/login">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
