import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerRequest } from '../api/auth';
import '../styles/register.css';

const ROLES = [
  'Admin',
  'Proposal Manager',
  'Sales Manager',
  'Business Analyst',
  'Technical Writer',
  'Reviewer',
];

const FEATURES = [
  'AI-powered proposal generation',
  'Team collaboration workflows',
  'Smart deadline tracking',
  'Enterprise-grade security',
];

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [submitted, setSubmitted]           = useState(false);

  const passwordMatch =
    form.password && form.confirmPassword
      ? form.password === form.confirmPassword
      : null;

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!passwordMatch || !form.role) return;
    // Send registration to backend. On success, redirect to login.
    registerRequest(form.fullName, form.email, form.password, form.role)
      .then(() => {
        alert('Account created successfully. Please sign in.');
        navigate('/login');
      })
      .catch((err) => alert(err?.response?.data?.detail || 'Registration failed'));
  };

  const navigate = useNavigate();

  return (
    <div className="register-page">
      <div className="register-container">

        {/* ── LEFT PANEL ── */}
        <aside className="register-left">
          <div className="reg-logo">
            RFPilot<span className="reg-logo-dot">.</span>
          </div>
          <p className="reg-tagline">
            Navigate RFPs smarter, faster, together.
          </p>
          <div className="reg-divider" />
          <ul className="reg-features">
            {FEATURES.map((f) => (
              <li key={f} className="reg-feature-item">
                <span className="reg-feature-check">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </aside>

        {/* ── RIGHT PANEL ── */}
        <main className="register-right">
          <h1 className="reg-title">
            Create account<span className="reg-title-dot">.</span>
          </h1>
          <p className="reg-subtitle">Start navigating RFPs smarter</p>

          <form className="reg-form" onSubmit={handleSubmit} noValidate>

            {/* Full Name */}
            <div className="reg-field">
              <label className="reg-label">Full Name</label>
              <input
                className="reg-input"
                type="text"
                placeholder="Sara Al-Rashidi"
                value={form.fullName}
                onChange={handleChange('fullName')}
                required
              />
            </div>

            {/* Corporate Email */}
            <div className="reg-field">
              <label className="reg-label">Corporate Email</label>
              <input
                className="reg-input"
                type="email"
                placeholder="sara@company.com"
                value={form.email}
                onChange={handleChange('email')}
                required
              />
            </div>

            {/* Role */}
            <div className="reg-field">
              <label className="reg-label">Select Role</label>
              <div className="reg-select-wrapper">
                <select
                  className={`reg-select${!form.role ? ' placeholder' : ''}`}
                  value={form.role}
                  onChange={handleChange('role')}
                  required
                >
                  <option value="" disabled>Choose your role…</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <span className="reg-select-arrow">▾</span>
              </div>
            </div>

            {/* Password */}
            <div className="reg-field">
              <label className="reg-label">Password</label>
              <div className="reg-pw-wrapper">
                <input
                  className="reg-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange('password')}
                  required
                />
                <button
                  type="button"
                  className="reg-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="reg-field">
              <label className="reg-label">Confirm Password</label>
              <div className="reg-pw-wrapper">
                <input
                  className={`reg-input${
                    submitted && passwordMatch === false ? ' error' : ''
                  }${passwordMatch === true ? ' success' : ''}`}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  required
                />
                <button
                  type="button"
                  className="reg-eye-btn"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {submitted && passwordMatch === false && (
                <p className="reg-validation-msg error">✕ Passwords do not match.</p>
              )}
              {passwordMatch === true && (
                <p className="reg-validation-msg success">✓ Passwords match</p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="reg-btn">
              Create account
            </button>

            {/* Terms */}
            <p className="reg-terms">
              By signing up you agree to our{' '}
              <a href="#" className="reg-link">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="reg-link">Privacy Policy</a>.
            </p>

            {/* Sign in link */}
            <p className="reg-footer">
              Already have an account?{' '}
              <Link to="/login" className="reg-link">Sign in →</Link>
            </p>

          </form>
        </main>

      </div>
    </div>
  );
}

/* ── SVG Icons ── */
function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
