// Dashboard constants

export const DEFAULT_LABELS = {
  status:         'All Statuses',
  client:         'All Clients',
  deadline_range: 'Any Date',
  owner:          'All Owners',
  priority:       'All Priorities',
};

// Static filter option shapes.
// client and owner options are injected dynamically by Dashboard.jsx
// (from GET /rfps/top-clients and GET /rfps/owners respectively).
export const FILTER_OPTIONS = {
  status: [
    { value: 'All Statuses', label: 'All Statuses' },
    { value: 'Under Review', label: 'Under Review', dot: '#a855f7' },
    { value: 'Drafting',     label: 'Drafting',     dot: '#1D9E75' },
    { value: 'Submitted',    label: 'Submitted',    dot: '#EF9F27' },
    { value: 'Archived',     label: 'Archived',     dot: '#484f58' },
  ],
  client: [
    { value: 'All Clients', label: 'All Clients' },
    // populated at runtime by Dashboard.jsx from GET /rfps/top-clients
  ],
  deadline_range: [
    { value: 'Any Date',      label: 'Any Date'     },
    { value: 'next_7_days',   label: 'Next 7 days',  iconColor: '#f87171' },
    { value: 'next_30_days',  label: 'Next 30 days', iconColor: '#818cf8' },
    { value: 'overdue',       label: 'Overdue',      iconColor: '#f87171', icon: 'ti-alert-circle' },
  ],
  owner: [
    { value: 'All Owners', label: 'All Owners' },
    // populated at runtime by Dashboard.jsx from GET /rfps/owners
  ],
  priority: [
    { value: 'All Priorities', label: 'All Priorities' },
    { value: 'critical',       label: 'Critical',       iconColor: '#f87171' },
    { value: 'high',           label: 'High',           iconColor: '#fbbf24' },
    { value: 'medium',         label: 'Medium',         iconColor: '#818cf8' },
    { value: 'low',            label: 'Low',            iconColor: '#4ade80' },
  ],
};

// Chart.js shared style helpers
export const CHART_GRID  = 'rgba(255,255,255,0.05)';
export const CHART_TICKS = '#484f58';
