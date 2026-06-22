import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiUpload2Line, RiFileLine, RiCheckLine, RiCloseLine, RiBrainLine } from 'react-icons/ri';
import TopNavBar      from '../components/layout/TopNavbar.jsx';
import DraftWorkspace from '../components/layout/DraftWorkspace.jsx';
import RightSidebar   from '../components/sidebar/RightSidebar.jsx';
import { rfpApi } from '../services/api.js';
import styles from '../styles/UploadRFPPage.module.css';

export default function UploadRFPPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [file,             setFile]             = useState(null);
  const [notes,            setNotes]            = useState('');
  const [estimatedValue,   setEstimatedValue]   = useState('');
  const [dragging,         setDragging]         = useState(false);
  const [uploading,        setUploading]        = useState(false);
  const [error,            setError]            = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [summary,          setSummary]          = useState('');
  const [uploadedId,       setUploadedId]       = useState(null);
  const [draftOpen,        setDraftOpen]        = useState(false);

  const notifications = [];
  const deadlines     = [];

  function validateFile(f) {
    const errs = [];
    if (!f.name.toLowerCase().endsWith('.pdf'))
      errs.push('Only PDF files are accepted.');
    if (f.size === 0)
      errs.push('File appears to be empty.');
    if (f.size > 50 * 1024 * 1024)
      errs.push(`File is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum: 50 MB.`);
    return errs;
  }

  const handleFileChange = async (f) => {
    if (!f) return;
    const errs = validateFile(f);
    if (errs.length > 0) {
      setValidationErrors(errs);
      setFile(null);
      return;
    }
    setValidationErrors([]);
    setFile(f);
    setError(null);
    setSummary('');
    setUploadedId(null);
    setUploading(true);

    try {
      const form = new FormData();
      form.append('file', f);
      if (estimatedValue) form.append('estimated_value', estimatedValue);
      const response = await rfpApi.upload(form, f.name);
      const { rfp_id, summary: aiSummary } = response.data;
      localStorage.setItem('rfpilot_active_rfp', JSON.stringify({ id: rfp_id, filename: f.name }));
      setSummary(aiSummary || '');
      setUploadedId(rfp_id);
    } catch (uploadError) {
      console.error(uploadError);
      const detail = uploadError.response?.data?.detail;
      if (uploadError.response?.status === 422 || uploadError.response?.status === 413)
        setError(typeof detail === 'string' ? detail : 'File rejected by server. Check file type and size.');
      else
        setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProceed = () => {
    if (uploadedId) navigate(`/detail?id=${uploadedId}`);
  };

  return (
    <div className={styles.page}>
      <TopNavBar onGenerateDraft={() => setDraftOpen(true)} />

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

              {validationErrors.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {validationErrors.map((e, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <RiCloseLine style={{ flexShrink: 0 }} /> {e}
                    </div>
                  ))}
                </div>
              )}

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

            {/* ── Estimated Value ── */}
            <div className="card">
              <label className={styles.fieldLabel}>Estimated Contract Value <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>(optional)</span></label>
              <input
                className="input"
                type="number"
                min="0"
                step="1000"
                placeholder="e.g. 500000"
                value={estimatedValue}
                onChange={e => setEstimatedValue(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>Enter the estimated value in SAR/USD — used in the Pipeline Value chart on the dashboard.</p>
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
              {summary ? (
                <textarea
                  className="input textarea"
                  rows={5}
                  readOnly
                  value={summary}
                  style={{ background: '#fafafa', color: '#6b7280' }}
                />
              ) : (
                <div className={styles.aiPlaceholder}>
                  <RiBrainLine className={styles.aiPlaceholderIcon} />
                  <p>AI summary will appear here after upload</p>
                  <p className={styles.aiPlaceholderSub}>Upload a PDF document to generate an AI-powered summary</p>
                </div>
              )}
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={handleProceed}
              disabled={!uploadedId || uploading}
            >
              {uploading ? 'Analyzing RFP…' : 'Proceed to Overview Info →'}
            </button>

          </div>
        </main>

        <RightSidebar notifications={notifications} deadlines={deadlines} />
      </div>

      {/* AI Draft Workspace */}
      <DraftWorkspace open={draftOpen} onClose={() => setDraftOpen(false)} />
    </div>
  );
}
