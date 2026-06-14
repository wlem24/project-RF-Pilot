import { InfoRow, StatusBadge } from '../../common/index.jsx';

export default function OverviewTab({ rfp }) {
  // 🔌 API hook: rfp comes from GET /rfps/{id}
  const info = rfp?.information || {};

  return (
    <div className="card">
      <h2 className="card-title">RFP Overview Information</h2>
      <div className="accent-bar" />
      {/* All values from API — empty by default */}
      <InfoRow label="RFP ID"          value={info.rfpId} />
      <InfoRow label="Client"          value={info.client} />
      <InfoRow label="Department"      value={info.department} />
      <InfoRow label="Assigned To"     value={info.assignedTo} />
      <InfoRow label="Status"          value={rfp?.status ? <StatusBadge status={rfp.status} /> : null} />
      <InfoRow label="Estimated Value" value={info.estimatedValue} />
      <InfoRow label="Submission Due"  value={info.submissionDeadline} />
      <InfoRow label="Created"         value={info.createdAt} />
    </div>
  );
}
