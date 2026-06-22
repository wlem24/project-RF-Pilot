// src/components/common/index.jsx
// Shared UI primitives used everywhere in the app.

import { RiLoader4Line, RiErrorWarningLine, RiRefreshLine } from 'react-icons/ri';
import { ClipboardIcon } from '../icons/Icons.jsx';
import styles from './Common.module.css';

/* ── LoadingSpinner ────────────────────────── */
export function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className={styles.spinnerWrap}>
      <RiLoader4Line className={styles.spinnerIcon} />
      <p className={styles.spinnerText}>{message}</p>
    </div>
  );
}

/* ── ErrorMessage ──────────────────────────── */
export function ErrorMessage({ message, onRetry }) {
  return (
    <div className={styles.errorWrap}>
      <div className={styles.errorIcon}><RiErrorWarningLine /></div>
      <div>
        <p className={styles.errorTitle}>Error</p>
        <p className={styles.errorText}>{message}</p>
      </div>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry} style={{ fontSize: 12 }}>
          <RiRefreshLine /> Retry
        </button>
      )}
    </div>
  );
}

/* ── EmptyState ────────────────────────────── */
export function EmptyState({ icon, title, description, action, compact }) {
  return (
    <div className={`empty-state ${compact ? styles.compact : ''}`}>
      <div className="empty-icon">{icon || <ClipboardIcon size={40} color="#94A3B8" />}</div>
      <p className="empty-title">{title}</p>
      {description && <p className="empty-desc">{description}</p>}
      {action}
    </div>
  );
}

/* ── StatusBadge ───────────────────────────── */
const STATUS_CLASS = {
  draft:         'badge-neutral',
  under_review:  'badge-accent',
  in_progress:   'badge-in-progress',
  bid_decision:  'badge-warning',
  submitted:     'badge-blue',
  won:           'badge-success',
  lost:          'badge-danger',
  no_bid:        'badge-neutral',
  pending:       'badge-neutral',
  in_review:     'badge-blue',
  approved:      'badge-success',
  rejected:      'badge-danger',
  skipped:       'badge-neutral',
  low:           'badge-success',
  medium:        'badge-warning',
  high:          'badge-danger',
  critical:      'badge-danger',
};

export function StatusBadge({ status, label }) {
  const cls = STATUS_CLASS[status] || 'badge-neutral';
  const text = label || status?.replace(/_/g, ' ') || '—';
  return <span className={`badge ${cls}`} style={{ textTransform: 'capitalize' }}>{text}</span>;
}

/* ── InfoRow ───────────────────────────────── */
export function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value ?? <span style={{ color: '#9ca3af' }}>—</span>}</span>
    </div>
  );
}

/* ── ProgressBar ───────────────────────────── */
export function ProgressBar({ pct = 0, color }) {
  const fill = Math.min(100, Math.max(0, pct));
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${fill}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

/* ── ProgressRow (label + bar + pct) ──────── */
export function ProgressRow({ label, pct }) {
  return (
    <div className={styles.progressRow}>
      <div className={styles.progressRowHeader}>
        <span className={styles.progressLabel}>{label}</span>
        <span className={styles.progressPct} style={{ color: '#6366f1' }}>
          {pct != null ? `${pct}%` : '—'}
        </span>
      </div>
      <ProgressBar pct={pct || 0} />
    </div>
  );
}

/* ── DataTable ─────────────────────────────── */
export function DataTable({ columns, data, rowKey, emptyMessage }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHead}>
            {columns.map((c) => (
              <th key={c.key} className={styles.th} style={c.width ? { width: c.width } : {}}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>
                <EmptyState compact icon={<ClipboardIcon size={32} color="#94A3B8" />} title={emptyMessage || 'No data available'} />
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={rowKey(row)} className={styles.tr}>
                {columns.map((c) => (
                  <td key={c.key} className={styles.td}>{c.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
