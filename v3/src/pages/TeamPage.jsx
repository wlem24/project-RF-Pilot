import { useState } from 'react';
import TopNavbar    from '../components/layout/TopNavbar.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useAuth }  from '../auth/AuthProvider.jsx';
import { teamApi, invitationApi } from '../services/api.js';
import InviteModal  from '../components/team/InviteModal.jsx';
import '../styles/dashboard.css';

const ROLE_COLORS = {
  admin: { bg: '#ede9fe', color: '#6d28d9' },
  user:  { bg: '#f0f9ff', color: '#0284c7' },
};

const STATUS_COLORS = {
  pending:  { bg: '#fef9c3', color: '#854d0e' },
  accepted: { bg: '#f0fdf4', color: '#15803d' },
  expired:  { bg: '#f3f4f6', color: '#6b7280' },
  revoked:  { bg: '#fff1f2', color: '#be123c' },
};

function RoleBadge({ role }) {
  const s = ROLE_COLORS[role] || ROLE_COLORS.user;
  return (
    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {role?.charAt(0).toUpperCase() + role?.slice(1)}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.expired;
  return (
    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue      = (name?.charCodeAt(0) || 0) * 137 % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue},52%,44%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function TeamPage() {
  const { user }          = useAuth();
  const isAdmin           = user?.role === 'admin';
  const [showInvite, setShowInvite] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(null);
  const [removing, setRemoving]         = useState(null);

  const membersState     = useAsync(() => teamApi.listMembers().then(r => r.data || []), []);
  const invitationsState = useAsync(() => isAdmin ? invitationApi.list().then(r => r.data || []) : Promise.resolve([]), [isAdmin]);

  const members     = membersState.data     || [];
  const invitations = invitationsState.data || [];

  async function handleRoleChange(memberId, newRole) {
    setRoleUpdating(memberId);
    try {
      await teamApi.updateRole(memberId, newRole);
      membersState.refetch();
    } finally {
      setRoleUpdating(null);
    }
  }

  async function handleRemove(memberId) {
    if (!window.confirm('Remove this team member? This cannot be undone.')) return;
    setRemoving(memberId);
    try {
      await teamApi.removeMember(memberId);
      membersState.refetch();
    } finally {
      setRemoving(null);
    }
  }

  async function handleRevoke(inviteId) {
    if (!window.confirm('Revoke this invitation?')) return;
    await invitationApi.revoke(inviteId);
    invitationsState.refetch();
  }

  async function handleResend(inviteId) {
    await invitationApi.resend(inviteId);
    invitationsState.refetch();
  }

  return (
    <div className="page">
      <TopNavbar />

      <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Team</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              Manage team members and invitations
            </p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
              <i className="ti ti-user-plus" style={{ marginRight: 6 }} />
              Invite member
            </button>
          )}
        </div>

        {/* Members card */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Members ({members.length})</h2>
          <div className="accent-bar" />

          {membersState.loading ? (
            <div className="skeleton" style={{ height: 60, borderRadius: 8 }} />
          ) : members.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--faint)' }}>No members yet.</p>
          ) : (
            <div>
              {members.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: '0.5px solid var(--border)',
                }}>
                  <Avatar name={m.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                      {m.name} {m.isYou && <span style={{ color: 'var(--faint)', fontWeight: 400 }}>(you)</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.email}</div>
                  </div>

                  {isAdmin && !m.isYou ? (
                    <select
                      value={m.role}
                      disabled={roleUpdating === m.id}
                      onChange={e => handleRoleChange(m.id, e.target.value)}
                      style={{
                        fontSize: 12, padding: '4px 8px', borderRadius: 6,
                        border: '0.5px solid var(--border)', background: 'var(--bg-card)',
                        color: 'var(--text)', cursor: 'pointer',
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <RoleBadge role={m.role} />
                  )}

                  {isAdmin && !m.isYou && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      disabled={removing === m.id}
                      title="Remove member"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ef4444', fontSize: 16, padding: 4,
                      }}
                    >
                      <i className="ti ti-user-minus" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invitations card (admin only) */}
        {isAdmin && (
          <div className="card">
            <h2 className="card-title">Invitations ({invitations.length})</h2>
            <div className="accent-bar" />

            {invitationsState.loading ? (
              <div className="skeleton" style={{ height: 60, borderRadius: 8 }} />
            ) : invitations.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--faint)' }}>No invitations sent yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: 'var(--muted)', textAlign: 'left' }}>
                    {['Email', 'Role', 'Invited by', 'Expires', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '6px 8px', fontWeight: 500, borderBottom: '0.5px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ padding: '10px 8px', color: 'var(--text)' }}>{inv.email}</td>
                      <td style={{ padding: '10px 8px' }}><RoleBadge role={inv.role} /></td>
                      <td style={{ padding: '10px 8px', color: 'var(--muted)' }}>{inv.invitedBy}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--muted)' }}>
                        {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '10px 8px' }}><StatusBadge status={inv.status} /></td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(inv.status === 'pending' || inv.status === 'expired') && (
                            <button
                              onClick={() => handleResend(inv.id)}
                              style={{ fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              Resend
                            </button>
                          )}
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => handleRevoke(inv.id)}
                              style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setShowInvite(false); invitationsState.refetch(); }}
        />
      )}
    </div>
  );
}
