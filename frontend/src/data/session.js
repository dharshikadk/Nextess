// src/data/session.js
//
// Stand-in for what /api/session (or /api/users/me + /api/progress/me)
// would return for the current user. The backend remains authoritative for
// all of this in the real system (see Section 58/60/61 of the frontend
// spec) — nothing here is computed or mutated by the frontend.

export const guestSession = {
  isGuest: true,
  displayName: "Alex",
  level: 14,
  levelLabel: "Explorer",
  kp: 1840,
  coins: 420,
  streakDays: 7,
  streakTargetDays: 10,
  streakLocked: true,
  velocityKpPerHr: 180,
  velocityPeakPercent: 18,
  dailyDirectives: {
    completed: 2,
    total: 3,
    resetsInLabel: "06h 44m",
    items: [
      { id: "d1", label: "Solve 1 Vector Equilibrium equation", state: "done", rewardLabel: "+60 KP claimed" },
      { id: "d2", label: "Run 3 fluid Reynolds simulations", state: "done", rewardLabel: "+80 KP claimed" },
      {
        id: "d3",
        label: "Complete 1 Perfect Resonance Test",
        state: "active",
        rewardLabel: "Current: 0/1 • Reward: +120 KP & 15 Crystals",
      },
    ],
  },
  league: {
    name: "3-Day Quantum Sprint League",
    division: "Division IV",
    rank: 4,
    kp: 1840,
    kpToPromotion: 45,
    closesInLabel: "18:22:09",
  },
  streakBoost: {
    active: true,
    title: "Hyperfocus Surge Activated: 3-in-a-row Perfect Solves!",
    detail: "Double KP modifier unlocked for the next 42 minutes.",
    multiplierLabel: "2.0x Boost",
    claimLabel: "Claim 50 KP",
  },
  quoteOfTheDay: {
    text: "The most incomprehensible thing about the world is that it is comprehensible.",
    author: "Albert Einstein",
  },
  suggestedSubjects: [
    {
      id: "chemistry",
      name: "Molecular Chemistry",
      tagLabel: "DEPLOYING Q3",
      tagStyle: "purple",
      description: "Reaction Kinetics & Hybridization. Orbital wave functions and enzymatic catalysts.",
      prerequisite: "Classical Physics",
    },
    {
      id: "biology",
      name: "Evolutionary Biology",
      tagLabel: "IN PIPELINE",
      tagStyle: "neutral",
      description: "CRISPR Splicing & Population Genetics. Stochastic allele frequency drift algorithms.",
      prerequisite: "None",
    },
    {
      id: "history",
      name: "Macro History & Geopolitics",
      tagLabel: "IN RESEARCH",
      tagStyle: "neutral",
      description: "Logistics & Civilizational Dynamics. Maritime choke points and energy transmission networks.",
      prerequisite: "Quantitative Econ",
    },
    {
      id: "geography",
      name: "Geophysical Geography",
      tagLabel: "ARCHITECTURE STAGE",
      tagStyle: "neutral",
      description: "Tectonic Stress & Climatology. Atmospheric heat transfer models and oceanic conveyor currents.",
      prerequisite: "Fluid Mechanics",
    },
  ],
};

export default guestSession;
