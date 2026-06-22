export function ProgressBar({ value = 0, height = 6 }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div style={{ width: '100%', height, background: '#F3F4F6', borderRadius: height }}>
      <div style={{ width: `${clamped}%`, height: '100%', background: '#6366F1', borderRadius: height, transition: 'width 0.3s ease' }} />
    </div>
  );
}
