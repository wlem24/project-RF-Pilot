import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── RFP ──────────────────────────────────────────────────────────────────────
export const rfpApi = {
  /** List RFPs with optional server-side filters */
  list: (filters = {}) => {
    const p = new URLSearchParams();
    if (filters.status         && !['All Statuses', 'all'].includes(filters.status))
      p.set('status',         filters.status);
    if (filters.client         && !['All Clients', 'all'].includes(filters.client))
      p.set('client',         filters.client);
    if (filters.priority       && !['All Priorities', 'all'].includes(filters.priority))
      p.set('priority',       filters.priority);
    if (filters.owner          && !['All Owners', 'all'].includes(filters.owner))
      p.set('owner',          filters.owner);
    if (filters.deadline_range && !['Any Date', 'all'].includes(filters.deadline_range))
      p.set('deadline_range', filters.deadline_range);
    if (filters.has_decision != null)
      p.set('has_decision',   filters.has_decision);
    const qs = p.toString();
    return api.get(`/rfps/${qs ? '?' + qs : ''}`);
  },

  getById:          (id)          => api.get(`/rfps/${id}`),
  upload:           (form, title) => api.post(`/rfps/upload?title=${encodeURIComponent(title)}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStats:         ()            => api.get('/rfps/stats'),
  getPipelineValue: ()            => api.get('/rfps/pipeline-value'),
  getTopClients:    ()            => api.get('/rfps/top-clients'),
  getOwners:        ()            => api.get('/rfps/owners'),

  // Per-RFP sub-resources
  getRequirements:  (id, cat)    => api.get(`/rfps/${id}/requirements${cat ? '?category=' + cat : ''}`),
  getEvalCriteria:  (id)         => api.get(`/rfps/${id}/evaluation-criteria`),
  getWorkflow:      (id)         => api.get(`/rfps/${id}/workflow`),
  updateWorkflow:   (rfpId, stepId, payload) => api.patch(`/rfps/${rfpId}/workflow/${stepId}`, payload),
  getNotifications: (id)         => api.get(`/rfps/${id}/notifications`),
  getDeadlines:     (id)         => api.get(`/rfps/${id}/deadlines`),

  updateStatus:     (id, status)  => api.patch(`/rfps/${id}/status`, { status }),
  updateDecision:   (id, payload) => api.patch(`/rfps/${id}/decision`, payload),
  chat:             (rfpId, prompt, sessionId) => api.post('/rfps/chat', { rfp_id: rfpId, session_id: sessionId, question: prompt, top_k: 5 }),
  getDrafts:        (id)          => api.get(`/rfps/${id}/drafts`),
  getCompletion:    (id)          => api.get(`/rfps/${id}/completion`),
  reprocess:        (id)          => api.post(`/rfps/${id}/reprocess`),
  generateDraft:    (id, payload) => api.post(`/rfps/${id}/generate-draft`, payload),
  updateApproval:   (rfpId, stepId, status) => api.patch(`/rfps/${rfpId}/workflow/${stepId}`, { status }),
  exportPdf:        (id)         => api.get(`/rfps/${id}/export-pdf`, { responseType: 'blob' }),
};

// ── Comments ──────────────────────────────────────────────────────────────────
export const commentApi = {
  list:   (rfpId)                    => api.get(`/rfps/${rfpId}/comments`),
  create: (rfpId, message, parentId) => api.post(`/rfps/${rfpId}/comments`, { message, parent_id: parentId || null }),
  delete: (rfpId, commentId)         => api.delete(`/rfps/${rfpId}/comments/${commentId}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifApi = {
  list:        () => api.get('/notifications/'),
  markRead:    (id) => api.post(`/notifications/${id}/read`),
  markAllRead: ()   => api.post('/notifications/read-all'),
};

// ── Invitations ───────────────────────────────────────────────────────────────
export const invitationApi = {
  list:    ()                       => api.get('/invitations/'),
  create:  (email, role)            => api.post('/invitations/', { email, role }),
  revoke:  (id)                     => api.delete(`/invitations/${id}`),
  resend:  (id)                     => api.post(`/invitations/${id}/resend`),
  preview: (token)                  => api.get(`/invitations/${token}/preview`),
  accept:  (token, name, password)  => api.post(`/invitations/${token}/accept`, { name, password }),
};

// ── Team ──────────────────────────────────────────────────────────────────────
export const teamApi = {
  listMembers: ()               => api.get('/team/members'),
  updateRole:  (id, role)       => api.patch(`/team/members/${id}/role`, { role }),
  removeMember:(id)             => api.delete(`/team/members/${id}`),
};

// ── Deadlines ─────────────────────────────────────────────────────────────────
export const deadlineApi = {
  list: () => api.get('/deadlines/'),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getAnalytics: (filters = {}) => {
    const p = new URLSearchParams();
    if (filters.status         && !['All Statuses', 'all'].includes(filters.status))
      p.set('status',         filters.status);
    if (filters.client         && !['All Clients', 'all'].includes(filters.client))
      p.set('client',         filters.client);
    if (filters.priority       && !['All Priorities', 'all'].includes(filters.priority))
      p.set('priority',       filters.priority);
    if (filters.owner          && !['All Owners', 'all'].includes(filters.owner))
      p.set('owner',          filters.owner);
    if (filters.deadline_range && !['Any Date', 'all'].includes(filters.deadline_range))
      p.set('deadline_range', filters.deadline_range);
    const qs = p.toString();
    return api.get(`/dashboard/analytics${qs ? '?' + qs : ''}`);
  },
};

export default api;
