import { InfoRow, StatusBadge, EmptyState } from '../../common/index.jsx';

// AI-extracted fields are usually plain strings, but the model can sometimes
// nest an object (e.g. importantDates: {questionsDue, preBidMeeting}) or an
// array. Flatten any shape down to a safe, readable string so React never
// gets handed a raw object as a child.
function formatValue(value) {
  if (value == null || value === '') return null;
  if (Array.isArray(value)) {
    const parts = value.map(formatValue).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }
  if (typeof value === 'object') {
    const parts = Object.entries(value)
      .map(([k, v]) => {
        const formatted = formatValue(v);
        return formatted ? `${k}: ${formatted}` : null;
      })
      .filter(Boolean);
    return parts.length ? parts.join('; ') : null;
  }
  return String(value);
}

// Narrative fields (paragraphs/lists) extracted from the RFP — rendered as
// labeled text blocks rather than single-line InfoRows.
function TextBlock({ label, value }) {
  const formatted = formatValue(value);
  if (!formatted) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {formatted}
      </p>
    </div>
  );
}

export default function OverviewTab({ rfp }) {
  // 🔌 API hook: rfp.information comes from GET /rfps/{id}, extracted once
  // during upload (same OpenAI call that produces the summary).
  const info = rfp?.information || {};
  const hasAnyInfo = Object.values(info).some((v) => formatValue(v) != null);

  return (
    <div className="card">
      <h2 className="card-title">RFP Overview Information</h2>
      <div className="accent-bar" />

      {!hasAnyInfo ? (
        <EmptyState
          compact
          icon="🧠"
          title="Overview not yet available"
          description="Structured RFP details will appear here once AI processing completes."
        />
      ) : (
        <>
          <InfoRow label="RFP Title"             value={formatValue(info.title)} />
          <InfoRow label="Organization / Issuer" value={formatValue(info.organization)} />
          <InfoRow label="Submission Deadline"   value={formatValue(info.submissionDeadline)} />
          <InfoRow label="Status"                value={rfp?.status ? <StatusBadge status={rfp.status} /> : null} />

          <TextBlock label="Project Overview"           value={info.projectOverview} />
          <TextBlock label="Scope of Work"              value={info.scopeOfWork} />
          <TextBlock label="Important Dates"            value={info.importantDates} />
          <TextBlock label="Requirements Summary"       value={info.requirementsSummary} />
          <TextBlock label="Evaluation Criteria"        value={info.evaluationCriteria} />
          <TextBlock label="Key Deliverables"           value={info.keyDeliverables} />
          <TextBlock label="Risks / Special Conditions" value={info.risks} />
        </>
      )}
    </div>
  );
}
