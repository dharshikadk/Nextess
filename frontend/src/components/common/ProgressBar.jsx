// src/components/common/ProgressBar.jsx
export default function ProgressBar({ percent, tone = "violet" }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={`nx-progress nx-progress--${tone}`}>
      <div className="nx-progress__fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}
