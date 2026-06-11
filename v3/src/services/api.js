// ============================================================
// All HTTP calls live here. Replace BASE_URL with your backend.
// ============================================================
import axios from 'axios';

// 🔌 Set your backend URL in .env as VITE_API_BASE_URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 🔌 Add auth token interceptor here
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rfpilot_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── RFP ──────────────────────────────────────
export const rfpApi = {
  getById:       (id)    => api.get(`/rfps/${id}`),
  upload:        (form)  => api.post('/rfps/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
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
export const notifApi = {
  list:       ()    => api.get('/notifications'),
  markRead:   (id)  => api.post(`/notifications/${id}/read`),
  markAllRead: ()   => api.post('/notifications/read-all'),
};

// ── Deadlines ─────────────────────────────────
export const deadlineApi = {
  list: () => api.get('/deadlines'),
};

export default api;
