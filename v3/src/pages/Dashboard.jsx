import React, { useState } from 'react';
import TopNavbar        from '../components/layout/TopNavbar.jsx';
import FilterBar        from '../components/dashboard/FilterBar.jsx';
import KPISection       from '../components/dashboard/KPISection.jsx';
import TrackingTabs     from '../components/dashboard/TrackingTabs.jsx';
import BidDecisionCards from '../components/dashboard/BidDecisionCards.jsx';
import RightPanel       from '../components/dashboard/RightPanel.jsx';
import { useAsync }     from '../hooks/useAsync.js';
import { rfpApi, notifApi, deadlineApi } from '../services/api.js';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [filters, setFilters] = useState({});

  // ── Global data (no filter dependency) ───────────────────────────
  const statsState    = useAsync(() => rfpApi.getStats().then(r => r.data),         []);
  const pipelineState = useAsync(() => rfpApi.getPipelineValue().then(r => r.data), []);
  const clientsState  = useAsync(() => rfpApi.getTopClients().then(r => r.data),    []);
  const ownersState   = useAsync(() => rfpApi.getOwners().then(r => r.data || []),  []);
  const notifState    = useAsync(() => notifApi.list().then(r => r.data   || []),   []);
  const deadlineState = useAsync(() => deadlineApi.list().then(r => r.data || []),  []);

  // ── Filter-dependent: RFPs with decisions (for bid cards) ─────────
  const filtersKey = JSON.stringify(filters);
  const decisionRfpsState = useAsync(
    () => rfpApi.list({ ...filters, has_decision: true }).then(r => r.data || []),
    [filtersKey]
  );

  // Build dynamic filter option lists
  const clientOptions = (clientsState.data || []).map(c => ({ value: c.name, label: c.name }));
  const ownerOptions  = ownersState.data || [];

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
            stats={statsState.data || {}}
            loading={statsState.loading}
          />
          <TrackingTabs
            pipelineData={pipelineState.data || []}
            topClients={clientsState.data || []}
            deadlines={deadlineState.data || []}
            statusCounts={statsState.data || {}}
          />
          <BidDecisionCards
            rfps={decisionRfpsState.data || []}
            loading={decisionRfpsState.loading}
          />
        </div>

        <RightPanel
          notifications={notifState.data || []}
          deadlines={deadlineState.data || []}
          onOpenChat={() => {}}
        />
      </div>
    </div>
  );
}
