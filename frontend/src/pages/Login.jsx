import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ identifier, password });
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
        <div className="brand-mark">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"
              stroke="white"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="brand-title">Speakman</h1>
        <p className="brand-subtitle">Connect. Share. Be heard.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="banner-error">{error}</div>}
          <div className="field">
            <label>User ID or Email</label>
            <div className="input-icon-wrap">
              <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Enter your user ID or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
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
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <a className="forgot-link" href="#">
            Forgot Password?
          </a>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link className="link" to="/signup">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
