// src/components/common/Icon.jsx
//
// Central icon registry. Add new keys here rather than inlining <svg> in
// feature components — keeps the sidebar/header icon set consistent and
// swappable (e.g. for a real icon library later) from one place.

const PATHS = {
  dashboard: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z",
  missions: "M12 3 3 8l9 5 7-3.89V17h2V8L12 3ZM5 10.18v4.32L12 18l7-3.5v-4.32l-7 3.5-7-3.5Z",
  leaderboard: "M9 21h6v-2H9v2Zm2-4h2v-3h3l-4-4-4 4h3v3ZM4 5v2h16V5H4Z",
  profile: "M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-9 2-9 6v1h18v-1c0-4-5-6-9-6Z",
  settings: "M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4Zm8.6 4a7.9 7.9 0 0 0-.14-1.44l2.02-1.58-2-3.46-2.38.96a8.1 8.1 0 0 0-2.5-1.44L15 2.5h-4l-.6 2.54a8.1 8.1 0 0 0-2.5 1.44l-2.38-.96-2 3.46 2.02 1.58A7.9 7.9 0 0 0 5.4 12a7.9 7.9 0 0 0 .14 1.44L3.52 15l2 3.46 2.38-.96a8.1 8.1 0 0 0 2.5 1.44L11 21.5h4l.6-2.54a8.1 8.1 0 0 0 2.5-1.44l2.38.96 2-3.46-2.02-1.58c.09-.47.14-.95.14-1.44Z",
  about: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z",
  kp: "M13 2 3 14h6l-2 8 10-12h-6l2-8Z",
  coin: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 16a6 6 0 1 1 6-6 6 6 0 0 1-6 6Z",
  streak: "M13.5 2c1 4-2 5-2 8a3.5 3.5 0 0 0 7 0c0-1-.3-1.9-.8-2.7 1.5 1 2.8 3 2.8 5.7a6.5 6.5 0 0 1-13 0c0-5 4-6.5 6-11Z",
  chevron: "M9 6l6 6-6 6",
  resume: "M8 5v14l11-7-11-7Z",
  bolt: "M13 2 3 14h6l-2 8 10-12h-6l2-8Z",
  check: "M20 6 9 17l-5-5",
  lock: "M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h8V8a4 4 0 0 0-8 0v2Z",
  puppy: "M12 3c-1 0-2 1-2 2 0 .6.2 1.1.6 1.5C8.9 7.1 8 8.9 8 11c0 3.3 1.8 6 4 6s4-2.7 4-6c0-2.1-.9-3.9-2.6-4.5.4-.4.6-.9.6-1.5 0-1-1-2-2-2Z",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  moon: "M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z",
  back: "M15 6l-6 6 6 6",
  close: "M6 6l12 12M18 6 6 18",
};

export default function Icon({ name, size = 18, color = "currentColor", className }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d={d} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
