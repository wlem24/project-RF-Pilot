import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
// [ADDED] RiMagicLine icon for the Draft Workspace button
import { RiMagicLine } from 'react-icons/ri';
import { useAuth } from '../../auth/AuthProvider';

const NAV_LINKS = [
  { to: '/dashboard',  label: 'Overview'   },
  { to: '/upload-rfp', label: 'Upload RFP' },
  { to: '/detail',     label: 'RFP Detail' },
];

// [MODIFIED] Added onGenerateDraft prop — when passed, shows the Draft Workspace
// button in the navbar (used by UploadRFPPage and DetailPage)
export default function Navbar({ onGenerateDraft }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="topnav">
      <div className="logo">
        RFPilot<span className="logo-dot">.</span>
      </div>

      <div className="nav-links">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}

        {/* [ADDED] Draft Workspace button — only rendered on pages that pass onGenerateDraft */}
        {onGenerateDraft && (
          <button className="draft-btn" onClick={onGenerateDraft}>
            <RiMagicLine />
            Draft Workspace
          </button>
        )}

        {user && (
          <div className="nav-user">Hi, {user.username?.slice(0, 2).toUpperCase()}</div>
        )}
        <button
          className="signout"
          onClick={() => { logout(); navigate('/login'); }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
