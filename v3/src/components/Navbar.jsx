import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const NAV_ITEMS = ['Overview', 'Upload', 'RFP Detail', 'Team'];

export default function Navbar() {
  const [active, setActive] = useState('Overview');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="topnav">
      <div className="logo">
        RFPilot<span className="logo-dot">.</span>
      </div>

      <div className="nav-links">
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            className={`nav-link${active === item ? ' active' : ''}`}
            onClick={() => setActive(item)}
          >
            {item}
          </button>
        ))}
        {user && (
          <div className="nav-user">Hi, {user.username}</div>
        )}
        <button
          className="signout"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
