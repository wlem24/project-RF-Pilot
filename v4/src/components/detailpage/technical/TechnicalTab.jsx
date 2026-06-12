import { useState } from 'react';
import { EmptyState, ProgressRow } from '../../common/index.jsx';
import styles from './TechnicalTab.module.css';

const TAGS = ['Technical', 'Legal', 'Commercial'];

// 🔌 API hook: evaluation criteria come from GET /rfps/{id}
// Each item: { id, criteria, weight }
function EvalCriteriaSection({ criteria }) {
  if (!criteria || criteria.length === 0) {
    return <EmptyState compact icon="⚖️" title="No evaluation criteria defined" />;
  }
  return (
    <div>
      {criteria.map((item) => (
        <ProgressRow key={item.id} label={item.criteria} pct={item.weight} />
      ))}
    </div>
  );
}

// 🔌 API hook: requirements come from GET /rfps/{id}/requirements?type=technical|legal|commercial
function RequirementsList({ requirements }) {
  if (!requirements || requirements.length === 0) {
    return <EmptyState compact icon="📋" title="No requirements extracted yet" description="Requirements will appear after AI analysis" />;
  }
  return (
    <div className={styles.reqList}>
      {requirements.map((req, i) => (
        <div key={i} className="req-row">
          <span className="req-bullet">›</span>
          {typeof req === 'string' ? req : req.text}
        </div>
      ))}
    </div>
  );
}

export default function TechnicalTab({ rfp }) {
  const [activeTag, setActiveTag] = useState('Technical');

  // 🔌 API hook: populated from rfp.technicalAnalysis / legalAnalysis / commercialAnalysis
  const getReqs = () => {
    if (!rfp) return [];
    if (activeTag === 'Technical') return rfp.technicalAnalysis?.requirements || [];
    if (activeTag === 'Legal')     return rfp.legalAnalysis?.complianceRequirements || [];
    if (activeTag === 'Commercial')return rfp.commercialAnalysis?.pricingObservations || [];
    return [];
  };

  return (
    <div className="space-y-4">
      {/* Key Requirements */}
      <div className="card">
        <h2 className="card-title">Key Requirements</h2>
        <div className="accent-bar" />

        {/* Tag selector */}
        <div className={styles.tagRow}>
          {TAGS.map((tag) => (
            <button
              key={tag}
              className={`tag ${activeTag === tag ? 'active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Requirements list */}
        <RequirementsList requirements={getReqs()} />
      </div>

      {/* Evaluation Criteria */}
      <div className="card">
        <h2 className="card-title">Evaluation Criteria</h2>
        <div className="accent-bar" />
        {/* 🔌 API hook: rfp.evaluationCriteria */}
        <EvalCriteriaSection criteria={rfp?.evaluationCriteria} />
      </div>
    </div>
  );
}
