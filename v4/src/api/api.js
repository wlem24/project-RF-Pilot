import axios from 'axios';

// Base API client for the React app.
// Use VITE_API_BASE_URL when provided, otherwise default to localhost:8000.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to set/remove the Authorization header for all requests
export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}

export default api;
