import { useEffect, useRef, useState } from 'react';
import { RiBellLine, RiCalendarEventLine } from 'react-icons/ri';
import { EmptyState } from '../common/index.jsx';
import { BellIcon, CalendarIcon } from '../icons/Icons.jsx';
import { rfpApi }     from '../../services/api.js';
import styles from './RightSidebar.module.css';

const POLL_MS = 60000; // 60 s fallback — SSE handles real-time updates

function relTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotifItem({ n }) {
  const dotColor = { comment: '#818cf8', approval: '#1D9E75', status_change: '#EF9F27', system: '#484f58' }[n.type] || '#484f58';
  return (
    <div className={styles.notifItem}>
      <div className={styles.notifDot} style={{ background: dotColor, opacity: n.isRead ? 0.35 : 1 }} />
      <div className={styles.notifBody}>
        <p className={`${styles.notifText} ${n.isRead ? styles.notifRead : ''}`}>{n.message}</p>
        <p className={styles.notifTime}>{relTime(n.createdAt)}</p>
      </div>
    </div>
  );
}

function DeadlineItem({ d }) {
  const urgencyColor = d.urgency === 'urgent' ? '#ef4444' : '#e5e7eb';
  return (
    <div className={styles.deadlineItem} style={{ borderLeftColor: urgencyColor }}>
      <div className={styles.deadlineHeader}>
        <p className={styles.deadlineLabel}>{d.title}</p>
        {d.urgency === 'urgent' && (
          <span className="badge badge-danger" style={{ fontSize: 10 }}>Urgent</span>
        )}
      </div>
      <p className={styles.deadlineDate}>{d.dueDate || '—'}</p>
    </div>
  );
}

export default function RightSidebar({ rfpId }) {
  const [notifData,    setNotifData]    = useState({ unread: 0, items: [] });
  const [deadlines,    setDeadlines]    = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [dlLoading,    setDlLoading]    = useState(true);
  const pollRef = useRef(null);

  async function fetchAll() {
    if (!rfpId) return;
    try {
      const [nr, dr] = await Promise.all([
        rfpApi.getNotifications(rfpId),
        rfpApi.getDeadlines(rfpId),
      ]);
      setNotifData(nr.data || { unread: 0, items: [] });
      setDeadlines(dr.data || []);
    } catch (_) {
      // swallow — sidebar errors shouldn't break the page
    } finally {
      setNotifLoading(false);
      setDlLoading(false);
    }
  }

  useEffect(() => {
    setNotifLoading(true);
    setDlLoading(true);
    fetchAll();
    pollRef.current = setInterval(fetchAll, POLL_MS);

    // Also refresh immediately on SSE push events
    const handler = () => fetchAll();
    window.addEventListener('rfpilot:notification', handler);

    return () => {
      clearInterval(pollRef.current);
      window.removeEventListener('rfpilot:notification', handler);
    };
  }, [rfpId]);

  const notifications = notifData.items || [];
  const unread        = notifData.unread || 0;

  return (
    <aside className={styles.sidebar}>

      {/* Notifications */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>
            <RiBellLine style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Notifications
          </p>
          {unread > 0 && <span className="badge badge-accent">{unread}</span>}
        </div>

        {notifLoading ? (
          <div className="skeleton" style={{ height: 48, borderRadius: 8 }} />
        ) : notifications.length === 0 ? (
          <EmptyState compact icon={<BellIcon size={32} color="#94A3B8" />} title="No notifications yet" />
        ) : (
          <div>{notifications.slice(0, 8).map(n => <NotifItem key={n.id} n={n} />)}</div>
        )}
      </div>

      {/* Deadlines */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>
          <RiCalendarEventLine style={{ marginRight: 4, verticalAlign: 'middle' }} />
          Upcoming Deadlines
        </p>

        {dlLoading ? (
          <div className="skeleton" style={{ height: 48, borderRadius: 8 }} />
        ) : deadlines.length === 0 ? (
          <EmptyState compact icon={<CalendarIcon size={32} color="#94A3B8" />} title="No upcoming deadlines" />
        ) : (
          <div className="space-y-3">
            {deadlines.map(d => <DeadlineItem key={d.id} d={d} />)}
          </div>
        )}
      </div>

    </aside>
  );
}
