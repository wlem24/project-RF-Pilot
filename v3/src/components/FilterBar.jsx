import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_LABELS, FILTER_OPTIONS } from '../data/constants.js';

// ── Individual filter dropdown ────────────────────────────────────
function FilterDropdown({ name, icon, label, options, activeValue, onSelect, openName, setOpenName }) {
  const ref = useRef(null);
  const isOpen = openName === name;
  const isActive = activeValue !== null;

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        if (openName === name) setOpenName(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openName, name, setOpenName]);

  return (
    <div className="filter-select" ref={ref}>
      <button
        className={`filter-btn${isActive ? ' active' : ''}`}
        id={`fb-${name}`}
        onClick={() => setOpenName(isOpen ? null : name)}
      >
        <i className={`ti ${icon}`} style={{ fontSize: 13 }} />
        {label}
        <span className="arrow">▾</span>
      </button>

      {isOpen && (
        <div className="dropdown">
          {options.map((opt, idx) => {
            const isDefault = opt.value === DEFAULT_LABELS[name];
            return (
              <React.Fragment key={opt.value}>
                {idx === 1 && <div className="dd-divider" />}
                <div
                  className="dd-item"
                  onClick={() => {
                    onSelect(name, opt.value);
                    setOpenName(null);
                  }}
                >
                  {/* Dot for status */}
                  {opt.dot && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dot, display: 'inline-block' }} />
                  )}
                  {/* Avatar for owner */}
                  {opt.initials && (
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: opt.bg, color: opt.color,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700
                    }}>
                      {opt.initials}
                    </span>
                  )}
                  {/* Clock icon for deadline */}
                  {opt.iconColor && !opt.initials && (
                    <i
                      className={`ti ${opt.icon || 'ti-clock'}`}
                      style={{ fontSize: 12, color: opt.iconColor }}
                    />
                  )}
                  {/* Flag icon for priority */}
                  {name === 'priority' && !isDefault && opt.iconColor && (
                    <i className="ti ti-flag-filled" style={{ fontSize: 12, color: opt.iconColor }} />
                  )}
                  {opt.label}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────
export default function FilterBar() {
  const [activeFilters, setActiveFilters] = useState({});
  const [openName, setOpenName] = useState(null);

  function handleSelect(type, value) {
    if (value === DEFAULT_LABELS[type]) {
      setActiveFilters((prev) => { const n = { ...prev }; delete n[type]; return n; });
    } else {
      setActiveFilters((prev) => ({ ...prev, [type]: value }));
    }
  }

  function removeFilter(type) {
    setActiveFilters((prev) => { const n = { ...prev }; delete n[type]; return n; });
  }

  function clearAll() {
    setActiveFilters({});
  }

  const hasFilters = Object.keys(activeFilters).length > 0;

  const FILTER_CONFIGS = [
    { name: 'status',   icon: 'ti-circle-dot',     label: 'Status' },
    { name: 'client',   icon: 'ti-building',        label: 'Client' },
    { name: 'deadline', icon: 'ti-calendar-event',  label: 'Deadline' },
    { name: 'owner',    icon: 'ti-user',            label: 'Assigned Owner' },
    { name: 'priority', icon: 'ti-flag',            label: 'Priority' },
  ];

  return (
    <div className="filter-bar">
      {FILTER_CONFIGS.map((cfg) => (
        <FilterDropdown
          key={cfg.name}
          name={cfg.name}
          icon={cfg.icon}
          label={cfg.label}
          options={FILTER_OPTIONS[cfg.name]}
          activeValue={activeFilters[cfg.name] ?? null}
          onSelect={handleSelect}
          openName={openName}
          setOpenName={setOpenName}
        />
      ))}

      <div className="filter-divider" />

      {/* Active tags */}
      <div id="activeTags" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {Object.entries(activeFilters).map(([key, val]) => (
          <div key={key} className="active-tag">
            {val}
            <button onClick={() => removeFilter(key)}>×</button>
          </div>
        ))}
      </div>

      {hasFilters && (
        <button className="clear-btn" onClick={clearAll}>
          <i className="ti ti-x" style={{ fontSize: 12 }} /> Clear all
        </button>
      )}
    </div>
  );
}
