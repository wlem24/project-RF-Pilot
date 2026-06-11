import React from 'react';
import { KPI_DATA } from '../../data/constants.js';

function KPICard({ label, value, trend, up, colorClass }) {
  return (
    <div className={`kpi ${colorClass}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <span className={`badge ${up ? 'up' : 'down'}`}>
        <i className={`ti ${up ? 'ti-trending-up' : 'ti-trending-down'}`} style={{ fontSize: 10 }} />
        {trend}
      </span>
    </div>
  );
}

export default function KPISection() {
  return (
    <div className="kpi-grid">
      {KPI_DATA.map((kpi) => (
        <KPICard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
