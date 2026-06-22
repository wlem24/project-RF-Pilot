import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invitationApi } from '../services/api.js';
import { CheckCircleIcon, MailIcon } from '../components/icons/Icons.jsx';

export default function AcceptInvitePage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get('token') || '';

  const [preview,   setPreview]   = useState(null);   // {email, role, status}
  const [name,      setName]      = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [fetching,  setFetching]  = useState(true);

  useEffect(() => {
    if (!token) { setError('No invitation token found in the URL.'); setFetching(false); return; }
    invitationApi.preview(token)
      .then(r => setPreview(r.data))
      .catch(err => setError(err.response?.data?.detail || 'Invalid or expired invitation link.'))
      .finally(() => setFetching(false));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await invitationApi.accept(token, name.trim(), password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  }

  // ── Styles shared ──────────────────────────────────────────────────────────
  const card = {
    maxWidth: 440, margin: '80px auto', padding: 36,
    background: '#fff', borderRadius: 16, border: '0.5px solid #e5e7eb',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  };

  if (fetching) return (
    <div style={card}>
      <p style={{ textAlign: 'center', color: '#6b7280' }}>Validating invitation…</p>
    </div>
  );

  if (error && !preview) return (
    <div style={card}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
        Invitation not valid
      </h2>
      <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>
      <button
        onClick={() => navigate('/login')}
        style={{ marginTop: 20, padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
      >
        Go to login
      </button>
    </div>
  );

  if (success) return (
    <div style={card}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <CheckCircleIcon size={56} color="#22C55E" strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Account created!
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          You can now sign in to RFPilot as <strong>{preview?.role}</strong>.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '10px 32px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          Go to login
        </button>
      </div>
    </div>
  );

  return (
    <div style={card}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
          <MailIcon size={40} color="#6366F1" strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          You've been invited to RFPilot
        </h2>
        {preview && (
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Joining as <strong style={{ color: '#6366f1' }}>{preview.role?.charAt(0).toUpperCase() + preview.role?.slice(1)}</strong>
            {' '}· {preview.email}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>
            YOUR NAME
          </label>
          <input
            type="text"
            placeholder="Jane Smith"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '0.5px solid #d1d5db', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>
            PASSWORD
          </label>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '0.5px solid #d1d5db', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>
            CONFIRM PASSWORD
          </label>
          <input
            type="password"
            placeholder="Repeat password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '0.5px solid #d1d5db', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {error && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '11px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
        >
          {loading ? 'Creating account…' : 'Create account & join'}
        </button>
      </form>
    </div>
  );
}
