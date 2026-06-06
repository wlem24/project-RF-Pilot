import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { TOP_CLIENTS, DEADLINES, CHART_GRID, CHART_TICKS } from '../data/constants.js';

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
            data: [8000, 11000, 14000, 13000, 22000, 19000, 26000],
            borderColor: '#4f46e5',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
            backgroundColor: '#4f46e510',
          },
          {
            data: [3000, 5000, 6000, 7000, 10000, 12000, 15000],
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
          data: [2, 3, 8, 5],
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
const STATUS_LEGEND = [
  { color: '#4f46e5', label: 'Under review', pct: '52.1%' },
  { color: '#1D9E75', label: 'Drafting',     pct: '22.8%' },
  { color: '#EF9F27', label: 'Submitted',    pct: '13.9%' },
  { color: '#484f58', label: 'Archived',     pct: '11.2%' },
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
          data: [52.1, 22.8, 13.9, 11.2],
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
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
          Tracking
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
