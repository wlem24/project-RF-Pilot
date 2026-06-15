import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { TOP_CLIENTS, DEADLINES, CHART_GRID, CHART_TICKS } from '../../data/constants.js';

Chart.register(...registerables);

// ── Pipeline Tab ──────────────────────────────────────────────────
function PipelineTab() {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || chartRef.current) return;
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
          {
            // [MODIFIED] Zeroed out — TODO: Replace with API call when backend is ready
            // GET /api/tracking/pipeline → { actual: [...] }
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#4f46e5',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
            backgroundColor: '#4f46e510',
          },
          {
            // [MODIFIED] Zeroed out — TODO: Replace with API call when backend is ready
            // GET /api/tracking/pipeline → { target: [...] }
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#484f58',
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: CHART_GRID },
            ticks: { color: CHART_TICKS, font: { size: 10 } },
          },
          y: {
            grid: { color: CHART_GRID },
            ticks: {
              color: CHART_TICKS,
              font: { size: 10 },
              callback: (v) => v / 1000 + 'K',
            },
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, []);

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: 12 }}>
        <div style={{ position: 'relative', height: 150 }}>
          <canvas ref={canvasRef} role="img" aria-label="Pipeline value" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>
            Top clients
          </div>
          {/* TODO: Replace with API call when backend is ready
              GET /api/clients/top → [{ name, pct }] */}
          {TOP_CLIENTS.map((c) => (
            <div key={c.name} className="cl-row">
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>{c.name}</span>
              <div className="cl-bg">
                <div className="cl-fill" style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Deadlines Tab ─────────────────────────────────────────────────
function DeadlinesTab() {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || chartRef.current) return;
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: ['This Week', 'Next Week', 'Jun', 'Jul'],
        datasets: [{
          // [MODIFIED] Zeroed out — TODO: Replace with API call when backend is ready
          // GET /api/deadlines/chart → { counts: [...] }
          data: [0, 0, 0, 0],
          backgroundColor: ['#E24B4A90', '#EF9F2790', '#4f46e590', '#1D9E7590'],
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: CHART_TICKS, font: { size: 10 } } },
          y: { grid: { color: CHART_GRID }, ticks: { color: CHART_TICKS, font: { size: 10 } } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, []);

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          {/* TODO: Replace with API call when backend is ready
              GET /api/deadlines → [{ name, tabDate, days, pill }] */}
          {DEADLINES.map((d, i) => (
            <div
              key={d.name}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: i < DEADLINES.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{d.name}</div>
                <div style={{ fontSize: 10, color: 'var(--faint)' }}>{d.tabDate}</div>
              </div>
              <span className={`pill ${d.pill}`}>{d.days}</span>
            </div>
          ))}
        </div>
        <div style={{ position: 'relative', height: 160 }}>
          <canvas ref={canvasRef} role="img" aria-label="Deadline chart" />
        </div>
      </div>
    </div>
  );
}

// ── Operating Status Tab ──────────────────────────────────────────

// [MODIFIED] Zeroed out — TODO: Replace with API call when backend is ready
// GET /api/rfps/status-summary → [{ label, pct }]
const STATUS_LEGEND = [
  { color: '#4f46e5', label: 'Under review', pct: '0%' },
  { color: '#1D9E75', label: 'Drafting',     pct: '0%' },
  { color: '#EF9F27', label: 'Submitted',    pct: '0%' },
  { color: '#484f58', label: 'Archived',     pct: '0%' },
];

function OpsStatusTab() {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || chartRef.current) return;
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Under Review', 'Drafting', 'Submitted', 'Archived'],
        datasets: [{
          // [MODIFIED] Zeroed out — TODO: Replace with API call when backend is ready
          // GET /api/rfps/status-summary → { data: [...] }
          data: [0, 0, 0, 0],
          backgroundColor: ['#4f46e5', '#1D9E75', '#EF9F27', '#484f58'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { display: false } },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, []);

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', height: 160 }}>
          <canvas ref={canvasRef} role="img" aria-label="Status donut" />
        </div>
        <div>
          {STATUS_LEGEND.map((s) => (
            <div key={s.label} className="leg">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div className="dot" style={{ background: s.color }} />
                <span style={{ color: 'var(--muted)' }}>{s.label}</span>
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{s.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TrackingTabs (container) ──────────────────────────────────────
const TABS = [
  { id: 'pipeline',   label: 'Pipeline Value' },
  { id: 'deadlines',  label: 'Upcoming Deadlines' },
  { id: 'opsstatus',  label: 'Operating Status' },
];

export default function TrackingTabs() {
  const [activeTab, setActiveTab] = useState('pipeline');

  return (
    <div className="card">
      {/* [MODIFIED] header row: changed from single title div to flex row
          so Upload RFP button sits top-right inside the Tracking card.
          Button moved here from Dashboard.jsx page-header.
          [REMOVED] Today button — removed per request. */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            Tracking
          </div>
          {/* [ADDED] Upload RFP button — moved from Dashboard.jsx page-header */}
          <button className="btn-sm btn-p" onClick={() => window.location.href = '/upload-rfp'}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} />
            Upload RFP
          </button>
        </div>
        <div className="tracking-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`ttab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'pipeline'  && <PipelineTab />}
      {activeTab === 'deadlines' && <DeadlinesTab />}
      {activeTab === 'opsstatus' && <OpsStatusTab />}
    </div>
  );
}