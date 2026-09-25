// src/components/dashboard/DashboardPage.jsx
import { useEffect, useState } from "react";
import Icon from "../common/Icon";
import CountUp from "../common/CountUp";
import ProgressBar from "../common/ProgressBar";
import { fetchSession, fetchActiveMission } from "../../services/api";
import "../common/common.css";
import "./dashboard.css";

function QuoteTicker({ quote }) {
  return (
    <div className="nx-quote-ticker">
      <div className="nx-quote-ticker__icon">
        <Icon name="about" size={14} />
      </div>
      <p className="nx-quote-ticker__text">
        “{quote.text}” <span className="nx-quote-ticker__author">— {quote.author}</span>
      </p>
      <span className="nx-quote-ticker__dot" />
    </div>
  );
}

function HeroCard({ session }) {
  return (
    <section className="nx-hero">
      <div className="nx-hero__glow nx-hero__glow--top" />
      <div className="nx-hero__glow nx-hero__glow--bottom" />
      <div className="nx-hero__top">
        <div>
          <div className="nx-hero__eyebrow">
            <span className="nx-hero__eyebrow-main">Main Research Deck</span>
            <span className="nx-hero__eyebrow-dot">•</span>
            <span className="nx-hero__eyebrow-sector">Sector 04 // Core Node</span>
          </div>
          <h1 className="nx-hero__title">
            Good afternoon,
            <br />
            {session.displayName}!
          </h1>
        </div>
        <div className="nx-hero__stack">
          <div className="nx-hero__stat-pill">
            <div className="nx-hero__stat-icon">
              <Icon name="streak" size={20} color="var(--orange-400)" />
            </div>
            <div>
              <div className="nx-hero__stat-row">
                <span className="nx-hero__stat-value">{session.streakDays} Days</span>
                {session.streakLocked && <span className="nx-tag nx-tag--amber">Locked</span>}
              </div>
              <div className="nx-hero__stat-progress">
                <div className="nx-progress nx-progress--amber" style={{ width: 96 }}>
                  <div
                    className="nx-progress__fill"
                    style={{ width: `${(session.streakDays / session.streakTargetDays) * 100}%` }}
                  />
                </div>
                <span className="nx-hero__stat-caption">
                  {session.streakDays}/{session.streakTargetDays} Target
                </span>
              </div>
            </div>
          </div>
          <div className="nx-hero__stat-pill">
            <div className="nx-hero__stat-icon">
              <Icon name="bolt" size={20} color="var(--violet-400)" />
            </div>
            <div>
              <div className="nx-hero__stat-value nx-hero__stat-value--violet">
                +{session.velocityKpPerHr} KP/hr
              </div>
              <span className="nx-hero__stat-caption">Velocity: +{session.velocityPeakPercent}% peak</span>
            </div>
          </div>
        </div>
      </div>
      {session.streakBoost?.active && (
        <div className="nx-hero__boost">
          <div className="nx-hero__boost-left">
            <span className="nx-hero__boost-icon">
              <Icon name="bolt" size={16} color="var(--amber-400)" />
            </span>
            <p className="nx-hero__boost-text">
              <strong>{session.streakBoost.title}</strong>
              <span> • {session.streakBoost.detail}</span>
            </p>
          </div>
          <div className="nx-hero__boost-right">
            <span className="nx-hero__boost-multiplier">{session.streakBoost.multiplierLabel}</span>
            <button className="nx-btn nx-btn--chip">{session.streakBoost.claimLabel}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function ActiveMissionCard({ mission, onResume }) {
  if (!mission) return null;
  return (
    <div className="nx-card nx-card--active-mission">
      <div>
        <div className="nx-card__top-row">
          <div className="nx-card__eyebrow">
            <span className="nx-card__eyebrow-icon">
              <Icon name="bolt" size={13} color="var(--violet-400)" />
            </span>
            Active Lab Chamber
          </div>
          <span className="nx-tag nx-tag--neutral">{mission.domain}</span>
        </div>
        <h2 className="nx-card__title">{mission.title}</h2>
        <p className="nx-card__desc">{mission.objective}</p>

        <div className="nx-hud">
          <div className="nx-hud__row">
            <span className="nx-hud__label">
              Level {mission.currentLevel} of {mission.totalLevels}
              {mission.currentQuestion ? ` • Question ${mission.currentQuestion} of ${mission.totalQuestions}` : ""}
            </span>
            <span className="nx-hud__percent">{mission.progressPercent}% Complete</span>
          </div>
          <ProgressBar percent={mission.progressPercent} />
          <div className="nx-hud__row">
            <span className="nx-hud__label">{mission.simulationType?.replace(/_/g, " ")}</span>
            <span className="nx-hud__reward">+{Math.round(mission.kp * 0.78)} KP on solve</span>
          </div>
        </div>
      </div>
      <div className="nx-card__footer">
        <div className="nx-card__sandbox-note">
          <Icon name="bolt" size={13} />
          <span>Sandbox: {mission.simulationType?.replace(/_/g, " ")}</span>
        </div>
        <div className="nx-card__actions">
          <button className="nx-btn nx-btn--primary" onClick={onResume}>
            Resume Mission <Icon name="chevron" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DailyDirectives({ directives }) {
  return (
    <div className="nx-card nx-card--directives">
      <div>
        <div className="nx-card__top-row">
          <div className="nx-card__eyebrow">
            <span className="nx-card__eyebrow-icon nx-card__eyebrow-icon--amber">
              <Icon name="check" size={13} color="var(--amber-400)" />
            </span>
            <h3 className="nx-card__title nx-card__title--sm">Daily Directives</h3>
          </div>
          <span className="nx-card__done-count">
            {directives.completed}/{directives.total} Done
          </span>
        </div>
        <ul className="nx-directive-list">
          {directives.items.map((item) => (
            <li key={item.id} className={`nx-directive nx-directive--${item.state}`}>
              <span className="nx-directive__icon">
                <Icon name={item.state === "done" ? "check" : "bolt"} size={16} />
              </span>
              <div className="nx-directive__body">
                <p className={`nx-directive__label${item.state === "done" ? " nx-directive__label--done" : ""}`}>
                  {item.label}
                </p>
                <p className="nx-directive__reward">{item.rewardLabel}</p>
              </div>
              {item.state === "done" ? (
                <span className="nx-badge nx-badge--done">Done</span>
              ) : (
                <button className="nx-btn nx-btn--go">Go</button>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="nx-card__footer nx-card__footer--split">
        <span className="nx-hud__label">Resets in: {directives.resetsInLabel}</span>
        <a href="#missions" className="nx-link">
          View Weekly Quests →
        </a>
      </div>
    </div>
  );
}

function LeagueBanner({ league }) {
  return (
    <section className="nx-league-banner">
      <div className="nx-league-banner__left">
        <div className="nx-league-banner__icon">
          <Icon name="leaderboard" size={22} color="var(--violet-400)" />
        </div>
        <div>
          <div className="nx-league-banner__title-row">
            <h3 className="nx-card__title nx-card__title--sm">3 Day Master League is Live Now</h3>
          </div>
          <p className="nx-league-banner__copy">Solve missions to top this league's leaderboard.</p>
        </div>
      </div>
      <div className="nx-league-banner__right">
        <span className="nx-hud__label">Sprint closes in</span>
        <span className="nx-league-banner__timer">{league.closesInLabel}</span>
      </div>
    </section>
  );
}

function SuggestedSubjects({ subjects }) {
  return (
    <section className="nx-suggested">
      <div className="nx-suggested__heading">
        <span className="nx-suggested__bar" />
        <div>
          <h2 className="nx-suggested__title">Upcoming Research Disciplines</h2>
          <p className="nx-suggested__subtitle">
            Curricula currently under peer calibration by Nextess Science Directors. Reserve early laboratory
            clearance.
          </p>
        </div>
      </div>
      <div className="nx-suggested__grid">
        {subjects.map((s) => (
          <div key={s.id} className="nx-suggested-card">
            <div className="nx-suggested-card__top">
              <div className="nx-suggested-card__icon">
                <Icon name="about" size={16} />
              </div>
              <span className={`nx-tag nx-tag--${s.tagStyle === "purple" ? "violet" : "neutral"}`}>
                {s.tagLabel}
              </span>
            </div>
            <h3 className="nx-suggested-card__name">{s.name}</h3>
            <p className="nx-suggested-card__desc">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GuestBanner() {
  return null; // moved to the global FloatingSessionBanner (shown on every tab)
}

export default function DashboardPage({ onNavigate }) {
  const [session, setSession] = useState(null);
  const [activeMission, setActiveMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchSession(), fetchActiveMission()]).then(([s, m]) => {
      if (cancelled) return;
      setSession(s);
      setActiveMission(m);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !session) {
    return (
      <div className="nx-skeleton-wrap" aria-busy="true" aria-live="polite">
        <div className="nx-skeleton nx-skeleton--quote" />
        <div className="nx-skeleton nx-skeleton--hero" />
        <div className="nx-skeleton-grid">
          <div className="nx-skeleton nx-skeleton--card" />
          <div className="nx-skeleton nx-skeleton--card-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="nx-animate-in">
      <div className="nx-section">
        <QuoteTicker quote={session.quoteOfTheDay} />
      </div>
      <div className="nx-section">
        <HeroCard session={session} />
      </div>
      <div className="nx-section nx-grid-12">
        <div className="nx-col-7">
          <ActiveMissionCard mission={activeMission} onResume={() => onNavigate("missions")} />
        </div>
        <div className="nx-col-5">
          <DailyDirectives directives={session.dailyDirectives} />
        </div>
      </div>
      <div className="nx-section">
        <LeagueBanner league={session.league} />
      </div>
      <div className="nx-section">
        <SuggestedSubjects subjects={session.suggestedSubjects} />
      </div>
      <div className="nx-section nx-section--last">
        <GuestBanner session={session} onAuth={() => onNavigate("about")} />
      </div>
    </div>
  );
}
