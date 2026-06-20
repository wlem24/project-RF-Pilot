// ============================================================
// All HTTP calls live here. Replace BASE_URL with your backend.
// ============================================================
import axios from 'axios';

// 🔌 Set your backend URL in .env as VITE_API_BASE_URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 🔌 Add auth token interceptor here
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── RFP ──────────────────────────────────────
export const rfpApi = {
  getById:       (id)    => api.get(`/rfps/${id}`),
  upload:        (form, title) => api.post(`/rfps/upload?title=${encodeURIComponent(title)}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  chat:          (rfpId, prompt, sessionId) => api.post('/rfps/chat', { rfp_id: rfpId, session_id: sessionId, question: prompt, top_k: 5 }),
  triggerAnalysis: (id)  => api.post(`/rfps/${id}/analyze`),
  generateDraft: (id, payload) => api.post(`/rfps/${id}/generate-draft`, payload),
  updateApproval:(rfpId, stepId, status) => api.patch(`/rfps/${rfpId}/approval/${stepId}`, { status }),
  exportPdf:     (id)    => api.get(`/rfps/${id}/export-pdf`, { responseType: 'blob' }),
};

// ── Comments ─────────────────────────────────
export const commentApi = {
  list:   (rfpId)               => api.get(`/rfps/${rfpId}/comments`),
  create: (rfpId, message)      => api.post(`/rfps/${rfpId}/comments`, { message }),
  delete: (rfpId, commentId)    => api.delete(`/rfps/${rfpId}/comments/${commentId}`),
};

// ── Notifications ─────────────────────────────
// Stubbed: GET /notifications has no backend route yet. Resolve empty
// instead of hitting a guaranteed 404 on every protected page load.
export const notifApi = {
  list:       ()    => Promise.resolve({ data: [] }),
  markRead:   (id)  => api.post(`/notifications/${id}/read`),
  markAllRead: ()   => api.post('/notifications/read-all'),
};

// ── Deadlines ─────────────────────────────────
export const deadlineApi = {
  list: () => api.get('/deadlines'),
};

export default api;
