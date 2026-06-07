import React, { useState } from 'react';
import '../styles/register.css';
import axios from 'axios';
import toast from 'react-hot-toast';



// هنا استبدلت ال alert بال toast 
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (form.password !== form.confirmPassword) {
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/register", {
        full_name: form.fullName,
        email: form.email,
        role: form.role,
        password: form.password
      });

      toast.success(`Account created successfully! User ID is: ${response.data.id}`);
      console.log("Added:", response.data);

    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Error: Server not responding");
      }
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">

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

        <main className="register-right">
          <h1 className="reg-title">
            Create account<span className="reg-title-dot">.</span>
          </h1>
          <p className="reg-subtitle">Start navigating RFPs smarter</p>

          <form className="reg-form" onSubmit={handleSubmit} noValidate>

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

            <button type="submit" className="reg-btn">
              Create account
            </button>

            <p className="reg-terms">
              By signing up you agree to our{' '}
              <a href="#" className="reg-link">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="reg-link">Privacy Policy</a>.
            </p>

            <p className="reg-footer">
              Already have an account?{' '}
              <a href="/login" className="reg-link">Sign in →</a>
            </p>

          </form>
        </main>

      </div>
    </div>
  );
}

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
