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

     {/*removed th page header*/}

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
