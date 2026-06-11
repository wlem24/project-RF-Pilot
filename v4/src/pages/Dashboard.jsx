import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// [MODIFIED] Using v3 Navbar which includes useAuth and logout rename it TopNavbar
import TopNavbar        from '../components/layout/TopNavbar.jsx';
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

      {/* ── Filters ── */}
      <FilterBar />

      {/* ── Main Body ── */}
      <div className="body">

        {/* Left/Main column */}
        <div className="main">
          <KPISection />
          {/* [MODIFIED] Buttons Today + Upload RFP moved into TrackingTabs header */}
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
