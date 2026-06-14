import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import '../styles/login.css';

const FEATURES = [
  'AI-powered proposal generation',
  'Team collaboration workflows',
  'Smart deadline tracking',
  'Enterprise-grade security',
];

const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function Login() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Call AuthProvider.login which handles token storage and profile fetch
    auth
      .login(form.email, form.password)
      .then(() => navigate('/dashboard'))
      .catch((err) => alert(err?.response?.data?.detail || 'Login failed'));
  };

  const navigate = useNavigate();
  const auth = useAuth();

  return (
    <div className="login-page">
      <div className="login-container">

        {/* ── LEFT PANEL ── */}
        <aside className="login-left">
          <div className="login-logo">
            RFPilot<span className="login-logo-dot">.</span>
          </div>
          <p className="login-tagline">
            Navigate RFPs smarter, faster, together.
          </p>
          <div className="login-divider" />
          <ul className="login-features">
            {FEATURES.map((f) => (
              <li key={f} className="login-feature-item">
                <span className="login-feature-check">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </aside>

        {/* ── RIGHT PANEL ── */}
        <main className="login-right">
          <h1 className="login-title">
            Sign in<span className="login-title-dot">.</span>
          </h1>
          <p className="login-subtitle">Welcome back to RFPilot</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="login-field">
              <label className="login-label">Email</label>
              <input
                className="login-input"
                type="email"
                placeholder="sara@company.com"
                value={form.email}
                onChange={handleChange('email')}
                required
              />
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-pw-wrapper">
                <input
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange('password')}
                  required
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="login-btn">
              Sign in
            </button>

            {/* Forgot password link */}
            <p className="login-forgot">
              <a href="#" className="login-link">Forgot password?</a>
            </p>

            {/* Sign up link */}
            <p className="login-footer">
              Don't have an account?{' '}
              <a href="/register" className="login-link">Create one →</a>
            </p>

          </form>
        </main>
      </div>
    </div>
  );
}