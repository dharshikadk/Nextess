// src/components/missions/MissionNode.jsx
import Icon from "../common/Icon";

const STATUS_META = {
  in_progress: { label: "In-Progress", dot: "violet" },
  unlocked: { label: "Unlocked", dot: "amber" },
  sealed: { label: "Sealed", dot: "muted" },
};

export default function MissionNode({ mission, index, isSelected, onSelect }) {
  const side = index % 2 === 0 ? "left" : "right";
  const meta = STATUS_META[mission.status] || STATUS_META.sealed;
  const locked = mission.status === "sealed";

  return (
    <div className={`nx-mnode nx-mnode--${side} nx-animate-in`} style={{ animationDelay: `${index * 90}ms` }}>
      <div className="nx-mnode__row">
        {side === "left" && (
          <MissionOrb mission={mission} index={index} meta={meta} locked={locked} />
        )}
        <button
          type="button"
          className={`nx-mnode__card${isSelected ? " nx-mnode__card--selected" : ""}${
            locked ? " nx-mnode__card--locked" : ""
          }`}
          onClick={() => !locked && onSelect(mission)}
          disabled={locked}
        >
          <div className="nx-mnode__eyebrow">
            <span className={`nx-mnode__dot nx-mnode__dot--${meta.dot}`} />
            MISSION {String(index + 1).padStart(2, "0")} // {meta.label.toUpperCase()}
          </div>
          <div className="nx-mnode__title">{mission.title}</div>
          <div className="nx-mnode__meta">
            <span className="nx-mnode__meta-item">
              <Icon name="kp" size={14} color="var(--amber-300)" /> {mission.kp} KP
            </span>
            <span className="nx-mnode__meta-sep">•</span>
            <span className="nx-mnode__meta-item">
              <Icon name="coin" size={14} color="var(--violet-300)" /> {mission.coins} Coins
            </span>
          </div>
        </button>
        {side === "right" && (
          <MissionOrb mission={mission} index={index} meta={meta} locked={locked} />
        )}
      </div>
    </div>
  );
}

function MissionOrb({ mission, meta, locked }) {
  return (
    <div className={`nx-mnode__orb nx-mnode__orb--${meta.dot}`}>
      {mission.status === "in_progress" ? (
        <span className="nx-mnode__orb-percent">{mission.progressPercent}%</span>
      ) : locked ? (
        <Icon name="lock" size={20} color="var(--text-dim)" />
      ) : (
        <Icon name="bolt" size={22} color="var(--amber-400)" />
      )}
      {mission.status === "unlocked" && <span className="nx-mnode__ready-flag">Ready</span>}
    </div>
  );
}
