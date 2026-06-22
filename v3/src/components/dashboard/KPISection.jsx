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

function winRateDisplay(rate) {
  if (rate === null || rate === undefined) return { value: 'N/A', color: '#9CA3AF' };
  if (rate >= 70) return { value: `${rate}%`, color: '#059669' };
  if (rate >= 40) return { value: `${rate}%`, color: '#D97706' };
  return { value: `${rate}%`, color: '#DC2626' };
}

function WinRateCard({ stats, loading }) {
  const { value, color } = winRateDisplay(stats.win_rate);
  const decided = (stats.won ?? 0) + (stats.archived ?? 0);
  const subtitle = stats.win_rate === null || stats.win_rate === undefined
    ? 'No completed RFPs yet'
    : `${stats.won ?? 0} won of ${decided} decided`;
  return (
    <div className="kpi k6">
      <div className="kpi-label">Win Rate</div>
      <div className="kpi-value" style={{ color }}>{loading ? '—' : value}</div>
      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{loading ? '' : subtitle}</div>
    </div>
  );
}

export default function KPISection({ stats = {}, loading = false }) {
  const cards = [
    { label: 'Total RFPs',   value: stats.total        ?? 0,    change: stats.total_change,        colorClass: 'k1' },
    { label: 'Active RFPs',  value: stats.active       ?? 0,    change: stats.active_change,       colorClass: 'k2' },
    { label: 'Under Review', value: stats.under_review ?? 0,    change: stats.under_review_change, colorClass: 'k3' },
    { label: 'Submitted',    value: stats.submitted    ?? 0,    change: stats.submitted_change,    colorClass: 'k4' },
    { label: 'Archived',     value: stats.archived     ?? 0,    change: null,                      colorClass: 'k5' },
  ];

  if (loading) {
    return (
      <div className="kpi-grid">
        {[...cards, { label: 'Win Rate', colorClass: 'k6' }].map(c => (
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
      <WinRateCard stats={stats} loading={loading} />
    </div>
  );
}
