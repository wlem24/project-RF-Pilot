import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  // While we validate token/profile, show a simple loading state
  if (loading) return <div>Loading...</div>;
  // If no user, redirect to login page
  if (!user) return <Navigate to="/login" replace />;
  // Otherwise render the protected content
  return children ? children : <Outlet />;
}
