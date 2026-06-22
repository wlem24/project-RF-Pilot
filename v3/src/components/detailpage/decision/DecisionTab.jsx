import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Check, X, GitBranch, BarChart3, Award } from 'lucide-react';
import { ProgressBar } from '../../ui/primitives';
import { rfpApi }     from '../../../services/api.js';

// ── Decision Hero ──────────────────────────────────────────────────────────────

function DecisionHero({ decision, onDecide, saving }) {
  const config = {
    BID:     { bg: '#F0FDF4', border: '#BBF7D0', color: '#059669', label: 'Bid'              },
    'NO BID':{ bg: '#FFF1F2', border: '#FECDD3', color: '#DC2626', label: 'No bid'           },
    PENDING: { bg: '#F8F9FB', border: '#E5E7EB', color: '#9CA3AF', label: 'Awaiting decision' },
  };
  const c = config[decision] || config.PENDING;

  return (
    <div style={{ background: c.bg, border: `0.5px solid ${c.border}`, borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', margin: '0 0 4px' }}>
          Your decision
        </p>
        <p style={{ fontSize: 28, fontWeight: 500, color: c.color, margin: '0 0 4px' }}>{c.label}</p>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
          {decision === 'PENDING' ? 'Set your bid decision below' : 'Click to change'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          disabled={saving}
          onClick={() => onDecide('BID')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: saving ? 'wait' : 'pointer', transition: 'all 0.15s',
            background: decision === 'BID' ? '#059669' : '#F0FDF4',
            border: `0.5px solid ${decision === 'BID' ? '#059669' : '#BBF7D0'}`,
            color:  decision === 'BID' ? '#fff' : '#059669',
          }}
        >
          <Check size={14} aria-hidden="true" />
          Bid
        </button>
        <button
          disabled={saving}
          onClick={() => onDecide('NO BID')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            cursor: saving ? 'wait' : 'pointer', transition: 'all 0.15s',
            background: decision === 'NO BID' ? '#DC2626' : '#FFF1F2',
            border: `0.5px solid ${decision === 'NO BID' ? '#DC2626' : '#FECDD3'}`,
            color:  decision === 'NO BID' ? '#fff' : '#DC2626',
          }}
        >
          <X size={14} aria-hidden="true" />
          No bid
        </button>
      </div>
    </div>
  );
}

// ── Analysis Score Card ────────────────────────────────────────────────────────

function AnalysisCard({ label, score }) {
  const hasScore = score !== null && score !== undefined;
  return (
    <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, color: '#111827', margin: '0 0 10px' }}>
        {hasScore ? `${Math.round(score)}%` : '—'}
      </p>
      <ProgressBar value={hasScore ? score : 0} height={4} />
    </div>
  );
}

// ── Flag List ──────────────────────────────────────────────────────────────────

function FlagList({ flags, icon, title, color, bg, border, emptyText }) {
  return (
    <div style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {icon}
        <span style={{ fontSize: 14, fontWeight: 500, color }}>{title}</span>
      </div>
      {(!flags || flags.length === 0) ? (
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{emptyText}</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
          {flags.map((f, i) => (
            <li key={i} style={{ fontSize: 13, color, marginBottom: 4, display: 'flex', gap: 6 }}>
              <span style={{ opacity: 0.6 }}>›</span>
              {typeof f === 'string' ? f : JSON.stringify(f)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Editable Textarea Field ────────────────────────────────────────────────────

function SaveableField({ label, value, placeholder, onChange, onSave }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: 6 }}>
        {label}
      </label>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onBlur={onSave}
        style={{ width: '100%', minHeight: 72, border: '0.5px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: '#111827', boxSizing: 'border-box' }}
      />
    </div>
  );
}

// ── Approval Pipeline ──────────────────────────────────────────────────────────

const STATUS_STYLE = {
  approved:    { bg: '#F0FDF4', border: '#BBF7D0', color: '#059669', label: 'Approved'    },
  completed:   { bg: '#F0FDF4', border: '#BBF7D0', color: '#059669', label: 'Completed'   },
  in_review:   { bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB', label: 'In Review'   },
  in_progress: { bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB', label: 'In Progress' },
  rejected:    { bg: '#FFF1F2', border: '#FECDD3', color: '#DC2626', label: 'Rejected'    },
  skipped:     { bg: '#F3F4F6', border: '#E5E7EB', color: '#6B7280', label: 'Skipped'     },
  pending:     { bg: '#F8F9FB', border: '#E5E7EB', color: '#9CA3AF', label: 'Pending'     },
};

const FALLBACK_STEPS = [
  { id: 's1', stage: 'Initial Review',        status: 'pending', step_order: 1 },
  { id: 's2', stage: 'Technical Assessment',  status: 'pending', step_order: 2 },
  { id: 's3', stage: 'Commercial Evaluation', status: 'pending', step_order: 3 },
  { id: 's4', stage: 'Management Approval',   status: 'pending', step_order: 4 },
];

function ApprovalPipeline({ steps = [], onUpdateStep }) {
  const [updating, setUpdating] = useState(null);
  const display = steps.length > 0 ? steps : FALLBACK_STEPS;

  async function advance(step) {
    if (!onUpdateStep) return;
    const next = step.status === 'pending' ? 'in_review' : step.status === 'in_review' ? 'approved' : null;
    if (!next) return;
    setUpdating(step.id);
    try { await onUpdateStep(step.id, next); }
    finally { setUpdating(null); }
  }

  return (
    <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <GitBranch size={15} color="#6366F1" aria-hidden="true" />
        Approval pipeline
      </h3>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {display.map((step, i) => {
          const ss     = STATUS_STYLE[step.status] || STATUS_STYLE.pending;
          const done   = step.status === 'approved' || step.status === 'completed';
          const canAdv = onUpdateStep && (step.status === 'pending' || step.status === 'in_review');
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', flex: i < display.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 88 }}>
                <div
                  onClick={canAdv ? () => advance(step) : undefined}
                  title={canAdv ? 'Click to advance' : undefined}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: ss.bg, border: `0.5px solid ${ss.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 500, color: ss.color,
                    cursor: canAdv ? 'pointer' : 'default',
                    opacity: updating === step.id ? 0.4 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {done ? <Check size={14} /> : i + 1}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#374151', margin: 0 }}>{step.stage}</p>
                  <span style={{ display: 'inline-flex', marginTop: 4, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500, background: ss.bg, color: ss.color, border: `0.5px solid ${ss.border}` }}>
                    {ss.label}
                  </span>
                </div>
              </div>
              {i < display.length - 1 && (
                <div style={{ flex: 1, height: 1, borderTop: '1px dashed #E5E7EB', margin: '16px 4px 0' }} />
              )}
            </div>
          );
        })}
      </div>
      {onUpdateStep && display.some(s => s.status === 'pending' || s.status === 'in_review') && (
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>Click a step circle to advance its status</p>
      )}
    </div>
  );
}

const ALL_DRAFT_SECTIONS = [
  { key: 'executive_summary', label: 'Executive Summary'  },
  { key: 'technical',         label: 'Technical Proposal' },
  { key: 'commercial',        label: 'Commercial Proposal'},
  { key: 'compliance',        label: 'Compliance Response'},
  { key: 'full',              label: 'Full Proposal'      },
];

// ── Main ───────────────────────────────────────────────────────────────────────

export default function DecisionTab({ rfp, rfpId, onDecision, onUpdateApproval, onStatusChange }) {
  const bid = rfp?.bidDecision || {};

  // Decision state (persisted to DB)
  const [decision, setDecision] = useState('PENDING');
  const [saving, setSaving]     = useState(false);

  // Outcome state (won / lost / null)
  const [savingOutcome, setSavingOutcome] = useState(false);

  // Editable form fields (auto-saved on blur)
  const [resources,   setResources]   = useState('');
  const [risks,       setRisks]       = useState('');
  const [budget,      setBudget]      = useState('');

  // Completion tracker (7-dimension live data)
  const [completionData, setCompletionData] = useState(null);

  // Initialise from backend data
  useEffect(() => {
    if (bid.recommendation) {
      const map = { bid: 'BID', no_bid: 'NO BID', conditional_bid: 'BID' };
      setDecision(map[bid.recommendation] || 'PENDING');
    }
    setResources(bid.requiredResources || '');
    setRisks    (bid.expectedRisks     || '');
    setBudget   (bid.budgetEstimate    || '');
  }, [rfp?.id, bid.recommendation, bid.requiredResources, bid.expectedRisks, bid.budgetEstimate]);

  // Fetch completion data whenever rfpId or rfp changes (re-runs after actions)
  useEffect(() => {
    if (!rfpId) return;
    rfpApi.getCompletion(rfpId)
      .then(r => setCompletionData(r.data))
      .catch(() => {});
  }, [rfpId, rfp?.status, decision]);

  async function handleDecision(value) {
    setDecision(value);
    if (!rfpId) return;
    setSaving(true);
    try { await onDecision?.(value); }
    finally { setSaving(false); }
  }

  const saveField = useCallback(async (field, value) => {
    if (!rfpId) return;
    try { await rfpApi.updateDecision(rfpId, { [field]: value }); }
    catch (_) { /* swallow — non-critical autosave */ }
  }, [rfpId]);

  async function handleOutcome(newStatus) {
    if (!rfpId || !onStatusChange || savingOutcome) return;
    // Toggle: clicking the active outcome resets to 'submitted'
    const target = rfp?.status === newStatus ? 'submitted' : newStatus;
    setSavingOutcome(true);
    try { await onStatusChange(target); }
    finally { setSavingOutcome(false); }
  }

  // Analysis cards — all from AI-generated scores
  const analysisCards = [
    { label: 'Technical match',    score: bid.technicalFit        ?? null },
    { label: 'Commercial match',   score: bid.commercialFit       ?? null },
    { label: 'Resource readiness', score: bid.resourceReadiness   ?? null },
    { label: 'Strategic alignment',score: bid.strategicAlignment  ?? null },
    { label: 'Win probability',    score: bid.winProbability      ?? null },
    { label: 'Risk level',         score: bid.riskLevel           ?? null },
  ];

  const hasAnyScore = analysisCards.some(c => c.score !== null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero — user decision */}
      <DecisionHero decision={decision} onDecide={handleDecision} saving={saving} />

      {/* AI analysis scores */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 8 }}>
          AI analysis scores
          {!hasAnyScore && (
            <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 8 }}>
              — populated after upload processing
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {analysisCards.map(c => <AnalysisCard key={c.label} {...c} />)}
        </div>
      </div>

      {/* Flags */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FlagList
          flags={bid.positiveFlags}
          icon={<CheckCircle size={16} color="#10B981" aria-hidden="true" />}
          title="Green flags"
          color="#065F46"
          bg="#F0FDF4"
          border="#BBF7D0"
          emptyText="No positive flags identified"
        />
        <FlagList
          flags={bid.riskFlags}
          icon={<AlertTriangle size={16} color="#EF4444" aria-hidden="true" />}
          title="Red flags"
          color="#9F1239"
          bg="#FFF1F2"
          border="#FECDD3"
          emptyText="No risk flags identified"
        />
      </div>

      {/* Editable form */}
      <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 16px' }}>Decision notes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <SaveableField
            label="Required resources"
            value={resources}
            placeholder="Key resources needed for this bid…"
            onChange={setResources}
            onSave={() => saveField('required_resources', resources)}
          />
          <SaveableField
            label="Expected risks"
            value={risks}
            placeholder="Main risks and mitigation…"
            onChange={setRisks}
            onSave={() => saveField('expected_risks', risks)}
          />
          <SaveableField
            label="Budget estimate"
            value={budget}
            placeholder="Rough cost range for this project…"
            onChange={setBudget}
            onSave={() => saveField('budget_estimate', budget)}
          />
        </div>
      </div>

      {/* Approval pipeline */}
      <ApprovalPipeline
        steps={rfp?.approvalPipeline || []}
        onUpdateStep={onUpdateApproval}
      />

      {/* RFP Outcome — only when a bid was made */}
      {(decision === 'BID' || rfp?.status === 'won' || rfp?.status === 'lost' || rfp?.status === 'submitted') && (
        <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={14} color="#6366F1" aria-hidden="true" />
            RFP Outcome
          </h3>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 14px' }}>
            Was this RFP awarded to your organisation? This updates the Win Rate on the dashboard.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Won */}
            <button
              onClick={() => handleOutcome('won')}
              disabled={savingOutcome}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: savingOutcome ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
                background: rfp?.status === 'won' ? '#059669' : '#F0FDF4',
                border: `0.5px solid ${rfp?.status === 'won' ? '#059669' : '#BBF7D0'}`,
                color:  rfp?.status === 'won' ? '#fff' : '#059669',
              }}
            >
              <CheckCircle size={14} aria-hidden="true" />
              {rfp?.status === 'won' ? 'Awarded (Won)' : 'Mark as Won'}
            </button>
            {/* Lost */}
            <button
              onClick={() => handleOutcome('lost')}
              disabled={savingOutcome}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: savingOutcome ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
                background: rfp?.status === 'lost' ? '#DC2626' : '#FFF1F2',
                border: `0.5px solid ${rfp?.status === 'lost' ? '#DC2626' : '#FECDD3'}`,
                color:  rfp?.status === 'lost' ? '#fff' : '#DC2626',
              }}
            >
              <X size={14} aria-hidden="true" />
              {rfp?.status === 'lost' ? 'Not Awarded (Lost)' : 'Mark as Lost'}
            </button>
          </div>
          {(rfp?.status === 'won' || rfp?.status === 'lost') && (
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10, textAlign: 'center' }}>
              Click the active button again to reset outcome to Submitted
            </p>
          )}
        </div>
      )}

      {/* Overall Completion Tracker — 7 live DB signals */}
      <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={14} color="#6366F1" aria-hidden="true" />
          Overall Completion
        </h3>

        {!completionData ? (
          <div className="skeleton" style={{ height: 48, borderRadius: 8 }} />
        ) : (
          <>
            {/* Progress bar — color changes at thresholds */}
            {(() => {
              const pct  = completionData.overall_completion;
              const barColor = pct === 100 ? '#22C55E' : pct >= 60 ? '#6366F1' : pct >= 30 ? '#F59E0B' : '#EF4444';
              const done = completionData.sections.filter(s => s.completed).length;
              const total = completionData.sections.length;
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {pct === 100 ? 'All sections complete — ready to submit' : `${done} of ${total} sections complete`}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: barColor }}>{pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>
                </>
              );
            })()}

            {/* Section rows */}
            {completionData.sections.map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '0.5px solid #F3F4F6' }}>
                {s.completed
                  ? <Check size={14} color="#059669" aria-label="done" />
                  : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #D1D5DB' }} />
                }
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: s.completed ? '#111827' : '#9CA3AF' }}>{s.label}</span>
                  <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 8 }}>{s.detail}</span>
                </div>
                <span style={{ fontSize: 10, color: '#9CA3AF', minWidth: 30, textAlign: 'right' }}>{s.weight}%</span>
              </div>
            ))}

            {/* Draft documents sub-row */}
            {completionData.draft_count > 0 && (
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 8, paddingTop: 8, borderTop: '0.5px solid #F3F4F6' }}>
                {completionData.draft_count} draft section{completionData.draft_count !== 1 ? 's' : ''} generated via AI Draft Workspace
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
