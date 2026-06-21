import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login            from './pages/login.jsx';
import Dashboard        from './pages/Dashboard.jsx';
import UploadRFPPage    from './pages/UploadRFPPage.jsx';
import DetailPage       from './pages/DetailPage.jsx';
import Register         from './pages/Register.jsx';
import TeamPage         from './pages/TeamPage.jsx';
import AcceptInvitePage from './pages/AcceptInvitePage.jsx';
import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute   from './components/ProtectedRoute';
import Layout           from './components/layout/Layout.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/"              element={<Navigate to="/login" replace />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          {/* Public invite-acceptance page — no auth required */}
          <Route path="/accept-invite" element={<AcceptInvitePage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/upload-rfp" element={<UploadRFPPage />} />
              <Route path="/detail"     element={<DetailPage />} />
              <Route path="/team"       element={<TeamPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
