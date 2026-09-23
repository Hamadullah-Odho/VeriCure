import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent duplicate submissions

    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        toast.success('Login successful');
        navigate('/dashboard');
      } else {
        setError(result.message);
        toast.error(result.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">VeriCure</div>
        <div className="auth-tagline">Admin Dashboard</div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} autoComplete="off">
          <label className="field-label">Email</label>
          <input
            className="field-input"
            type="email"
            name="vericure-admin-identifier"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            required
          />

          <label className="field-label">Password</label>
          <input
            className="field-input"
            type="password"
            name="vericure-admin-secret"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="btn-loading-content">
                <span className="btn-spinner" aria-hidden="true" />
                Signing in...
              </span>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="auth-switch">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <div className="auth-switch">
          Need an admin account?{' '}
          <Link to="/signup">Request access</Link>
        </div>
      </div>
    </div>
  );
}
