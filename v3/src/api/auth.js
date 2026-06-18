import api, { setAuthToken } from './api';

// Perform login against the backend. Stores token in localStorage and sets
// the Authorization header for subsequent requests.
export async function loginRequest(email, password) {
  const res = await api.post('/auth/login', { email, password });
  const token = res.data.access_token;
  if (token) {
    localStorage.setItem('token', token); //to not be an two separate axios clients:
                                              // Before const token = localStorage.getItem('rfpilot_token');
                                              // After const token = localStorage.getItem('token');

    setAuthToken(token);
  }
  return res.data;
}

// Register a new user. Returns the server response (201 on success).
export async function registerRequest(name, email, password, role) {
  return api.post('/auth/register', { name, email, password, role });
}

// Get current user's profile from the server using the stored token.
export async function meRequest() {
  return api.get('/auth/me');
}
