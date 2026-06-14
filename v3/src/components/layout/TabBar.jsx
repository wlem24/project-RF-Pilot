import styles from './TabBar.module.css';

// Tab navigation bar for the RFP Detail page
// Switches between: Overview, Technical Analysis, Decision & Workflow, Collaboration

const TABS = [
  { id: 'overview',       label: 'Overview Info'        },
  { id: 'technical',      label: 'Technical Analysis'   },
  { id: 'decision',       label: 'Decision & Workflow'   },
  { id: 'collaboration',  label: 'Collaboration'         },
];

export default function TabBar({ activeTab, onChange }) {
  return (
    <div className={styles.tabbar}>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
