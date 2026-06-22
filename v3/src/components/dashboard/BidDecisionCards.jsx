import React from 'react';
import { useNavigate } from 'react-router-dom';

function BidCard({ rfp }) {
  const navigate  = useNavigate();
  const isBid     = rfp.bid_decision === 'bid';
  const isNoBid   = rfp.bid_decision === 'no_bid';
  const label     = isBid ? '✓ BID' : isNoBid ? '✗ NO BID' : rfp.bid_decision?.toUpperCase();
  const badgeClass= isBid ? 'bid-yes' : 'bid-no';

  const positiveFlags = rfp.positive_flags || [];
  const riskFlags     = rfp.risk_flags     || [];

  return (
    <div className="bid-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/detail?id=${rfp.id}`)}>
      <div className="bid-header">
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{rfp.title}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{rfp.client || 'Unknown client'}</div>
        </div>
        <span className={`decision-badge ${badgeClass}`}>{label}</span>
      </div>

      {(positiveFlags.length > 0 || riskFlags.length > 0) ? (
        <div>
          {positiveFlags.slice(0, 2).map((f, i) => (
            <div key={i} className="rationale-item">
              <div className="rat-icon" style={{ background: '#dcfce7' }}>
                <i className="ti ti-check" style={{ color: '#16a34a', fontSize: 12 }} />
              </div>
              <div>
                <div className="rat-label">Green flag</div>
                <div className="rat-text">{typeof f === 'string' ? f : JSON.stringify(f)}</div>
              </div>
            </div>
          ))}
          {riskFlags.slice(0, 1).map((f, i) => (
            <div key={i} className="rationale-item">
              <div className="rat-icon" style={{ background: '#fee2e2' }}>
                <i className="ti ti-alert-triangle" style={{ color: '#dc2626', fontSize: 12 }} />
              </div>
              <div>
                <div className="rat-label">Risk flag</div>
                <div className="rat-text">{typeof f === 'string' ? f : JSON.stringify(f)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 8 }}>
          {rfp.summary ? rfp.summary.slice(0, 100) + '…' : 'No additional details'}
        </p>
      )}
    </div>
  );
}

export default function BidDecisionCards({ rfps = [], loading = false }) {
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

      {loading ? (
        <div className="bid-grid">
          {[1, 2].map(i => (
            <div key={i} className="bid-card">
              <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : rfps.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--faint)', padding: '12px 0' }}>
          No bid decisions recorded yet. Open an RFP and set a decision on the Decision tab.
        </div>
      ) : (
        <div className="bid-grid">
          {rfps.map(rfp => <BidCard key={rfp.id} rfp={rfp} />)}
        </div>
      )}
    </div>
  );
}
