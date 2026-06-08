import React, { useState } from 'react';

const NAV_ITEMS = ['Overview', 'Upload', 'RFP Detail', 'Team'];

export default function Navbar() {
  const [active, setActive] = useState('Overview');

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
        <button className="signout">Sign out</button>
      </div>
    </div>
  );
}
