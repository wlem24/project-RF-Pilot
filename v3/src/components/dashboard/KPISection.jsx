import React from 'react';

function TrendBadge({ change }) {
  if (change === null || change === undefined) return null;
  const up    = change >= 0;
  const label = `${change >= 0 ? '+' : ''}${change}%`;
  return (
    <span className={`badge ${up ? 'up' : 'down'}`} style={{ marginTop: 4 }}>
      <i className={`ti ${up ? 'ti-trending-up' : 'ti-trending-down'}`} style={{ fontSize: 10 }} />
      {label} vs last month
    </span>
  );
}

function KPICard({ label, value, change, colorClass }) {
  return (
    <div className={`kpi ${colorClass}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <TrendBadge change={change} />
    </div>
  );
}

export default function KPISection({ stats = {}, loading = false }) {
  const cards = [
    { label: 'Total RFPs',   value: stats.total        ?? 0,    change: stats.total_change,       colorClass: 'k1' },
    { label: 'Active RFPs',  value: stats.active       ?? 0,    change: stats.active_change,      colorClass: 'k2' },
    { label: 'Under Review', value: stats.under_review ?? 0,    change: stats.under_review_change, colorClass: 'k3' },
    { label: 'Submitted',    value: stats.submitted    ?? 0,    change: stats.submitted_change,   colorClass: 'k4' },
    { label: 'Archived',     value: stats.archived     ?? 0,    change: null,                     colorClass: 'k5' },
    { label: 'Win Rate',     value: `${stats.win_rate ?? 0}%`,  change: null,                     colorClass: 'k6' },
  ];

  if (loading) {
    return (
      <div className="kpi-grid">
        {cards.map(c => (
          <div key={c.label} className={`kpi ${c.colorClass}`}>
            <div className="kpi-label">{c.label}</div>
            <div className="skeleton" style={{ height: 28, width: 48, borderRadius: 6, marginTop: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="kpi-grid">
      {cards.map(c => <KPICard key={c.label} {...c} />)}
    </div>
  );
}
