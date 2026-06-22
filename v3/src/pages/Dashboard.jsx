import React, { useState } from 'react';
import TopNavbar        from '../components/layout/TopNavbar.jsx';
import FilterBar        from '../components/dashboard/FilterBar.jsx';
import KPISection       from '../components/dashboard/KPISection.jsx';
import TrackingTabs     from '../components/dashboard/TrackingTabs.jsx';
import BidDecisionCards from '../components/dashboard/BidDecisionCards.jsx';
import RightPanel       from '../components/dashboard/RightPanel.jsx';
import { useAsync }     from '../hooks/useAsync.js';
import { dashboardApi } from '../services/api.js';
import { useChat }      from '../context/ChatContext.jsx';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [filters, setFilters] = useState({});
  const { openChat } = useChat();

  // Single unified call — all dashboard data, all filters applied server-side.
  // Replaces the previous 7 separate API calls.
  const filtersKey = JSON.stringify(filters);
  const analyticsState = useAsync(
    () => dashboardApi.getAnalytics(filters).then(r => r.data),
    [filtersKey]
  );

  const data    = analyticsState.data || {};
  const loading = analyticsState.loading;

  // Map the unified response to each component's expected props
  const stats        = data.stats        || {};
  const pipelineData = data.pipeline_value|| [];
  const topClients   = data.top_clients  || [];
  const owners       = data.owners       || [];
  const notifications= data.notifications|| [];
  const deadlines    = data.deadlines    || [];
  const decisionRfps = data.decision_rfps|| [];

  // Build filter dropdown option lists from the unified response
  const clientOptions = topClients.map(c => ({ value: c.name, label: c.name }));
  const ownerOptions  = owners;

  return (
    <div className="page">
      <TopNavbar />
      <FilterBar
        onChange={setFilters}
        clientOptions={clientOptions}
        ownerOptions={ownerOptions}
      />

      <div className="body">
        <div className="main">
          <KPISection
            stats={stats}
            loading={loading && !data.stats}
          />
          <TrackingTabs
            pipelineData={pipelineData}
            topClients={topClients}
            deadlines={deadlines}
            statusCounts={stats}
          />
          <BidDecisionCards
            rfps={decisionRfps}
            loading={loading && !data.decision_rfps}
          />
        </div>

        <RightPanel
          notifications={notifications}
          deadlines={deadlines}
          onOpenChat={openChat}
        />
      </div>
    </div>
  );
}
