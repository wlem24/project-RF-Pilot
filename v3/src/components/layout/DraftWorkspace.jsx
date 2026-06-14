// Expandable AI Draft Workspace — slides in from the right when Generate Draft is clicked.
import { useState } from 'react';
import { RiCloseLine, RiMagicLine, RiSendPlaneLine } from 'react-icons/ri';
import styles from './DraftWorkspace.module.css';

const DRAFT_TYPES = [
  'Executive Summary',
  'Technical Proposal',
  'Commercial Proposal',
  'Compliance Response',
  'Full Proposal',
];

export default function DraftWorkspace({ open, onClose, rfpId }) {
  const [draftType, setDraftType]     = useState(DRAFT_TYPES[0]);
  const [prompt, setPrompt]           = useState('');
  const [generatedContent, setGenerated] = useState('');
  const [generating, setGenerating]   = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated('');
    // 🔌 API hook: POST /rfps/{rfpId}/generate-draft { draftType, prompt }
    // const res = await rfpApi.generateDraft(rfpId, { draftType, prompt });
    // setGenerated(res.data.content);
    setTimeout(() => setGenerating(false), 1200); // UI simulation only
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Panel */}
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <RiMagicLine className={styles.panelIcon} />
            AI Draft Workspace
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <RiCloseLine style={{ fontSize: 18 }} />
          </button>
        </div>

        <div className={styles.panelBody}>
          {/* Draft Type Selector */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Draft Type</label>
            <select
              className="input"
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
            >
              {DRAFT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Prompt / Instructions */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Custom Instructions</label>
            <textarea
              className="input textarea"
              rows={4}
              placeholder="e.g. Focus on cloud migration experience and highlight ISO 27001 compliance…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Generate Button */}
          <button
            className="btn btn-primary btn-full"
            onClick={handleGenerate}
            disabled={generating}
            style={{ marginBottom: '1rem' }}
          >
            <RiSendPlaneLine />
            {generating ? 'Generating…' : 'Generate Draft'}
          </button>

          {/* Generated Content Area */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Generated Content</label>
            {generating ? (
              <div className={styles.generatingState}>
                <div className={styles.generatingDots}>
                  <span /><span /><span />
                </div>
                <p>AI is drafting your proposal…</p>
              </div>
            ) : (
              <textarea
                className="input textarea"
                rows={14}
                placeholder="AI-generated content will appear here after you click Generate Draft…"
                value={generatedContent}
                onChange={(e) => setGenerated(e.target.value)}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7 }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
