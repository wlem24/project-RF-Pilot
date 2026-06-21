import React, { useState, useEffect, useRef } from 'react';
import { FILTER_OPTIONS, DEFAULT_LABELS } from '../../data/constants.js';

function FilterDropdown({ name, icon, label, options, activeValue, onSelect, openName, setOpenName }) {
  const ref    = useRef(null);
  const isOpen = openName === name;

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
        className={`filter-btn${activeValue !== null ? ' active' : ''}`}
        onClick={() => setOpenName(isOpen ? null : name)}
      >
        <i className={`ti ${icon}`} style={{ fontSize: 13 }} />
        {label}
        <span className="arrow">▾</span>
      </button>

      {isOpen && (
        <div className="dropdown">
          {options.map((opt, idx) => (
            <React.Fragment key={opt.value}>
              {idx === 1 && <div className="dd-divider" />}
              <div
                className="dd-item"
                onClick={() => { onSelect(name, opt.value); setOpenName(null); }}
              >
                {opt.dot && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dot, display: 'inline-block' }} />
                )}
                {opt.initials && (
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: opt.bg || '#e5e7eb', color: opt.color || '#374151',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700,
                  }}>
                    {opt.initials}
                  </span>
                )}
                {opt.iconColor && !opt.initials && (
                  <i className={`ti ${opt.icon || 'ti-clock'}`} style={{ fontSize: 12, color: opt.iconColor }} />
                )}
                {opt.label}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

const FILTER_CONFIGS = [
  { name: 'status',         icon: 'ti-circle-dot',    label: 'Status'         },
  { name: 'client',         icon: 'ti-building',       label: 'Client'         },
  { name: 'deadline_range', icon: 'ti-calendar-event', label: 'Deadline'       },
  { name: 'owner',          icon: 'ti-user',           label: 'Assigned Owner' },
  { name: 'priority',       icon: 'ti-flag',           label: 'Priority'       },
];

export default function FilterBar({ onChange, clientOptions, ownerOptions }) {
  const [activeFilters, setActiveFilters] = useState({});
  const [openName, setOpenName]           = useState(null);

  // Merge runtime dynamic options with static shapes from constants
  const OPTIONS = {
    ...FILTER_OPTIONS,
    client: clientOptions?.length
      ? [{ value: 'All Clients', label: 'All Clients' }, ...clientOptions]
      : FILTER_OPTIONS.client,
    owner: ownerOptions?.length
      ? [{ value: 'All Owners', label: 'All Owners' },
         ...ownerOptions.map(o => ({
           value: o.name,
           label: o.name,
           initials: o.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
           bg: '#4f46e520', color: '#6366f1',
         }))]
      : FILTER_OPTIONS.owner,
  };

  function handleSelect(type, value) {
    const defaultVal = DEFAULT_LABELS[type];
    let next;
    if (value === defaultVal) {
      const copy = { ...activeFilters };
      delete copy[type];
      next = copy;
    } else {
      next = { ...activeFilters, [type]: value };
    }
    setActiveFilters(next);
    onChange?.(next);
  }

  function removeFilter(type) {
    const copy = { ...activeFilters };
    delete copy[type];
    setActiveFilters(copy);
    onChange?.(copy);
  }

  function clearAll() {
    setActiveFilters({});
    onChange?.({});
  }

  const hasFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="filter-bar">
      {FILTER_CONFIGS.map(cfg => (
        <FilterDropdown
          key={cfg.name}
          name={cfg.name}
          icon={cfg.icon}
          label={cfg.label}
          options={OPTIONS[cfg.name] || []}
          activeValue={activeFilters[cfg.name] ?? null}
          onSelect={handleSelect}
          openName={openName}
          setOpenName={setOpenName}
        />
      ))}

      <div className="filter-divider" />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
