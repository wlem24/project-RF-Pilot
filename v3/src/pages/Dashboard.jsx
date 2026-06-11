import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // useNavigate allows programmatic navigation between pages
// [MODIFIED] Using v3 Navbar which includes useAuth and logout rename it TopNavbar
import TopNavbar           from '../components/layout/TopNavbar.jsx';
import FilterBar        from '../components/dashboard/FilterBar.jsx';
import KPISection       from '../components/dashboard/KPISection.jsx';
import TrackingTabs     from '../components/dashboard/TrackingTabs.jsx';
import BidDecisionCards from '../components/dashboard/BidDecisionCards.jsx';
import RightPanel       from '../components/dashboard/RightPanel.jsx';
import AIChat           from '../components//layout/AIChat.jsx';

import '../styles/dashboard.css';

export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);
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
          {/* [ADDED] navigates to /upload-rfp page */}
          <button className="btn-sm btn-p" onClick={() => window.location.href = '/upload-rfp'}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} />
           Upload RFP 
          </button> {/* Upload RFP button — navigates to /upload page */}
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
        <RightPanel onOpenChat={() => setChatOpen(true)} />
      </div>

      {/* ── Floating AI Chat ── */}
      <AIChat
        isOpen={chatOpen}
        onToggle={() => setChatOpen((prev) => !prev)}
      />

    </div>
  );
}
