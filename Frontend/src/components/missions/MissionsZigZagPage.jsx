// src/components/missions/MissionsZigZagPage.jsx
import { useEffect, useMemo, useState } from "react";
import Icon from "../common/Icon";
import { fetchSubjects, fetchMissionsBySubject } from "../../services/api";
import { useEnrollment } from "../../data/enrollment";
import { getSubjectDisplayName } from "../../data/subjects";
import MissionNode from "./MissionNode";
import "../common/common.css";
import "./missions.css";

const LADDER_ICONS = { passed: "check", current: "bolt", locked: "lock" };

function LadderProgression({ ladder }) {
  return (
    <div className="nx-ladder">
      {ladder.map((step) => (
        <div key={step.key} className={`nx-ladder__step nx-ladder__step--${step.state}`}>
          <Icon name={LADDER_ICONS[step.state] || "lock"} size={18} color="var(--violet-300)" />
          <span className="nx-ladder__step-label">{step.label}</span>
          <span className="nx-ladder__step-sub">
            {step.state === "passed" ? "Passed" : step.state === "current" ? "Current" : "Locked"}
          </span>
        </div>
      ))}
    </div>
  );
}

function SimulationBriefPanel({ mission, onContinue }) {
  if (!mission) {
    return (
      <div className="nx-brief">
        <p className="nx-brief__section-label">Select a mission from the path to preview it here.</p>
      </div>
    );
  }
  return (
    <div className="nx-brief nx-animate-in">
      <div className="nx-brief__top">
        <div>
          <span className="nx-tag nx-tag--violet">Mission Brief</span>
          <div className="nx-brief__id">ID: {mission.id}</div>
          <h2 className="nx-brief__title">{mission.title}</h2>
        </div>
        <div>
          <div className="nx-brief__prizes-label">Prizes</div>
          <div className="nx-brief__prizes">
            <span className="nx-brief__prize" style={{ color: "var(--violet-300)" }}>
              <Icon name="kp" size={16} /> {mission.kp}
            </span>
            <span className="nx-brief__prize" style={{ color: "var(--amber-400)" }}>
              <Icon name="coin" size={16} /> {mission.coins}
            </span>
          </div>
        </div>
      </div>

      {mission.simulationAsset ? (
        <div>
          <div className="nx-sim-frame">
            <iframe
              src={mission.simulationAsset.file}
              title={`${mission.title} simulation`}
              loading="lazy"
              className="nx-sim-frame__iframe"
            />
          </div>
          <p className="nx-helper-note">
            Use these variable controllers to see how the numbers change, then use the simulation to test your
            answer before submitting.
            {!mission.simulationAsset.verifiedMatch && " (Placeholder asset — a mission-specific sim isn't in the repo yet.)"}
          </p>
        </div>
      ) : (
        <>
          <div className="nx-sim-placeholder">
            <Icon name="bolt" size={22} color="var(--text-dim)" />
            <span className="nx-sim-placeholder__title">Simulation preview not available yet</span>
            <span className="nx-sim-placeholder__sub">
              {mission.simulationType?.replace(/_/g, " ")} — pending backend asset
            </span>
          </div>
          <p className="nx-helper-note">
            Once this loads, use the variable controllers to see how the system changes, then use the simulation to
            test your answer before submitting.
          </p>
        </>
      )}

      <p className="nx-brief__situation">
        <strong>Situation:</strong> {mission.missionBrief}
      </p>
      <div className="nx-brief__role">
        Assigned Role: <strong>{mission.domain}</strong>
      </div>

      <div>
        <p className="nx-brief__section-label">Ladder Progression</p>
        <LadderProgression ladder={mission.ladder} />
        <p className="nx-helper-note">This shows how far you are — tap Continue below to pick up where you left off.</p>
      </div>

      <div>
        <p className="nx-brief__section-label">Mission Telemetry Assets</p>
        <div className="nx-assets">
          {mission.resources.map((r) => (
            <div key={r.fileName} className="nx-asset-link">
              <Icon name="about" size={14} />
              {r.fileName}
            </div>
          ))}
        </div>
        <p className="nx-helper-note">Use these files/reports to analyse the situation before you answer.</p>
      </div>

      <div className="nx-brief__actions">
        <button className="nx-brief__cta" onClick={onContinue}>
          <Icon name="resume" size={16} />
          {mission.status === "in_progress"
            ? `Continue from Level ${mission.currentLevel}`
            : "Begin Mission"}
        </button>
        <button className="nx-brief__secondary">Review (-10 Coins)</button>
      </div>
    </div>
  );
}

function PupCard() {
  return (
    <div className="nx-pup-card nx-animate-in">
      <div className="nx-pup-card__avatar">
        <Icon name="puppy" size={28} color="#fff" />
      </div>
      <div>
        <div className="nx-pup-card__eyebrow">
          <Icon name="puppy" size={14} color="var(--amber-300)" /> Sparky the Nextess Pup
        </div>
        <p className="nx-pup-card__quote">"Solve and gain your rewards! You're on fire today, cadet!"</p>
        <span className="nx-pup-card__multiplier">Streak multiplier: 1.25x Active</span>
      </div>
    </div>
  );
}

function EnrollGate({ subject, onEnroll }) {
  return (
    <div className="nx-enroll-gate">
      <div className="nx-enroll-gate__icon">
        <Icon name="missions" size={26} color="var(--violet-300)" />
      </div>
      <h2 className="nx-enroll-gate__title">Enroll in {subject}</h2>
      <p className="nx-enroll-gate__copy">
        You haven't enrolled in {subject} yet. Enrolling unlocks the mission path, the learning capsules and the
        simulations for this subject — it only takes a second.
      </p>
      <button className="nx-enroll-gate__cta" onClick={onEnroll}>
        Enroll in {subject}
      </button>
    </div>
  );
}

export default function MissionsZigZagPage() {
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [missions, setMissions] = useState([]);
  const [selectedMissionId, setSelectedMissionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isEnrolled, enroll } = useEnrollment();

  useEffect(() => {
    fetchSubjects().then((subs) => {
      setSubjects(subs);
      setActiveSubject((prev) => prev || subs[0]);
    });
  }, []);

  useEffect(() => {
    if (!activeSubject) return;
    setLoading(true);
    fetchMissionsBySubject(activeSubject).then((list) => {
      setMissions(list);
      setSelectedMissionId(list[0]?.id ?? null);
      setLoading(false);
    });
  }, [activeSubject]);

  const selectedMission = useMemo(
    () => missions.find((m) => m.id === selectedMissionId) || null,
    [missions, selectedMissionId]
  );

  const inProgressMission = useMemo(() => missions.find((m) => m.status === "in_progress"), [missions]);

  const enrolledInSubject = activeSubject ? isEnrolled(activeSubject) : true;

  return (
    <div>
      <div className="nx-missions-header">
        <div>
          <div className="nx-missions-eyebrow">
            <span className="nx-missions-eyebrow-dot" /> Curriculum Path
          </div>
          <h1 className="nx-missions-title">
            {activeSubject ? `${getSubjectDisplayName(activeSubject)} Missions` : "Missions"}
          </h1>
        </div>
        <div className="nx-subject-switcher">
          {subjects.map((s) => (
            <button
              key={s}
              className={`nx-subject-tab${s === activeSubject ? " nx-subject-tab--active" : ""}`}
              onClick={() => setActiveSubject(s)}
            >
              {getSubjectDisplayName(s)}
              <span className="nx-subject-tab__sub">{isEnrolled(s) ? "Enrolled" : "Not Enrolled"}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="nx-skeleton-wrap">
          <div className="nx-skeleton nx-skeleton--hero" />
        </div>
      ) : !enrolledInSubject ? (
        <EnrollGate subject={getSubjectDisplayName(activeSubject)} onEnroll={() => enroll(activeSubject)} />
      ) : (
        <div className="nx-missions-layout">
          <div className="nx-path">
            {inProgressMission && (
              <button
                type="button"
                className="nx-continue-bar"
                onClick={() => setSelectedMissionId(inProgressMission.id)}
              >
                <Icon name="resume" size={16} />
                Continue from where you left: <strong>{inProgressMission.title}</strong> ({inProgressMission.progressPercent}%)
                <Icon name="chevron" size={14} />
              </button>
            )}
            {missions.map((mission, i) => (
              <MissionNode
                key={mission.id}
                mission={mission}
                index={i}
                isSelected={mission.id === selectedMissionId}
                onSelect={(m) => setSelectedMissionId(m.id)}
              />
            ))}
            <div className="nx-mnode-more">More missions unlock as this track expands.</div>
          </div>
          <div>
            <SimulationBriefPanel mission={selectedMission} onContinue={() => {}} />
            <div style={{ height: 16 }} />
            <PupCard />
          </div>
        </div>
      )}
    </div>
  );
}
