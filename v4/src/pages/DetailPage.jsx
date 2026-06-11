import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
// [MODIFIED] Replaced TopNavBar with Navbar — uses useAuth and logout from v3
import TopNavbar from '../components/layout/TopNavbar.jsx';
import TabBar from '../components/layout/TabBar.jsx';
import DraftWorkspace from '../components/layout/DraftWorkspace.jsx';
import RightSidebar from '../components/sidebar/RightSidebar.jsx';
import OverviewTab from '../components/detailpage/overview/OverviewTab.jsx';
import TechnicalTab from '../components/detailpage/technical/TechnicalTab.jsx';
import DecisionTab from '../components/detailpage/decision/DecisionTab.jsx';
import CollaborationTab from '../components/detailpage/collaboration/CollaborationTab.jsx';
import { LoadingSpinner, ErrorMessage } from '../components/common/index.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { rfpApi, notifApi } from '../services/api.js';

import styles from '../styles/DetailPage.module.css';

export default function DetailPage() {
  const [params]   = useSearchParams();
  const rfpId      = params.get('id') || undefined;
  const [tab, setTab]             = useState('overview');
  // [ADDED] draftOpen state — controls DraftWorkspace visibility
  const [draftOpen, setDraftOpen] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────
  // 🔌 API hook: GET /rfps/{rfpId} — fetches full RFP detail
  const rfpState = useAsync(
    () => rfpId ? rfpApi.getById(rfpId).then((r) => r.data) : Promise.resolve(null),
    [rfpId]
  );

  // 🔌 API hook: GET /notifications
  const notifState = useAsync(() => notifApi.list().then((r) => r.data || []), []);

  // 🔌 API hook: GET /deadlines
  // const deadlineState = useAsync(() => deadlineApi.list().then((r) => r.data || []), []);

  const rfp           = rfpState.data;
  const notifications = notifState.data || [];
  const deadlines     = []; // 🔌 Replace with deadlineState.data

  const handleUpdateApproval = useCallback(async (stepId, status) => {
    if (!rfpId) return;
    // 🔌 API hook: PATCH /rfps/{rfpId}/approval/{stepId}
    await rfpApi.updateApprovalStep(rfpId, stepId, status);
    rfpState.refetch();
  }, [rfpId, rfpState]);

  return (
    <div className={styles.page}>
      {/* Navigation */}
      <TopNavbar
        rfpId={rfp?.id || rfpId || 'RFP Detail'}
        onGenerateDraft={() => setDraftOpen(true)}
      />
      <TabBar activeTab={tab} onChange={setTab} />

      {/* Main body */}
      <div className={styles.body}>
        <main className={styles.main}>
          <div className={styles.content}>

            {/* Global states */}
            {rfpState.loading && <LoadingSpinner message="Loading RFP details…" />}
            {rfpState.error   && (
              <ErrorMessage message={rfpState.error} onRetry={rfpState.refetch} />
            )}

            {/* Tab content — shown even without rfp (empty states inside) */}
            {!rfpState.loading && !rfpState.error && (
              <>
                {tab === 'overview'      && <OverviewTab rfp={rfp} />}
                {tab === 'technical'     && <TechnicalTab rfp={rfp} />}
                {tab === 'decision'      && (
                  <DecisionTab rfp={rfp} onUpdateApproval={handleUpdateApproval} />
                )}
                {tab === 'collaboration' && (
                  <CollaborationTab
                    rfpId={rfpId}
                    comments={rfp?.comments || []}
                    // 🔌 API hook: onPostComment → POST /rfps/{rfpId}/comments
                  />
                )}
              </>
            )}
          </div>
        </main>

        {/* Right sidebar */}
        <RightSidebar notifications={notifications} deadlines={deadlines} />
      </div>

      {/* AI Draft Workspace */}
      <DraftWorkspace open={draftOpen} onClose={() => setDraftOpen(false)} rfpId={rfpId} />
      {/* [REMOVED] AIFab — AIChat is now handled globally by Layout.jsx */}

    </div>
  );
}