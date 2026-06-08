import React, { useState } from 'react';
import Navbar           from '../components/Navbar.jsx';
import FilterBar        from '../components/FilterBar.jsx';
import KPISection       from '../components/KPISection.jsx';
import TrackingTabs     from '../components/TrackingTabs.jsx';
import BidDecisionCards from '../components/BidDecisionCards.jsx';
import RightPanel       from '../components/RightPanel.jsx';
import AIChat           from '../components/AIChat.jsx';

export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="page">

      {/* ── Top Navigation ── */}
      <Navbar />

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
          <button className="btn-sm btn-p">
            <i className="ti ti-plus" style={{ fontSize: 13 }} />
            New RFP
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
