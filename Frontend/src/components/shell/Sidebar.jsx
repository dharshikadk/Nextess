// src/components/shell/Sidebar.jsx
import Icon from "../common/Icon";
import "./shell.css";

const MAIN_NAV = [
  { key: "dashboard", label: "Dashboard", sublabel: null, icon: "dashboard" },
  { key: "missions", label: "Missions", sublabel: "Learning Paths & Discovery", icon: "missions" },
  { key: "leaderboard", label: "Leaderboard", sublabel: "3-Day League", icon: "leaderboard" },
  { key: "profile", label: "Profile & Badges", sublabel: "Mascot & Relics", icon: "profile" },
];

const SYSTEM_NAV = [
  { key: "settings", label: "Settings", sublabel: "Theme & Preferences", icon: "settings" },
  { key: "about", label: "About", sublabel: "Vision & Roadmap", icon: "about" },
];

function NavLink({ item, active, onNavigate }) {
  return (
    <a
      href={`#${item.key}`}
      className={`nx-navlink${active ? " nx-navlink--active" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(item.key);
      }}
    >
      <Icon name={item.icon} size={18} />
      <span className="nx-navlink__text">
        <span className="nx-navlink__label">{item.label}</span>
        {item.sublabel && <span className="nx-navlink__sublabel">{item.sublabel}</span>}
      </span>
    </a>
  );
}

export default function Sidebar({ activeRoute, onNavigate, isGuest = true, onSignIn }) {
  return (
    <aside className="nx-sidebar">
      <div className="nx-sidebar__scroll">
        <div className="nx-sidebar__brand">
          <div className="nx-sidebar__logo" aria-hidden="true">
            N
          </div>
          <span className="nx-sidebar__brand-text">Nextess</span>
        </div>

        <div className="nx-sidebar__section-label">Main Modules</div>
        <nav className="nx-nav">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.key} item={item} active={activeRoute === item.key} onNavigate={onNavigate} />
          ))}
        </nav>

        <div className="nx-sidebar__section-label">System &amp; Info</div>
        <nav className="nx-nav">
          {SYSTEM_NAV.map((item) => (
            <NavLink key={item.key} item={item} active={activeRoute === item.key} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>

      {isGuest && (
        <div className="nx-sidebar__guest-card">
          <div className="nx-sidebar__guest-row">
            <span className="nx-sidebar__guest-title">Cadet Access</span>
            <span className="nx-badge nx-badge--guest">Guest</span>
          </div>
          <p className="nx-sidebar__guest-copy">
            Unlock persistent progress sync &amp; ranked simulation bouts.
          </p>
          <div className="nx-sidebar__guest-actions">
            <button className="nx-btn nx-btn--primary nx-btn--block" onClick={() => onSignIn?.()}>
              Sign In / Sign Up
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
