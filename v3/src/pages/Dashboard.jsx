import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavbar           from '../components/layout/TopNavbar.jsx';
import FilterBar        from '../components/dashboard/FilterBar.jsx';
import KPISection       from '../components/dashboard/KPISection.jsx';
import TrackingTabs     from '../components/dashboard/TrackingTabs.jsx';
import BidDecisionCards from '../components/dashboard/BidDecisionCards.jsx';
import RightPanel       from '../components/dashboard/RightPanel.jsx';

import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="page">

      {/* ── Top Navigation ── */}
      <TopNavbar />

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div style={{ fontSize: 11, color: 'var(--faint)', marginBottom: 3 }}>
            Dashboards / Default
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
            Pipeline &amp; Deadlines
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-sm">
            <i className="ti ti-calendar" style={{ fontSize: 13 }} />
            Today
          </button>
          <button className="btn-sm btn-p" onClick={() => navigate('/upload-rfp')}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} />
           Upload RFP
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <FilterBar />

      {/* ── Main Body ── */}
      <div className="body">

        {/* Left/Main column */}
        <div className="main">
          <KPISection />
          <TrackingTabs />
          <BidDecisionCards />
        </div>

        {/* Right panel */}
        <RightPanel onOpenChat={() => {}} />
      </div>

    </div>
  );
}
