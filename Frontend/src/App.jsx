// src/App.jsx
import { useMemo, useState } from "react";
import { ThemeProvider } from "./theme/ThemeContext";
import AppShell from "./components/shell/AppShell";
import DashboardPage from "./components/dashboard/DashboardPage";
import MissionsZigZagPage from "./components/missions/MissionsZigZagPage";
import FloatingSessionBanner from "./components/shell/FloatingSessionBanner";
import guestSession from "./data/session";

function ComingSoon({ label }) {
  return (
    <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)" }}>
      <h2 style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{label}</h2>
      <p>This page isn't built yet in this prototype.</p>
    </div>
  );
}

const PAGES = {
  dashboard: DashboardPage,
  missions: MissionsZigZagPage,
};

export default function App() {
  // Simple in-memory navigation history so every page can offer "go back",
  // per the product request. history[history.length-1] is the current route.
  const [history, setHistory] = useState(["dashboard"]);
  const [isGuest, setIsGuest] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const route = history[history.length - 1];
  const session = useMemo(() => ({ ...guestSession, isGuest }), [isGuest]);

  function navigate(next) {
    setHistory((h) => (h[h.length - 1] === next ? h : [...h, next]));
  }
  function goBack() {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  }
  function signIn() {
    setIsGuest(false);
    navigate("dashboard");
  }

  const Page = PAGES[route];

  return (
    <ThemeProvider>
      <AppShell
        activeRoute={route}
        onNavigate={navigate}
        onSignIn={() => navigate("auth")}
        canGoBack={history.length > 1}
        onBack={goBack}
        session={session}
      >
        {route === "auth" ? (
          <div style={{ maxWidth: 420, margin: "48px auto", textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-display)" }}>Sign In / Sign Up</h2>
            <p style={{ color: "var(--text-muted)" }}>
              Authentication isn't built yet in this prototype. This button simulates a signed-in
              session so you can see how the guest banner and header react.
            </p>
            <button className="nx-btn nx-btn--primary" onClick={signIn}>
              Continue as Signed In (demo)
            </button>
          </div>
        ) : Page ? (
          <Page onNavigate={navigate} />
        ) : (
          <ComingSoon label={route[0].toUpperCase() + route.slice(1)} />
        )}
      </AppShell>
      <FloatingSessionBanner
        session={session}
        dismissed={bannerDismissed}
        onDismiss={() => setBannerDismissed(true)}
        onSignIn={() => navigate("auth")}
      />
    </ThemeProvider>
  );
}
