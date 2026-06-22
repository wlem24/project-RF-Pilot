import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const CHART_GRID  = 'rgba(255,255,255,0.05)';
const CHART_TICKS = '#484f58';

function fmtValue(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

// ── Pipeline Tab ───────────────────────────────────────────────────
function PipelineTab({ pipelineData = [], topClients = [] }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const labels      = pipelineData.map(d => d.month);
  const values      = pipelineData.map(d => d.value);
  const counts      = pipelineData.map(d => d.count ?? 0);
  const hasValue    = values.some(v => v > 0);

  useEffect(() => {
    if (!canvasRef.current || !hasValue) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#4f46e5',
            borderWidth: 2,
            pointRadius: 4,
            tension: 0.4,
            fill: true,
            backgroundColor: '#4f46e510',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const idx = ctx.dataIndex;
                return [`Value: ${fmtValue(values[idx])}`, `RFPs: ${counts[idx]}`];
              },
            },
          },
        },
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
              callback: v => fmtValue(v),
            },
            beginAtZero: true,
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [pipelineData]);

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: 12 }}>
        <div style={{ position: 'relative', height: 150 }}>
          {hasValue
            ? <canvas ref={canvasRef} role="img" aria-label="Pipeline value" />
            : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <p style={{ fontSize: 12, color: 'var(--faint)', textAlign: 'center', lineHeight: 1.5 }}>
                  No estimated values recorded yet.<br />
                  <span style={{ fontSize: 11 }}>Add contract value when uploading RFPs.</span>
                </p>
              </div>
            )
          }
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>
            Top clients
          </div>
          {topClients.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--faint)' }}>No client data yet</p>
          ) : (
            topClients.map(c => (
              <div key={c.name} className="cl-row">
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>{c.name}</span>
                <div className="cl-bg">
                  <div className="cl-fill" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Deadlines Tab ──────────────────────────────────────────────────
function DeadlinesTab({ deadlines = [] }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  // Bucket by urgency: urgent vs normal
  const urgentCount = deadlines.filter(d => d.urgency === 'urgent').length;
  const normalCount = deadlines.length - urgentCount;

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: ['Urgent', 'Normal'],
        datasets: [{
          data: [urgentCount, normalCount],
          backgroundColor: ['#E24B4A90', '#4f46e590'],
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: CHART_TICKS, font: { size: 10 } } },
          y: {
            grid: { color: CHART_GRID },
            ticks: { color: CHART_TICKS, font: { size: 10 }, stepSize: 1, callback: v => (v % 1 === 0 ? v : '') },
            beginAtZero: true,
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [urgentCount, normalCount]);

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          {deadlines.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--faint)' }}>No upcoming deadlines</p>
          ) : (
            deadlines.slice(0, 5).map((d, i) => (
              <div
                key={d.id || d.rfpId + i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: i < Math.min(deadlines.length, 5) - 1 ? '0.5px solid var(--border)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                    {d.rfpTitle || d.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--faint)' }}>{d.dueDate || d.deadline}</div>
                </div>
                <span
                  className={`pill ${d.urgency === 'urgent' ? 'pill-red' : 'pill-amber'}`}
                  style={{ fontSize: 10 }}
                >
                  {d.urgency === 'urgent' ? 'Urgent' : 'Upcoming'}
                </span>
              </div>
            ))
          )}
        </div>
        <div style={{ position: 'relative', height: 160 }}>
          <canvas ref={canvasRef} role="img" aria-label="Deadline chart" />
        </div>
      </div>
    </div>
  );
}

// ── Operating Status Tab ───────────────────────────────────────────
function OpsStatusTab({ statusCounts = {} }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const underReview = statusCounts.under_review || 0;
  const drafting    = statusCounts.draft        || 0;
  const submitted   = statusCounts.submitted    || 0;
  const archived    = statusCounts.archived     || 0;
  const total       = underReview + drafting + submitted + archived || 1;

  const pct = n => `${Math.round(n / total * 100)}%`;

  const legend = [
    { color: '#4f46e5', label: 'Under review', value: underReview, pct: pct(underReview) },
    { color: '#1D9E75', label: 'Drafting',     value: drafting,    pct: pct(drafting)    },
    { color: '#EF9F27', label: 'Submitted',    value: submitted,   pct: pct(submitted)   },
    { color: '#484f58', label: 'Archived',     value: archived,    pct: pct(archived)    },
  ];

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: legend.map(l => l.label),
        datasets: [{
          data: [underReview, drafting, submitted, archived],
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
  }, [underReview, drafting, submitted, archived]);

  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', height: 160 }}>
          <canvas ref={canvasRef} role="img" aria-label="Status donut" />
        </div>
        <div>
          {legend.map(s => (
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

// ── Container ──────────────────────────────────────────────────────
const TABS = [
  { id: 'pipeline',  label: 'Pipeline Value'     },
  { id: 'deadlines', label: 'Upcoming Deadlines'  },
  { id: 'opsstatus', label: 'Operating Status'    },
];

export default function TrackingTabs({ pipelineData = [], topClients = [], deadlines = [], statusCounts = {} }) {
  const [activeTab, setActiveTab] = useState('pipeline');

  return (
    <div className="card">
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Tracking</div>
          <button className="btn-sm btn-p" onClick={() => window.location.href = '/upload-rfp'}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} />
            Upload RFP
          </button>
        </div>

        <div className="tracking-tabs">
          {TABS.map(t => (
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

      {activeTab === 'pipeline'  && <PipelineTab  pipelineData={pipelineData} topClients={topClients} />}
      {activeTab === 'deadlines' && <DeadlinesTab deadlines={deadlines} />}
      {activeTab === 'opsstatus' && <OpsStatusTab statusCounts={statusCounts} />}
    </div>
  );
}
