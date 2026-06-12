import { RiBellLine, RiCalendarEventLine } from 'react-icons/ri';
import { EmptyState } from '../common/index.jsx';
import styles from './RightSidebar.module.css';

function NotifItem({ n }) {
  return (
    <div className={styles.notifItem}>
      <div className={`${styles.notifDot} ${n.read ? styles.read : ''}`} />
      <div className={styles.notifBody}>
        <p className={`${styles.notifText} ${n.read ? styles.notifRead : ''}`}>{n.message}</p>
        <p className={styles.notifTime}>{n.createdAt}</p>
      </div>
    </div>
  );
}

function DeadlineItem({ d }) {
  const urgencyColor = d.urgency === 'urgent' ? '#ef4444' : d.urgency === 'soon' ? '#f59e0b' : '#e5e7eb';
  return (
    <div className={styles.deadlineItem} style={{ borderLeftColor: urgencyColor }}>
      <div className={styles.deadlineHeader}>
        <p className={styles.deadlineLabel}>{d.label}</p>
        {d.urgency !== 'normal' && (
          <span className={`badge ${d.urgency === 'urgent' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 10 }}>
            {d.urgency === 'soon' ? 'Soon' : 'Urgent'}
          </span>
        )}
      </div>
      <p className={styles.deadlineDate}>{d.date}</p>
    </div>
  );
}

export default function RightSidebar({ notifications = [], deadlines = [] }) {
  const unread = notifications.filter((n) => !n.read).length;

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
        {notifications.length === 0
          ? <EmptyState compact icon="🔔" title="No notifications yet" />
          : <div>{notifications.map((n) => <NotifItem key={n.id} n={n} />)}</div>
        }
      </div>

      {/* Deadlines */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>
          <RiCalendarEventLine style={{ marginRight: 4, verticalAlign: 'middle' }} />
          Upcoming Deadlines
        </p>
        {deadlines.length === 0
          ? <EmptyState compact icon="📅" title="No upcoming deadlines" />
          : <div className="space-y-3">{deadlines.map((d) => <DeadlineItem key={d.id} d={d} />)}</div>
        }
      </div>
    </aside>
  );
}
