import React from 'react';
import { NOTIFICATIONS, DEADLINES } from '../data/constants.js';

export default function RightPanel({ onOpenChat }) {
  return (
    <div className="right-panel">

      {/* ── Notifications ── */}
      <div>
        <div className="ptitle">
          <i className="ti ti-bell" style={{ fontSize: 13 }} />
          Notifications
        </div>
        {NOTIFICATIONS.map((n, i) => (
          <div key={i} className="notif">
            <div className="ndot" style={{ background: n.dotColor }} />
            <div>
              <div className="ntext">{n.text}</div>
              <div className="ntime">{n.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Upcoming Deadlines ── */}
      <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 12 }}>
        <div className="ptitle">
          <i className="ti ti-calendar-event" style={{ fontSize: 13 }} />
          Upcoming deadlines
        </div>
        {DEADLINES.map((d) => (
          <div key={d.name} className="dl-item">
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{d.name}</div>
              <div style={{ fontSize: 10, color: 'var(--faint)' }}>{d.date}</div>
            </div>
            <span className={`pill ${d.pill}`}>{d.days}</span>
          </div>
        ))}
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
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f6fc', marginBottom: 4 }}>
          AI Co-Pilot
        </div>
        <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 12 }}>
          Ask anything about your RFPs
        </div>
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
          Open AI Chat ↗
        </button>
      </div>

    </div>
  );
}
