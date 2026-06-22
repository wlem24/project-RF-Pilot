import React from 'react';
import { ArrowUpRightIcon } from '../icons/Icons.jsx';

const TYPE_DOT = {
  comment:       '#818cf8',
  approval:      '#1D9E75',
  status_change: '#EF9F27',
  system:        '#484f58',
};

function relativeTime(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RightPanel({ notifications = [], deadlines = [], onOpenChat }) {
  return (
    <div className="right-panel">

      {/* ── Notifications ── */}
      <div>
        <div className="ptitle">
          <i className="ti ti-bell" style={{ fontSize: 13 }} />
          Notifications
        </div>
        {notifications.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--faint)', padding: '4px 0' }}>No notifications</p>
        ) : (
          notifications.slice(0, 8).map(n => (
            <div key={n.id} className="notif">
              <div className="ndot" style={{ background: TYPE_DOT[n.type] || '#484f58' }} />
              <div>
                <div className="ntext">{n.message}</div>
                <div className="ntime">{relativeTime(n.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Upcoming Deadlines ── */}
      <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 12 }}>
        <div className="ptitle">
          <i className="ti ti-calendar-event" style={{ fontSize: 13 }} />
          Upcoming deadlines
        </div>
        {deadlines.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--faint)', padding: '4px 0' }}>No deadlines found</p>
        ) : (
          deadlines.slice(0, 5).map((d, i) => (
            <div key={d.id || d.rfpId + i} className="dl-item">
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                  {d.rfpTitle || d.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--faint)' }}>{d.dueDate || d.deadline}</div>
              </div>
              <span className={`pill ${d.urgency === 'urgent' ? 'pill-red' : 'pill-amber'}`} style={{ fontSize: 10 }}>
                {d.urgency === 'urgent' ? 'Urgent' : 'Upcoming'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* ── AI Co-Pilot ── */}
      <div className="copilot">
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 10px',
        }}>
          <i className="ti ti-robot" style={{ color: '#fff', fontSize: 18 }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f6fc', marginBottom: 4 }}>AI Co-Pilot</div>
        <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 12 }}>Ask anything about your RFPs</div>
        <button
          onClick={onOpenChat}
          style={{
            width: '100%', padding: 8,
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 7,
            fontSize: 12, cursor: 'pointer', fontWeight: 500,
            fontFamily: 'inherit',
          }}
        >
          Open AI Chat <ArrowUpRightIcon size={13} color="#fff" style={{ verticalAlign: 'middle', marginLeft: 3 }} />
        </button>
      </div>

    </div>
  );
}
