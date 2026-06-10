// [ADDED] Dashboard data constants — all values zeroed, ready for backend

// ── Filter Definitions ────────────────────────────────────────────
export const DEFAULT_LABELS = {
  status: 'All Statuses',
  client: 'All Clients',
  deadline: 'Any Date',
  owner: 'All Owners',
  priority: 'All Priorities',
};

export const FILTER_OPTIONS = {
  status: [
    { value: 'All Statuses', label: 'All Statuses' },
    { value: 'Under Review', label: 'Under Review', dot: '#a855f7' },
    { value: 'Drafting', label: 'Drafting', dot: '#1D9E75' },
    { value: 'Submitted', label: 'Submitted', dot: '#EF9F27' },
    { value: 'Archived', label: 'Archived', dot: '#484f58' },
  ],
  client: [
    { value: 'All Clients', label: 'All Clients' },
    { value: 'Google', label: '🔵 Google' },
    { value: 'YouTube', label: '🔴 YouTube' },
    { value: 'Saudi Aramco', label: '🟢 Saudi Aramco' },
    { value: 'Ministry of Transport', label: '🟡 Ministry of Transport' },
    { value: 'MOH', label: '🟣 MOH' },
  ],
  deadline: [
    { value: 'Any Date', label: 'Any Date' },
    { value: 'Today', label: 'Today', iconColor: '#f87171' },
    { value: 'This Week', label: 'This Week', iconColor: '#fbbf24' },
    { value: 'This Month', label: 'This Month', iconColor: '#818cf8' },
    { value: 'Overdue', label: 'Overdue', iconColor: '#f87171', icon: 'ti-alert-circle' },
  ],
  owner: [
    { value: 'All Owners', label: 'All Owners' },
    { value: 'Natali Craig', label: 'Natali Craig', initials: 'NC', bg: '#4f46e530', color: '#818cf8' },
    { value: 'Drew Cano', label: 'Drew Cano', initials: 'DC', bg: '#1D9E7525', color: '#4ade80' },
    { value: 'Andi Lane', label: 'Andi Lane', initials: 'AL', bg: '#EF9F2725', color: '#fbbf24' },
    { value: 'Koray Okumus', label: 'Koray Okumus', initials: 'KO', bg: '#E24B4A25', color: '#f87171' },
    { value: 'Kate Morrison', label: 'Kate Morrison', initials: 'KM', bg: '#6d28d925', color: '#a78bfa' },
  ],
  priority: [
    { value: 'All Priorities', label: 'All Priorities' },
    { value: 'Critical', label: 'Critical', iconColor: '#f87171' },
    { value: 'High', label: 'High', iconColor: '#fbbf24' },
    { value: 'Medium', label: 'Medium', iconColor: '#818cf8' },
    { value: 'Low', label: 'Low', iconColor: '#4ade80' },
  ],
};

// ── KPI Data ──────────────────────────────────────────────────────
// TODO: Replace with API call when backend is ready
// GET /api/kpi → [{ label, value, trend, up, colorClass }]
export const KPI_DATA = [
  { label: 'Total RFPs',   value: '0',  trend: '0%', up: true,  colorClass: 'k1' },
  { label: 'Active RFPs',  value: '0',  trend: '0%', up: false, colorClass: 'k2' },
  { label: 'Under Review', value: '0',  trend: '0%', up: true,  colorClass: 'k3' },
  { label: 'Submitted',    value: '0',  trend: '0%', up: true,  colorClass: 'k4' },
  { label: 'Archived',     value: '0',  trend: '0%', up: true,  colorClass: 'k5' },
  { label: 'Win Rate',     value: '0%', trend: '0%', up: true,  colorClass: 'k6' },
];

// ── Top Clients ───────────────────────────────────────────────────
// TODO: Replace with API call when backend is ready
// GET /api/clients/top → [{ name, pct }]
export const TOP_CLIENTS = [];

// ── Upcoming Deadlines ────────────────────────────────────────────
// TODO: Replace with API call when backend is ready
// GET /api/deadlines → [{ name, date, tabDate, days, pill }]
export const DEADLINES = [];

// ── Notifications ─────────────────────────────────────────────────
// TODO: Replace with API call when backend is ready
// GET /api/notifications → [{ text, time, dotColor }]
export const NOTIFICATIONS = [];

// ── Bid/No-Bid Decisions ──────────────────────────────────────────
// TODO: Replace with API call when backend is ready
// GET /api/rfps/decisions → [{ title, subtitle, decision, rationale }]
export const BID_DECISIONS = [];

// ── Chart.js shared grid/tick color helpers ───────────────────────
export const CHART_GRID  = 'rgba(255,255,255,0.05)';
export const CHART_TICKS = '#484f58';
