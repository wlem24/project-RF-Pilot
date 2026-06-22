import { useState } from 'react';
import { EmptyState } from '../../common/index.jsx';
import { useAsync }   from '../../../hooks/useAsync.js';
import { rfpApi }     from '../../../services/api.js';
import styles from './TechnicalTab.module.css';
import { RefreshCw } from 'lucide-react';
import { ClipboardIcon, ScaleIcon } from '../../icons/Icons.jsx';

const CATEGORIES = ['Technical', 'Legal', 'Commercial'];
const CAT_MAP    = { Technical: 'technical', Legal: 'legal', Commercial: 'commercial' };

function SkeletonList() {
  return (
    <div className={styles.reqList}>
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{ height: 14, width: `${60 + i * 10}%`, marginBottom: 10, borderRadius: 4 }} />
      ))}
    </div>
  );
}

function RequirementsList({ items, loading, rfpStatus }) {
  if (loading) return <SkeletonList />;
  if (!items || items.length === 0) {
    const isProcessing = rfpStatus === 'processing';
    return (
      <EmptyState
        compact
        icon={<ClipboardIcon size={40} color="#94A3B8" />}
        title={isProcessing ? 'Extracting requirements…' : 'No requirements found in this category'}
        description={isProcessing ? 'Requirements will appear once AI analysis completes.' : 'Upload a richer RFP document to extract category-specific requirements.'}
      />
    );
  }
  return (
    <div className={styles.reqList}>
      {items.map(req => (
        <div key={req.id} className="req-row">
          <span className="req-bullet">›</span>
          {req.text}
          {req.isMandatory === false && (
            <span style={{ marginLeft: 6, fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>(optional)</span>
          )}
        </div>
      ))}
    </div>
  );
}

function EvalCriteriaSection({ items, loading, rfpStatus }) {
  if (loading) return <SkeletonList />;
  if (!items || items.length === 0) {
    const isProcessing = rfpStatus === 'processing';
    return (
      <EmptyState
        compact
        icon={<ScaleIcon size={40} color="#94A3B8" />}
        title={isProcessing ? 'Extracting evaluation criteria…' : 'No evaluation criteria found'}
        description={isProcessing ? 'Criteria will appear once AI analysis completes.' : 'No scoring rubric was detected in this document.'}
      />
    );
  }
  return (
    <div>
      {items.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{item.criteria}</div>
            {item.notes && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{item.notes}</div>}
          </div>
          {item.weight != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16, minWidth: 120 }}>
              <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(item.weight, 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', minWidth: 36 }}>{item.weight}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TechnicalTab({ rfp }) {
  const [activeCategory, setActiveCategory] = useState('Technical');
  const [reprocessing, setReprocessing]     = useState(false);
  const [reprocessMsg, setReprocessMsg]     = useState(null);
  const rfpId     = rfp?.id;
  const rfpStatus = rfp?.status;

  // Requirements: refetch when category changes
  const reqState = useAsync(
    () => rfpId
      ? rfpApi.getRequirements(rfpId, CAT_MAP[activeCategory]).then(r => r.data || [])
      : Promise.resolve([]),
    [rfpId, activeCategory]
  );

  // Evaluation criteria: fetch once per RFP
  const criteriaState = useAsync(
    () => rfpId
      ? rfpApi.getEvalCriteria(rfpId).then(r => r.data || [])
      : Promise.resolve([]),
    [rfpId]
  );

  async function handleReprocess() {
    if (!rfpId || reprocessing) return;
    setReprocessing(true);
    setReprocessMsg(null);
    try {
      const res = await rfpApi.reprocess(rfpId);
      const d   = res.data;
      setReprocessMsg(
        `Re-analysis complete: ${d.requirements_saved} requirements ` +
        `(tech ${d.categories?.technical ?? 0} / legal ${d.categories?.legal ?? 0} / ` +
        `commercial ${d.categories?.commercial ?? 0}), ${d.criteria_saved} criteria saved.`
      );
      reqState.refetch();
      criteriaState.refetch();
    } catch (err) {
      setReprocessMsg(err?.response?.data?.detail || 'Re-analysis failed.');
    } finally {
      setReprocessing(false);
    }
  }

  return (
    <div className="space-y-4">

      {/* Key Requirements */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="card-title">Key Requirements</h2>
          <button
            onClick={handleReprocess}
            disabled={reprocessing}
            title="Re-run AI extraction on this RFP"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, padding: '4px 10px', borderRadius: 6,
              border: '0.5px solid var(--border)', background: 'var(--bg-card)',
              color: 'var(--text-2)', cursor: reprocessing ? 'wait' : 'pointer',
              opacity: reprocessing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={12} style={{ animation: reprocessing ? 'spin 1s linear infinite' : 'none' }} />
            {reprocessing ? 'Re-analysing…' : 'Re-analyse'}
          </button>
        </div>
        {reprocessMsg && (
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{reprocessMsg}</p>
        )}
        <div className="accent-bar" />

        <div className={styles.tagRow}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`tag ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <RequirementsList
          items={reqState.data}
          loading={reqState.loading}
          rfpStatus={rfpStatus}
        />

        {reqState.error && (
          <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>
            Failed to load requirements.{' '}
            <button onClick={reqState.refetch} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Evaluation Criteria */}
      <div className="card">
        <h2 className="card-title">Evaluation Criteria</h2>
        <div className="accent-bar" />

        <EvalCriteriaSection
          items={criteriaState.data}
          loading={criteriaState.loading}
          rfpStatus={rfpStatus}
        />

        {criteriaState.error && (
          <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>
            Failed to load criteria.{' '}
            <button onClick={criteriaState.refetch} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
              Retry
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
