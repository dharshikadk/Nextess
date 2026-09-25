// src/components/shell/Header.jsx
import Icon from "../common/Icon";
import CountUp from "../common/CountUp";
import { useTheme } from "../../theme/ThemeContext";
import "./shell.css";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      className="nx-theme-toggle"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Sun for light mode, moon for dark mode, per the product request */}
      <Icon name={isDark ? "moon" : "sun"} size={16} />
    </button>
  );
}

export default function Header({ session, onNavigate, rightSlot }) {
  return (
    <header className="nx-header">
      {rightSlot?.left}
      <div className="nx-header__stats">
        <ThemeToggle />
        <div className="nx-pill nx-pill--violet">
          <Icon name="kp" size={14} color="#a78bfa" />
          <span>
            <CountUp value={session.kp} /> KP
          </span>
        </div>
        <div className="nx-pill nx-pill--amber">
          <Icon name="coin" size={14} color="#fbbf24" />
          <span>
            <CountUp value={session.coins} />
          </span>
        </div>
        <div className="nx-pill nx-pill--red">
          <Icon name="streak" size={14} color="#fb923c" />
          <span>{session.streakDays} Days</span>
        </div>
        <div className="nx-header__divider" />
        {session.isGuest ? (
          <button className="nx-pill nx-pill--signin" onClick={() => onNavigate?.("auth")}>
            Sign In
          </button>
        ) : null}
        <div className="nx-header__avatar">
          <div className="nx-header__avatar-badge" />
          <span className="nx-header__avatar-text">
            <span className="nx-header__avatar-level">Lvl {session.level}</span>
            <span className="nx-header__avatar-label">{session.levelLabel}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
