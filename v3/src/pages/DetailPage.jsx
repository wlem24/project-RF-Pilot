import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopNavbar        from '../components/layout/TopNavbar.jsx';
import TabBar           from '../components/layout/TabBar.jsx';
import DraftWorkspace   from '../components/layout/DraftWorkspace.jsx';
import RightSidebar     from '../components/sidebar/RightSidebar.jsx';
import OverviewTab      from '../components/detailpage/overview/OverviewTab.jsx';
import TechnicalTab     from '../components/detailpage/technical/TechnicalTab.jsx';
import DecisionTab      from '../components/detailpage/decision/DecisionTab.jsx';
import CollaborationTab from '../components/detailpage/collaboration/CollaborationTab.jsx';
import { LoadingSpinner, ErrorMessage } from '../components/common/index.jsx';
import { useAsync }     from '../hooks/useAsync.js';
import { rfpApi }       from '../services/api.js';
import styles from '../styles/DetailPage.module.css';

const POLL_INTERVAL = 4000;

export default function DetailPage() {
  const [params]     = useSearchParams();
  const rfpId        = params.get('id') || undefined;
  const [tab, setTab]             = useState('overview');
  const [draftOpen, setDraftOpen] = useState(false);
  const pollRef = useRef(null);

  const rfpState = useAsync(
    () => rfpId ? rfpApi.getById(rfpId).then(r => r.data) : Promise.resolve(null),
    [rfpId]
  );
  const rfp = rfpState.data;

  // Auto-poll while processing
  useEffect(() => {
    if (rfp?.status === 'processing') {
      pollRef.current = setInterval(() => rfpState.refetch(), POLL_INTERVAL);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [rfp?.status]);

  // Sync active RFP for AI Chat
  useEffect(() => {
    if (rfp?.id) {
      localStorage.setItem('rfpilot_active_rfp', JSON.stringify({ id: rfp.id, filename: rfp.title }));
    }
  }, [rfp?.id, rfp?.title]);

  const handleDecision = useCallback(async (decision) => {
    if (!rfpId) return;
    await rfpApi.updateDecision(rfpId, { decision });
    rfpState.refetch();
  }, [rfpId]);

  const handleUpdateApproval = useCallback(async (stepId, status) => {
    if (!rfpId) return;
    await rfpApi.updateWorkflow(rfpId, stepId, { status });
    rfpState.refetch();
  }, [rfpId]);

  const handleStatusChange = useCallback(async (status) => {
    if (!rfpId) return;
    await rfpApi.updateStatus(rfpId, status);
    rfpState.refetch();
  }, [rfpId]);

  return (
    <div className={styles.page}>
      <TopNavbar
        rfpId={rfp?.id || rfpId || 'RFP Detail'}
        onGenerateDraft={() => setDraftOpen(true)}
      />
      <TabBar activeTab={tab} onChange={setTab} />

      <div className={styles.body}>
        <main className={styles.main}>
          <div className={styles.content}>
            {rfpState.loading && !rfp && <LoadingSpinner message="Loading RFP details…" />}
            {rfpState.error   && <ErrorMessage message={rfpState.error} onRetry={rfpState.refetch} />}

            {!rfpState.error && (
              <>
                {rfp?.status === 'processing' && (
                  <div style={{
                    background: '#fef9c3', border: '1px solid #fde68a',
                    borderRadius: 8, padding: '10px 16px', marginBottom: 12,
                    fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }} />
                    AI is processing this RFP… All tabs will update automatically.
                  </div>
                )}

                {tab === 'overview'      && <OverviewTab rfp={rfp} onStatusChange={handleStatusChange} />}
                {tab === 'technical'     && <TechnicalTab rfp={rfp} />}
                {tab === 'decision'      && (
                  <DecisionTab
                    rfp={rfp}
                    rfpId={rfpId}
                    onDecision={handleDecision}
                    onUpdateApproval={handleUpdateApproval}
                    onStatusChange={handleStatusChange}
                  />
                )}
                {tab === 'collaboration' && <CollaborationTab rfpId={rfpId} />}
              </>
            )}
          </div>
        </main>

        {/* RightSidebar fetches per-RFP data internally and polls */}
        <RightSidebar rfpId={rfpId} />
      </div>

      <DraftWorkspace open={draftOpen} onClose={() => setDraftOpen(false)} rfpId={rfpId} />
    </div>
  );
}
