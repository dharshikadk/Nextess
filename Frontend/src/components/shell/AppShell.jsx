// src/components/shell/AppShell.jsx
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./shell.css";

export default function AppShell({ activeRoute, onNavigate, onSignIn, canGoBack, onBack, session, headerLeftSlot, children }) {
  return (
    <div>
      <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} isGuest={session.isGuest} onSignIn={onSignIn} />
      <div className="nx-app-shell">
        <Header session={session} onNavigate={onNavigate} rightSlot={{ left: headerLeftSlot }} />
        <main className="nx-page">
          {canGoBack && (
            <button className="nx-back-btn" onClick={onBack}>
              ← Back
            </button>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
