import React from 'react';
// [MODIFIED] Added NavLink for proper page navigation with active state
import { NavLink, useNavigate } from 'react-router-dom';
import { RiMagicLine } from 'react-icons/ri';
import { useAuth } from '../../auth/AuthProvider';

// [MODIFIED] Replaced NAV_ITEMS array with NAV_LINKS — added paths for navigation
export default function Navbar({ onGenerateDraft }) {
  const { user, logout } = useAuth();

  const NAV_LINKS = [
    { to: '/dashboard', label: 'Overview'   },
    { to: '/detail',    label: 'RFP Detail' },
    // Team page is visible to all authenticated users; invite controls are admin-gated inside
    { to: '/team',      label: 'Team'        },
  ];
  const navigate = useNavigate();

  return (
    <div className="topnav">
      <div className="logo">
        RFPilot<span className="logo-dot">.</span>
      </div>

      <div className="nav-links">
        {/* [MODIFIED] Replaced buttons with NavLink for real page navigation */}
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}

        {onGenerateDraft && (
          <button className="draft-btn" onClick={onGenerateDraft}>
            <RiMagicLine />
            Draft Workspace
          </button>
        )}

        {user && (
          // [MODIFIED] Show only initials instead of full username
          <div className="nav-user">Hi, {(user.name || user.username || '?').slice(0, 2).toUpperCase()}</div>
        )}
        <button
          className="signout"
          onClick={() => {
            logout();
            // [ADDED] Redirect to login after logout
            navigate('/login');
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}