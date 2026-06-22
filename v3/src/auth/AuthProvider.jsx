import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginRequest, meRequest } from '../api/auth';
import { setAuthToken } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth from localStorage token (if present).
    // This enables persistent login across page reloads in development.
    const token = localStorage.getItem('token');
    if (token) {
      // Apply token to axios client so meRequest includes Authorization header
      setAuthToken(token);
      // fetch basic profile to validate token and populate `user`
      meRequest()
        .then((res) => setUser(res.data))
        .catch(() => {
          // Token invalid -> clear local state
          localStorage.removeItem('token');
          setAuthToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    // Call backend to obtain token and then fetch profile
    const data = await loginRequest(email, password);
    const profile = await meRequest();
    setUser(profile.data);
    return data;
  }

  function logout() {
    // Clear token and user state
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
