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
export const KPI_DATA = [
  { label: 'Total RFPs',    value: '7,265', trend: '+11.01%', up: true,  colorClass: 'k1' },
  { label: 'Active RFPs',   value: '3,671', trend: '-0.03%',  up: false, colorClass: 'k2' },
  { label: 'Under Review',  value: '1,284', trend: '+8.2%',   up: true,  colorClass: 'k3' },
  { label: 'Submitted',     value: '156',   trend: '+15.03%', up: true,  colorClass: 'k4' },
  { label: 'Archived',      value: '812',   trend: '+4.1%',   up: true,  colorClass: 'k5' },
  { label: 'Win Rate',      value: '68.4%', trend: '+6.08%',  up: true,  colorClass: 'k6' },
];

// ── Top Clients ───────────────────────────────────────────────────
export const TOP_CLIENTS = [
  { name: 'Google',    pct: 88 },
  { name: 'YouTube',   pct: 72 },
  { name: 'Instagram', pct: 56 },
  { name: 'Aramco',    pct: 42 },
  { name: 'MOH',       pct: 28 },
];

// ── Upcoming Deadlines (right panel + deadlines tab) ──────────────
export const DEADLINES = [
  { name: 'RFP-Z — Ministry',   date: 'May 27, 2026', tabDate: 'May 27', days: '2d',  pill: 'pr' },
  { name: 'RFP-A — Google',     date: 'Jun 3, 2026',  tabDate: 'Jun 3',  days: '9d',  pill: 'pa' },
  { name: 'RFP-B — YouTube',    date: 'Jun 14, 2026', tabDate: 'Jun 14', days: '20d', pill: 'pb' },
  { name: 'RFP-C — Enterprise', date: 'Jul 1, 2026',  tabDate: 'Jul 1',  days: '37d', pill: 'pg' },
];

// ── Notifications ─────────────────────────────────────────────────
export const NOTIFICATIONS = [
  { text: 'RFP-Z deadline: 2 days left',  time: 'Just now',       dotColor: 'var(--red)' },
  { text: 'Urgent: Review RFP-A now',     time: '59 minutes ago', dotColor: 'var(--amber)' },
  { text: 'AI draft updated for RFP-B',   time: '12 hours ago',   dotColor: 'var(--accent)' },
];

// ── Bid/No-Bid Decisions ──────────────────────────────────────────
export const BID_DECISIONS = [
  {
    title: 'Ministry of Transport — IT Infra',
    subtitle: 'Government · SAR 18M+',
    decision: 'BID',
    rationale: [
      { icon: 'ti-shield-exclamation', iconBg: '#E24B4A20', iconColor: '#f87171', label: 'Key Risks',       text: 'Data residency + ISO 27001 compliance required' },
      { icon: 'ti-clock',              iconBg: '#EF9F2720', iconColor: '#fbbf24', label: 'Expected Effort', text: 'High — 6 months, 8 FTEs needed' },
      { icon: 'ti-users',              iconBg: '#4f46e520', iconColor: '#818cf8', label: 'Resources',       text: 'Team available, SAP expertise in-house' },
    ],
  },
  {
    title: 'Saudi Aramco — Cloud Migration',
    subtitle: 'Enterprise · SAR 32M',
    decision: 'BID',
    rationale: [
      { icon: 'ti-shield-exclamation', iconBg: '#E24B4A20', iconColor: '#f87171', label: 'Key Risks',       text: 'Complex multi-cloud architecture required' },
      { icon: 'ti-clock',              iconBg: '#EF9F2720', iconColor: '#fbbf24', label: 'Expected Effort', text: 'Very High — 12 months, 15 FTEs' },
      { icon: 'ti-users',              iconBg: '#4f46e520', iconColor: '#818cf8', label: 'Resources',       text: 'Cloud team available + Azure partnership' },
    ],
  },
  {
    title: 'MOH — Digital Health Platform',
    subtitle: 'Government · SAR 9M',
    decision: 'NO BID',
    rationale: [
      { icon: 'ti-shield-exclamation', iconBg: '#E24B4A20', iconColor: '#f87171', label: 'Key Risks',       text: 'HIPAA + PDPL compliance gap identified' },
      { icon: 'ti-clock',              iconBg: '#EF9F2720', iconColor: '#fbbf24', label: 'Expected Effort', text: 'High effort, low margin projected' },
      { icon: 'ti-users',              iconBg: '#4f46e520', iconColor: '#818cf8', label: 'Resources',       text: 'Health sector expertise not available' },
    ],
  },
];

// ── Chart.js shared grid/tick color helpers ───────────────────────
export const CHART_GRID  = 'rgba(255,255,255,0.05)';
export const CHART_TICKS = '#484f58';
