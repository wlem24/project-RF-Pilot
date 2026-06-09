import React from 'react';
import { BID_DECISIONS } from '../data/constants.js';

function RationaleItem({ icon, iconBg, iconColor, label, text }) {
  return (
    <div className="rationale-item">
      <div className="rat-icon" style={{ background: iconBg }}>
        <i className={`ti ${icon}`} style={{ color: iconColor, fontSize: 12 }} />
      </div>
      <div>
        <div className="rat-label">{label}</div>
        <div className="rat-text">{text}</div>
      </div>
    </div>
  );
}

function BidCard({ title, subtitle, decision, rationale }) {
  const isBid = decision === 'BID';
  return (
    <div className="bid-card">
      <div className="bid-header">
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>
        </div>
        <span className={`decision-badge ${isBid ? 'bid-yes' : 'bid-no'}`}>
          {isBid ? '✓ BID' : '✗ NO BID'}
        </span>
      </div>
      <div>
        {rationale.map((r) => (
          <RationaleItem key={r.label} {...r} />
        ))}
      </div>
    </div>
  );
}

export default function BidDecisionCards() {
  return (
    <div>
      <div style={{
        fontSize: 13, fontWeight: 600, color: 'var(--text)',
        marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <i className="ti ti-gavel" style={{ color: 'var(--accent)', fontSize: 16 }} />
        Bid / No-Bid Decisions
        <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 400 }}>
          RFPs with confirmed decisions
        </span>
      </div>
      <div className="bid-grid">
        {BID_DECISIONS.map((d) => (
          <BidCard key={d.title} {...d} />
        ))}
      </div>
    </div>
  );
}
