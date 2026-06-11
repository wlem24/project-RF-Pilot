import { useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts';
import { RiCheckLine, RiAlertLine } from 'react-icons/ri';
import { EmptyState, ProgressRow, StatusBadge } from '../../common/index.jsx';
import ConfidenceGauge from './ConfidenceGauge.jsx';
import styles from './DecisionTab.module.css';

// ── Empty radar data shape ─────────────────────────────────────
const EMPTY_RADAR = [
  { subject: 'Technical Fit',       score: 0, fullMark: 100 },
  { subject: 'Resource Avail.',     score: 0, fullMark: 100 },
  { subject: 'Profitability',       score: 0, fullMark: 100 },
  { subject: 'Strategic Alignment', score: 0, fullMark: 100 },
  { subject: 'Risk',                score: 0, fullMark: 100 },
];

// ── Decision Badge (BID / NO-BID) ─────────────────────────────
function DecisionBadge({ decision }) {
  if (!decision) {
    return (
      <div className={styles.badgeEmpty}>
        <span className={styles.badgeEmptyText}>—</span>
        <p className={styles.badgeEmptyLabel}>Awaiting Analysis</p>
      </div>
    );
  }
  const isBid = decision === 'bid' || decision === 'BID';
  return (
    <div className={`${styles.decisionBadge} ${isBid ? styles.bid : styles.noBid}`}>
      <div className={styles.decisionPulse} />
      <div className={styles.decisionInner}>
        <div className={styles.decisionLiveDot} />
        <span className={styles.decisionText}>{isBid ? 'BID' : 'NO-BID'}</span>
        <p className={styles.decisionSub}>Recommendation</p>
      </div>
    </div>
  );
}

// ── Time & Effort Card ─────────────────────────────────────────
function TimeEffortCard({ data }) {
  // 🔌 API hook: data from GET /rfps/{id}/decision
  const items = [
    { label: 'Estimated Time',  value: data?.estimatedTime  || null, unit: 'weeks' },
    { label: 'Estimated Effort',value: data?.estimatedEffort|| null, unit: 'person-months' },
    { label: 'Resource Demand', value: data?.resourceDemand || null, unit: '' },
  ];
  return (
    <div className={styles.timeCard}>
      <p className={styles.timeCardTitle}>Time & Effort</p>
      <div className={styles.timeCardGrid}>
        {items.map(({ label, value, unit }) => (
          <div key={label} className={styles.timeItem}>
            <p className={styles.timeLabel}>{label}</p>
            <p className={styles.timeValue}>
              {value != null ? `${value} ${unit}` : <span style={{ color: '#d1d5db' }}>—</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Flags card ─────────────────────────────────────────────────
function FlagsCard({ title, flags, type }) {
  const isGreen = type === 'green';
  return (
    <div className={`${styles.flagsCard} ${isGreen ? styles.flagsGreen : styles.flagsRed}`}>
      <div className={styles.flagsHeader}>
        <div className={`${styles.flagsIconWrap} ${isGreen ? styles.flagsIconGreen : styles.flagsIconRed}`}>
          {isGreen ? '✅' : '🚩'}
        </div>
        <p className={`${styles.flagsTitle} ${isGreen ? styles.flagsTitleGreen : styles.flagsTitleRed}`}>
          {title}
        </p>
      </div>
      {(!flags || flags.length === 0) ? (
        <p className={styles.flagsEmpty}>
          {isGreen ? 'No positive flags identified' : 'No risk flags identified'}
        </p>
      ) : (
        <ul className={styles.flagsList}>
          {flags.map((f, i) => (
            <li key={i} className={styles.flagItem}>
              <span className={isGreen ? styles.flagBulletGreen : styles.flagBulletRed}>
                {isGreen ? '›' : '!'}
              </span>
              {typeof f === 'string' ? f : f.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Approval Step ──────────────────────────────────────────────
function ApprovalStep({ step, index, onUpdate }) {
  const statusStyle = {
    won:       { bg: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669' },
    approved:  { bg: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669' },
    in_review: { bg: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.25)', color: '#2563eb' },
    pending:   { bg: '#f3f4f6', border: '1px solid #e5e7eb', color: '#9ca3af' },
    draft:     { bg: '#f3f4f6', border: '1px solid #e5e7eb', color: '#d1d5db' },
    rejected:  { bg: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626' },
  };
  const ss = statusStyle[step.status] || statusStyle.draft;
  const dotStyle = step.status === 'won' || step.status === 'approved'
    ? { background: '#10b981', color: '#fff' }
    : step.status === 'in_review'
    ? { background: '#6366f1', color: '#fff' }
    : { background: '#f3f4f6', color: '#9ca3af' };

  const labels = { won: '✓ Won', approved: '✓ Won', in_review: '● In Progress', pending: '○ Draft', draft: '○ Draft', rejected: '✕ Rejected' };

  return (
    <div className={styles.approvalStep}>
      <div className={styles.stepDot} style={dotStyle}>
        {step.status === 'won' || step.status === 'approved' ? '✓' : index + 1}
      </div>
      <div className={styles.stepInfo}>
        <p className={styles.stepName}>{step.stage}</p>
        {step.assignee && <p className={styles.stepAssignee}>{step.assignee}</p>}
        {step.completedAt && <p className={styles.stepDate}>Completed: {step.completedAt}</p>}
      </div>
      <span className={styles.stepBadge} style={{ background: ss.bg, border: ss.border, color: ss.color }}>
        {labels[step.status] || step.status}
      </span>
    </div>
  );
}

// ── Main Decision Tab ──────────────────────────────────────────
export default function DecisionTab({ rfp, onUpdateApproval }) {
  const [bidChoice, setBidChoice] = useState(null);

  // 🔌 API hook: all values from GET /rfps/{id}
  const bid       = rfp?.bidDecision || {};
  const risks     = rfp?.risks || [];
  const resources = rfp?.resources || [];
  const pipeline  = rfp?.approvalPipeline || [];
  const draftProg = rfp?.draftProgress || [];
  const budget    = bid.budgetEstimate || {};

  const overallPct = draftProg.length > 0
    ? Math.round(draftProg.reduce((a, d) => a + d.pct, 0) / draftProg.length)
    : 0;

  const radarData = (bid.alignmentMatrix?.length > 0)
    ? bid.alignmentMatrix
    : EMPTY_RADAR;

  return (
    <div className={styles.root}>

      {/* ══════════════════════════════════════
          SECTION 1: EXECUTIVE DECISION SUMMARY
          ══════════════════════════════════════ */}
      <div className={`${styles.execSection}`}>

        {/* 3-column hero */}
        <div className={styles.heroGrid}>
          {/* Decision Badge */}
          <div className={styles.heroCell}>
            <p className={styles.heroCellLabel}>AI Recommendation</p>
            {/* 🔌 API hook: bid.recommendation */}
            <DecisionBadge decision={bid.recommendation || null} />
          </div>

          {/* Confidence Gauge */}
          <div className={styles.heroCell}>
            <p className={styles.heroCellLabel}>Confidence Score</p>
            {/* 🔌 API hook: bid.confidenceLevel */}
            <ConfidenceGauge score={bid.confidenceLevel ?? null} />
          </div>

          {/* Time & Effort */}
          <div className={styles.heroCell}>
            <p className={styles.heroCellLabel}>Time & Effort</p>
            <TimeEffortCard data={bid.timeEffort} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          SECTION 2: FULL DECISION ANALYSIS
          ══════════════════════════════════════ */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionLabel}>Full Decision Analysis</h3>
        <p className={styles.sectionSub}>Why the AI made this recommendation</p>
      </div>

      <div className="grid-2" style={{ marginBottom: '1rem' }}>
        {/* Radar Chart */}
        <div className="card">
          <h2 className="card-title">Alignment Matrix</h2>
          <div className="accent-bar" />
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fill: '#d1d5db', fontSize: 9 }} tickCount={5} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
              />
              <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.18} strokeWidth={2}
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Analysis */}
        <div className="card">
          <h2 className="card-title">Progress Analysis</h2>
          <div className="accent-bar" />
          {/* 🔌 API hook: bid.progressAnalysis */}
          {[
            { label: 'Technical Match',      key: 'technicalMatch'     },
            { label: 'Commercial Match',     key: 'commercialMatch'    },
            { label: 'Resource Readiness',   key: 'resourceReadiness'  },
            { label: 'Strategic Alignment',  key: 'strategicAlignment' },
            { label: 'Win Probability',      key: 'winProbability'     },
          ].map(({ label, key }) => (
            <ProgressRow key={key} label={label} pct={bid.progressAnalysis?.[key] ?? null} />
          ))}
        </div>
      </div>

      {/* Evidence & Insights */}
      <div className="grid-2" style={{ marginBottom: '1rem' }}>
        <FlagsCard title="Green Flags" flags={bid.positiveFlags} type="green" />
        <FlagsCard title="Red Flags"   flags={bid.riskFlags}     type="red"   />
      </div>

      {/* AI Summary Card */}
      <div className={`card ${styles.aiSummaryCard}`} style={{ marginBottom: '1rem' }}>
        <div className={styles.aiSummaryHeader}>
          <span className={styles.aiSummaryIcon}>🤖</span>
          <h2 className="card-title" style={{ marginBottom: 0 }}>AI Recommendation Summary</h2>
        </div>
        <div className="accent-bar" />
        {bid.summary ? (
          <p className={styles.aiSummaryText}>{bid.summary}</p>
        ) : (
          <EmptyState compact icon="🧠" title="AI summary not yet generated" description="Summary will appear after bid analysis is complete" />
        )}
      </div>

      {/* ══════════════════════════════════════
          SECTION 3: BID/NO-BID + INFO CARDS
          ══════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 className="card-title">Bid / No-Bid Decision</h2>
        <div className="accent-bar" />

        {/* Toggle */}
        <div className={styles.bidToggle}>
          <button
            className={`${styles.bidBtn} ${bidChoice === 'bid' ? styles.bidActive : ''}`}
            onClick={() => setBidChoice('bid')}
          >
            <RiCheckLine /> BID
          </button>
          <button
            className={`${styles.bidBtn} ${bidChoice === 'nobid' ? styles.nobidActive : ''}`}
            onClick={() => setBidChoice('nobid')}
          >
            ✕ NO BID
          </button>
        </div>

        {/* 3 info cards */}
        <div className="grid-3">
          {/* Required Resources */}
          <div className={styles.infoCard}>
            <p className={styles.infoCardLabel}>Required Resources</p>
            {(bid.requiredResources?.length > 0) ? (
              <ul className={styles.infoList}>
                {bid.requiredResources.map((r, i) => (
                  <li key={i} className={styles.infoListItem}><span style={{ color: '#6366f1' }}>›</span> {r}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.infoEmpty}>No resources assigned</p>
            )}
            <div className={styles.infoRule} />
          </div>

          {/* Expected Risks */}
          <div className={styles.infoCard}>
            <p className={styles.infoCardLabel}>Expected Risks</p>
            {risks.length === 0 ? (
              <p className={styles.infoEmpty}>No risks identified</p>
            ) : (
              <table className={styles.riskTable}>
                <thead><tr><th>Risk</th><th>Severity</th></tr></thead>
                <tbody>
                  {risks.map((r) => (
                    <tr key={r.id}>
                      <td>{r.risk}</td>
                      <td className={`${r.severity === 'high' || r.severity === 'critical' ? styles.sevHigh : r.severity === 'medium' ? styles.sevMed : styles.sevLow}`}>
                        {r.severity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className={styles.infoRule} />
          </div>

          {/* Budget Estimate */}
          <div className={`${styles.infoCard} ${budget.total ? styles.infoCardHighlight : ''}`}>
            <p className={styles.infoCardLabel}>Budget Estimate</p>
            {budget.total ? (
              <>
                <div className={styles.budgetGrid}>
                  {[
                    ['Professional', budget.professionalFees],
                    ['Infrastructure', budget.infrastructure],
                    ['Licensing', budget.licensing],
                    ['Contingency', budget.contingency],
                  ].map(([label, val]) => (
                    <div key={label} className={styles.budgetRow}>
                      <span>{label}</span><span>{val || '—'}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.budgetTotal}>
                  <span>Total</span>
                  <span style={{ color: '#6366f1', fontWeight: 700 }}>{budget.total}</span>
                </div>
              </>
            ) : (
              <p className={styles.infoEmpty}>Initial cost projection for project resources...</p>
            )}
            <div className={styles.infoRule} />
          </div>
        </div>
      </div>

      {/* Approval Pipeline */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 className="card-title">Approval Pipeline</h2>
        <div className="accent-bar" />
        {pipeline.length === 0
          ? <EmptyState compact icon="🔄" title="No approval pipeline configured" />
          : <div>{pipeline.map((step, i) => (
              <ApprovalStep key={step.id} step={step} index={i} onUpdate={(s) => onUpdateApproval(step.id, s)} />
            ))}</div>
        }
      </div>

      {/* Drafting Progress */}
      <div className="card">
        <h2 className="card-title">Drafting Progress Tracker</h2>
        <div className="accent-bar" />
        <div className="flex-between mb-4" style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Overall completion</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#6366f1' }}>{overallPct}%</span>
        </div>
        <div className="progress-track" style={{ height: 6, marginBottom: '1.25rem' }}>
          <div className="progress-fill" style={{ width: `${overallPct}%`, height: 6 }} />
        </div>
        {draftProg.length === 0
          ? <EmptyState compact icon="📝" title="No draft sections yet" />
          : <div className="space-y-3">
              {draftProg.map((d) => <ProgressRow key={d.section} label={d.section} pct={d.pct} />)}
            </div>
        }
      </div>
    </div>
  );
}
