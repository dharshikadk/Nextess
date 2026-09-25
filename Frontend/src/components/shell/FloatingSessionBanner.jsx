// src/components/shell/FloatingSessionBanner.jsx
import Icon from "../common/Icon";
import CountUp from "../common/CountUp";
import "./shell.css";

export default function FloatingSessionBanner({ session, dismissed, onDismiss, onSignIn }) {
  if (!session.isGuest || dismissed) return null;
  return (
    <div className="nx-floating-banner nx-animate-in">
      <div className="nx-floating-banner__icon">
        <Icon name="lock" size={16} color="var(--amber-400)" />
      </div>
      <p className="nx-floating-banner__copy">
        Your <CountUp value={session.kp} /> KP and {session.streakDays}-day streak progress are temporarily held in
        local cache. Sign in to save your progress permanently.
      </p>
      <button className="nx-btn nx-btn--primary nx-floating-banner__cta" onClick={onSignIn}>
        Sign In
      </button>
      <button className="nx-floating-banner__close" onClick={onDismiss} aria-label="Dismiss">
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
