import { useState } from 'react';
import { invitationApi } from '../../services/api.js';

export default function InviteModal({ onClose, onSuccess }) {
  const [email,     setEmail]     = useState('');
  const [role,      setRole]      = useState('user');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [inviteUrl, setInviteUrl] = useState('');  // shown when SMTP not configured

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInviteUrl('');
    if (!email.trim()) { setError('Email is required.'); return; }

    setLoading(true);
    try {
      const res  = await invitationApi.create(email.trim(), role);
      const data = res.data;

      if (data.inviteUrl) {
        // SMTP not configured — show the link so admin can share manually
        setInviteUrl(data.inviteUrl);
      } else {
        onSuccess();
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div className="card" style={{ width: 440, padding: 28, position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted)' }}
        >
          ×
        </button>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Invite team member</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px' }}>
          An invitation email will be sent with a secure sign-up link.
        </p>

        {inviteUrl ? (
          <div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#15803d', margin: '0 0 8px' }}>
                ✓ Invitation created — share this link manually
              </p>
              <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 8px' }}>
                Email delivery is not configured (SMTP_HOST is empty). Copy and share this link:
              </p>
              <input
                readOnly
                value={inviteUrl}
                onClick={e => e.target.select()}
                style={{ width: '100%', fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '0.5px solid #d1d5db', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onSuccess}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                EMAIL ADDRESS
              </label>
              <input
                className="input"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                ROLE
              </label>
              <select
                className="input"
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="user">User — can view and work on RFPs</option>
                <option value="admin">Admin — can manage team and all settings</option>
              </select>
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Sending…' : 'Send invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
