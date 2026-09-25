// src/components/common/CountUp.jsx
//
// Animates a number counting up from 0 to `value` on mount. Used for KP,
// coins, and streak displays so gaining rewards feels alive (per the
// product brief's "dopamine loading" requirement) without needing a sound
// library or animation framework dependency.

import { useEffect, useRef, useState } from "react";

export default function CountUp({ value, durationMs = 900, format = (n) => n.toLocaleString() }) {
  const [display, setDisplay] = useState(0);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (prefersReducedMotion.current) {
      setDisplay(value);
      return;
    }
    let raf;
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <>{format(display)}</>;
}
