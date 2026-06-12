import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiUpload2Line, RiFileLine, RiCheckLine, RiCloseLine, RiBrainLine } from 'react-icons/ri';
// [MODIFIED] Fixed import casing — was TopNavBar, correct filename is TopNavbar
import TopNavbar      from '../components/layout/TopNavbar.jsx';
import DraftWorkspace from '../components/layout/DraftWorkspace.jsx';
import RightSidebar   from '../components/sidebar/RightSidebar.jsx';
import styles from '../styles/UploadRFPPage.module.css';

export default function UploadRFPPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [file,       setFile]       = useState(null);
  const [notes,      setNotes]      = useState('');
  const [dragging,   setDragging]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState(null);
  // [ADDED] draftOpen state — controls DraftWorkspace visibility
  const [draftOpen,  setDraftOpen]  = useState(false);

  // 🔌 API hook: aiSummary from GET /rfps/{id}/ai-summary after upload
  const aiSummary     = '';
  const notifications = [];
  const deadlines     = [];

  const handleFileChange = (f) => { if (f) setFile(f); };

  const handleProceed = async () => {
    if (!file) { setError('Please select an RFP file.'); return; }
    setError(null);
    setUploading(true);
    // 🔌 API hook: POST /rfps/upload
    // const form = new FormData();
    // form.append('file', file);
    // form.append('notes', notes);
    // const res = await rfpApi.upload(form);
    // navigate(`/detail?id=${res.data.rfpId}`);
    setTimeout(() => { setUploading(false); navigate('/detail'); }, 800);
  };

  return (
    <div className={styles.page}>
      {/* [MODIFIED] Passing onGenerateDraft — adds Draft Workspace button to the navbar */}
      <TopNavbar onGenerateDraft={() => setDraftOpen(true)} />

      <div className={styles.body}>
        <main className={styles.main}>
          <div className={styles.content}>

            {/* ── Upload Card ── */}
            <div className="card">
              <h2 className="card-title">Upload RFP</h2>
              <div className="accent-bar" />

              <div className={styles.uploadRow}>
                <div className={styles.uploadBtnBlock}>
                  <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => inputRef.current?.click()}>
                    <RiUpload2Line /> Upload
                  </button>
                  <p className={styles.uploadLbl}>RFP Document</p>
                </div>
                <div
                  className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileChange(e.dataTransfer.files[0]); }}
                  onClick={() => inputRef.current?.click()}
                >
                  <RiFileLine className={styles.dropzoneIcon} />
                  <span>{file ? file.name : 'Drag & drop RFP file, or click to upload'}</span>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx,.doc"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
              </div>

              {file && (
                <div className={styles.filePreview}>
                  <RiFileLine className={styles.fileIcon} />
                  <div className={styles.fileInfo}>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div className={styles.fileCheck}><RiCheckLine /></div>
                  <button className="btn btn-ghost btn-icon" onClick={() => setFile(null)}>
                    <RiCloseLine />
                  </button>
                </div>
              )}
            </div>

            {/* ── Notes ── */}
            <div className="card">
              <label className={styles.fieldLabel}>Add Notes / Description for the RFP</label>
              <textarea
                className="input textarea"
                rows={5}
                placeholder="Add any context, business notes, or special instructions about this RFP…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* ── AI Summary ── */}
            <div className="card">
              <div className={styles.aiHeader}>
                <RiBrainLine className={styles.aiIcon} />
                <div>
                  <h2 className="card-title" style={{ marginBottom: 0 }}>RFP Summary</h2>
                  <p className={styles.aiSub}>(Extracted by AI)</p>
                </div>
              </div>
              <div className="accent-bar" />
              {aiSummary ? (
                <textarea
                  className="input textarea"
                  rows={5}
                  readOnly
                  value={aiSummary}
                  style={{ background: '#fafafa', color: '#6b7280' }}
                />
              ) : (
                <div className={styles.aiPlaceholder}>
                  <RiBrainLine className={styles.aiPlaceholderIcon} />
                  <p>AI summary will appear here after upload</p>
                  <p className={styles.aiPlaceholderSub}>Upload a document to generate an AI-powered summary</p>
                </div>
              )}
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={handleProceed}
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading…' : 'Proceed to Overview Info →'}
            </button>

          </div>
        </main>

        <RightSidebar notifications={notifications} deadlines={deadlines} />
      </div>

      {/* [ADDED] AI Draft Workspace — opened by the Draft Workspace button in the navbar */}
      <DraftWorkspace open={draftOpen} onClose={() => setDraftOpen(false)} />
    </div>
  );
}
