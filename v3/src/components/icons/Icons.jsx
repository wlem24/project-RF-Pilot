// Central inline SVG icon library — Lucide-compatible paths, 24x24 viewBox.
// Props: size (default 20), color (default "currentColor"),
//        strokeWidth (default 1.5), className.
// No external dependency — pure inline SVG.

const base = (size, color, strokeWidth, className, children) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

// ── Document / Requirements ───────────────────────────────────────────────────

export function ClipboardIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </>);
}

export function FileTextIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <line x1="10" x2="8" y1="9" y2="9" />
  </>);
}

// ── Communication ─────────────────────────────────────────────────────────────

export function MessageSquareIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </>);
}

export function MailIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </>);
}

export function SendIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <line x1="22" x2="11" y1="2" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </>);
}

// ── Alerts / Status ───────────────────────────────────────────────────────────

export function BellIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </>);
}

export function AlertTriangleIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>);
}

export function CheckCircleIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </>);
}

export function XCircleIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </>);
}

export function CheckIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M20 6 9 17l-5-5" />
  </>);
}

// ── Time / Calendar ───────────────────────────────────────────────────────────

export function CalendarIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </>);
}

export function ClockIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </>);
}

// ── AI / Analysis ─────────────────────────────────────────────────────────────

export function SparklesIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </>);
}

export function BrainIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    <path d="M6 18a4 4 0 0 1-1.967-.516" />
    <path d="M19.967 17.484A4 4 0 0 1 18 18" />
  </>);
}

// ── Evaluation / Legal / Commercial ──────────────────────────────────────────

export function ScaleIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M2 20h20" />
    <path d="M12 2v18" />
    <path d="m6 9-4 11h8L6 9z" />
    <path d="m18 9-4 11h8L18 9z" />
    <path d="M6 9h12" />
  </>);
}

export function ShieldIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </>);
}

export function DollarSignIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </>);
}

// ── Users / Team ──────────────────────────────────────────────────────────────

export function UsersIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>);
}

export function UserPlusIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </>);
}

// ── Navigation / Actions ──────────────────────────────────────────────────────

export function UploadIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </>);
}

export function PlusIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="5" x2="19" y1="12" y2="12" />
  </>);
}

export function RefreshIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </>);
}

export function EditIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>);
}

export function TrashIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </>);
}

export function LogOutIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </>);
}

export function SearchIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" x2="16.65" y1="21" y2="16.65" />
  </>);
}

export function FilterIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </>);
}

export function ChevronDownIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <polyline points="6 9 12 15 18 9" />
  </>);
}

export function ArrowUpRightIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </>);
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export function StarIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </>);
}

export function BuildingIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <rect x="3" y="2" width="18" height="20" rx="2" />
    <path d="M9 22V12h6v10" />
    <path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" />
  </>);
}

export function FlagIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" x2="4" y1="22" y2="15" />
  </>);
}

export function InfoIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </>);
}

export function LockIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>);
}

export function TrendingUpIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </>);
}

export function BarChartIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <line x1="12" x2="12" y1="20" y2="10" />
    <line x1="18" x2="18" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="16" />
  </>);
}

export function PieChartIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </>);
}

export function GridIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </>);
}

export function SettingsIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className = '' }) {
  return base(size, color, strokeWidth, className, <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>);
}
