import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UploadRFPPage from './pages/UploadRFPPage.jsx';
import DetailPage    from './pages/DetailPage.jsx';
import Register from './pages/Register.jsx';
import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout.jsx';

// Wrap the app with AuthProvider to make authentication state available
// to all pages via `useAuth()`.
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
          {/* [ADDED] Layout wraps protected routes — AIChat floats on all pages */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* [ADDED] New routes> — protected by ProtectedRoute*/}
            <Route path="/upload-rfp" element={<UploadRFPPage />} />
            <Route path="/detail"     element={<DetailPage />} /> 
          </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
