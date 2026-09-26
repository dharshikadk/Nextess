import React, { useState } from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';

interface MissionChamberViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onAwardKP: (amount: number) => void;
  onShowToast: (msg: string) => void;
}

interface ChallengeItem {
  id: number;
  questionNumber: number;
  category: string;
  kpReward: number;
  title: string;
  problem: string;
  formulaHint: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
    subtext: string;
  }[];
  correctKey: 'A' | 'B' | 'C' | 'D' | 'E';
  explanationSuccess: string;
  explanationFailure: string;
  initialWind: number;
  initialDamper: number;
  initialTension: number;
}

interface LevelConfig {
  levelNumber: number;
  levelTitle: string;
  subtitle: string;
  challenges: ChallengeItem[];
}

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    levelNumber: 1,
    levelTitle: 'Vortex Shedding & Wind Vectors',
    subtitle: 'Airfoil Fluid Dynamics & Fundamental Frequencies',
    challenges: [
      {
        id: 101,
        questionNumber: 1,
        category: 'Boundary Layer Inception',
        kpReward: 15,
        title: 'At an initial laminar crosswind velocity of 18 m/s with deck width D = 18.4 m, what is the initial shedding frequency f_s when St = 0.21?',
        problem: 'Compute vortex frequency f_s = (St · V) / D to ensure safety from baseline natural frequency 2.12 Hz.',
        formulaHint: 'f_s = (St · V) / D',
        options: [
          { key: 'A', text: 'f_s = 0.82 Hz', subtext: 'Harmonic overtone near modal coupling limit' },
          { key: 'B', text: 'f_s = 0.21 Hz', subtext: 'Under-calculated Strouhal boundary value' },
          { key: 'C', text: 'f_s = 0.41 Hz (Safe from baseline 2.12 Hz)', subtext: 'Decoupled from primary deck torsion mode' },
          { key: 'D', text: 'f_s = 1.65 Hz', subtext: 'Exceeds linear laminar flow assumption' },
          { key: 'E', text: 'f_s = 2.40 Hz', subtext: 'Violates Strouhal scaling parameter' },
        ],
        correctKey: 'C',
        explanationSuccess: 'Correct! At 18 m/s, f_s = (0.21 · 18) / 18.4 = 0.41 Hz, well below structural natural frequency (2.12 Hz).',
        explanationFailure: 'Calculation mismatch. Check f_s = (0.21 · 18) / 18.4. Value must be 0.41 Hz.',
        initialWind: 18,
        initialDamper: 100000,
        initialTension: 3200,
      },
      {
        id: 102,
        questionNumber: 2,
        category: 'Wind Vector Divergence',
        kpReward: 20,
        title: 'When wind accelerates from 18 m/s to 32 m/s, how does aerodynamic lift coefficient C_L behave on a bluff rectangular bridge deck?',
        problem: 'Analyze aerodynamic drag factor and vortex shedding lock-in threshold.',
        formulaHint: 'L = 0.5 · ρ · V² · A · C_L',
        options: [
          { key: 'A', text: 'Decreases linearly to zero', subtext: 'Flow separation prevents zero lift' },
          { key: 'B', text: 'Increases quadratically with V², amplifying periodic shear oscillations', subtext: 'Vortex shedding induces periodic cross-flow lift excitation' },
          { key: 'C', text: 'Remains static regardless of Reynolds number', subtext: 'Ignores turbulent boundary layer detachment' },
          { key: 'D', text: 'Inverts sign with 90° phase shift', subtext: 'Phase lag only occurs at resonance point' },
          { key: 'E', text: 'Decouples from deck mass completely', subtext: 'Coupling persists via aeroelastic feedback' },
        ],
        correctKey: 'B',
        explanationSuccess: 'Spot on! Aerodynamic dynamic pressure scales with V², so lift forces multiply rapidly with airspeed.',
        explanationFailure: 'Incorrect. Dynamic lift scales as V² with periodic alternating vortex vortices shed from upper and lower deck edges.',
        initialWind: 32,
        initialDamper: 110000,
        initialTension: 3300,
      },
      {
        id: 103,
        questionNumber: 3,
        category: 'Stiffness & Tension Analysis',
        kpReward: 25,
        title: 'When cable tension drops from 3,400 kN to 1,800 kN, how does the modal natural frequency ω_0 respond?',
        problem: 'Evaluate modal equation ω_0 = √(k / m) under reduced cable stiffness.',
        formulaHint: 'ω_0 = √(k / m)',
        options: [
          { key: 'A', text: 'Natural frequency shifts upward to 3.2 Hz', subtext: 'Stiffness reduction decreases frequency, not increases' },
          { key: 'B', text: 'Natural frequency drops proportional to √T, shifting closer to low-frequency vortex shedding', subtext: 'Drop in tension drops stiffness k, bringing ω_0 down into dangerous wind excitation bands' },
          { key: 'C', text: 'Torsional stiffness increases due to slack cable elasticity', subtext: 'Violates beam elasticity mechanics' },
          { key: 'D', text: 'Damping coefficient automatically doubles', subtext: 'Structural damping is independent of cable tension' },
          { key: 'E', text: 'Phase angle shifts by 180 degrees without structural impact', subtext: 'Phase lag without stiffness change is non-physical' },
        ],
        correctKey: 'B',
        explanationSuccess: 'Accurate! Decreasing cable tension lowers effective stiffness k, bringing the natural frequency down into the excitation zone.',
        explanationFailure: 'Incorrect. ω_0 is proportional to √(k/m). When tension drops, k drops, causing ω_0 to fall closer to wind vortex frequencies.',
        initialWind: 35,
        initialDamper: 120000,
        initialTension: 1800,
      },
      {
        id: 104,
        questionNumber: 4,
        category: 'Lock-in Resonance Band',
        kpReward: 25,
        title: 'What critical wind velocity triggers vortex shedding lock-in with the primary 2.12 Hz modal frequency?',
        problem: 'Solve for V in 2.12 = (0.21 · V) / 18.4.',
        formulaHint: 'V_crit = (f · D) / St',
        options: [
          { key: 'A', text: 'V_crit = 185.7 m/s', subtext: 'Decimal point scaling error' },
          { key: 'B', text: 'V_crit = 82.4 m/s', subtext: 'Calculated using inverse Strouhal number' },
          { key: 'C', text: 'V_crit = 45.8 m/s (Tacoma Narrows Critical Velocity Band)', subtext: 'V = (2.12 · 18.4) / 0.21 ≈ 45.8 m/s' },
          { key: 'D', text: 'V_crit = 28.2 m/s', subtext: 'Sub-critical boundary speed' },
          { key: 'E', text: 'V_crit = 12.0 m/s', subtext: 'Low breeze velocity' },
        ],
        correctKey: 'C',
        explanationSuccess: 'Exceptional deduction! V_crit = (2.12 · 18.4) / 0.21 ≈ 45.8 m/s. This matches the exact Tacoma gale threshold!',
        explanationFailure: 'Check the calculation: V = (2.12 · 18.4) / 0.21 = 45.8 m/s.',
        initialWind: 46,
        initialDamper: 130000,
        initialTension: 3400,
      },
      {
        id: 105,
        questionNumber: 5,
        category: 'Level 1 Mastery Verification',
        kpReward: 30,
        title: 'Which preventative modification best insulates the bridge deck against vortex lock-in prior to installing tuned dampers?',
        problem: 'Evaluate aerodynamic streamlining and deck spoiler fairings.',
        formulaHint: 'Reduce Strouhal vortex coherence with aerodynamic edge vanes',
        options: [
          { key: 'A', text: 'Add solid windbreak walls along the pedestrian walkways', subtext: 'Increases wind drag area and worsens turbulence' },
          { key: 'B', text: 'Install aerodynamic edge fairings and open-grate center deck slots', subtext: 'Disrupts vortex vortex coherence and equalizes pressure differentials' },
          { key: 'C', text: 'Loosen stay cables to decouple tower vibrations', subtext: 'Causes catastrophic modal slack' },
          { key: 'D', text: 'Paint the bridge deck with low-friction polymer', subtext: 'Surface paint has negligible effect on macro vortex shedding' },
          { key: 'E', text: 'Increase deck mass with lead ballast without damping', subtext: 'Lowers frequency without dissipating energy' },
        ],
        correctKey: 'B',
        explanationSuccess: 'Level 1 Cleared with Distinction! Open-grate center slots and edge fairings break up coherent vortex shedding across the deck span.',
        explanationFailure: 'Incorrect. Aerodynamic edge fairings and center grates reduce pressure differentials, preventing coherent vortex lock-in.',
        initialWind: 45,
        initialDamper: 140000,
        initialTension: 3500,
      },
    ],
  },
  2: {
    levelNumber: 2,
    levelTitle: 'Dynamic Harmonic Damping & Mass Dampers',
    subtitle: 'Tacoma Aeroelastic Flutter Calibration & TMD Sizing',
    challenges: [
      {
        id: 201,
        questionNumber: 1,
        category: 'Modal Mass Evaluation',
        kpReward: 15,
        title: 'For an 850m suspension bridge deck of total mass 4,200,000 kg, what is the standard recommended Tuned Mass Damper (TMD) mass ratio μ?',
        problem: 'Standard structural dynamics recommend a mass ratio between 2.5% and 4.0% of the effective modal mass.',
        formulaHint: 'μ = m_tmd / M_modal (target ~3.3%)',
        options: [
          { key: 'A', text: '0.1% (4,200 kg) — minimal inertia', subtext: 'Insufficient inertia to dissipate modal kinetic energy' },
          { key: 'B', text: '1.0% (42,000 kg) — lightweight damping', subtext: 'Below critical damping threshold' },
          { key: 'C', text: '3.3% (140,000 kg) — optimal modal dissipation', subtext: 'Maximizes energy absorption bandwidth without overloading pylons' },
          { key: 'D', text: '15.0% (630,000 kg) — heavy counter-weight', subtext: 'Exceeds structural dead load safety allowance' },
          { key: 'E', text: '50.0% (2,100,000 kg) — equal inertia', subtext: 'Severely over-stresses anchor cables' },
        ],
        correctKey: 'C',
        explanationSuccess: 'Correct! 3.3% modal mass (~140,000 kg) provides the ideal damping ratio ζ ≈ 0.05 without excessive dead load penalty.',
        explanationFailure: 'Incorrect. Effective TMD systems use 2.5%–4.0% modal mass (≈140,000 kg for this bridge).',
        initialWind: 38,
        initialDamper: 140000,
        initialTension: 3400,
      },
      {
        id: 202,
        questionNumber: 2,
        category: 'TMD Natural Frequency Tuning',
        kpReward: 20,
        title: 'To achieve optimal Den Hartog harmonic suppression at baseline frequency f_bridge = 2.12 Hz with μ = 0.033, what should the TMD frequency f_tmd be tuned to?',
        problem: 'Den Hartog tuning ratio: f_opt = 1 / (1 + μ).',
        formulaHint: 'f_tmd = f_bridge / (1 + μ)',
        options: [
          { key: 'A', text: 'f_tmd = 3.45 Hz', subtext: 'Far above bridge natural frequency' },
          { key: 'B', text: 'f_tmd = 2.05 Hz (f_bridge / 1.033)', subtext: 'Den Hartog optimum: splits the resonance peak into two equal damped lobes' },
          { key: 'C', text: 'f_tmd = 1.00 Hz', subtext: 'Severely under-tuned damper' },
          { key: 'D', text: 'f_tmd = 2.12 Hz (Exact parity)', subtext: 'Exact resonance parity causes peak amplification without optimal splitting' },
          { key: 'E', text: 'f_tmd = 0.00 Hz (Fixed lock)', subtext: 'Rigid attachment eliminates relative damping motion' },
        ],
        correctKey: 'B',
        explanationSuccess: 'Spot on! By Den Hartog’s formula, f_tmd = 2.12 / 1.033 ≈ 2.05 Hz, cleanly splitting the resonant peak into two damped lobes.',
        explanationFailure: 'Remember Den Hartog’s rule: f_tmd = f_bridge / (1 + μ) = 2.12 / 1.033 ≈ 2.05 Hz.',
        initialWind: 42,
        initialDamper: 140000,
        initialTension: 3400,
      },
      {
        id: 203,
        questionNumber: 3,
        category: 'Aeroelastic Resonance Inquiry',
        kpReward: 25,
        title: 'Under a simulated crosswind velocity of 45 m/s, which tuned mass damper configuration prevents resonant frequency crossover?',
        problem: 'Evaluate the vortex shedding formula f = (St · V) / D against the baseline natural bridge deck frequency of 2.12 Hz.',
        formulaHint: 'f = (St · V) / D ; ζ = c / (2√(k·m))',
        options: [
          { key: 'A', text: 'Damper mass = 80,000 kg with spring stiffness k = 1.4 MN/m', subtext: 'ω_tmd = 4.18 rad/s (Damping ratio ζ = 0.015)' },
          { key: 'B', text: 'Zero-mass counter-weight with rigid hydraulic locks', subtext: 'Locks bridge deck into purely elastic shear displacement' },
          { key: 'C', text: 'Tuned mass = 140,000 kg with dynamic damping ratio ζ = 0.052', subtext: 'Decouples peak at 2.12 Hz; shifts response envelope below 1.65 Hz' },
          { key: 'D', text: 'Continuous fluid viscous damper across deck spans 1 through 6', subtext: 'Increases aerodynamic drag factor C_d to 1.84' },
          { key: 'E', text: 'Tuned mass = 25,000 kg placed only at suspension anchor pier base', subtext: 'Insufficient modal inertia ratio (< 0.6% total deck mass)' },
        ],
        correctKey: 'C',
        explanationSuccess: 'The 140,000 kg damper with dynamic damping ratio ζ = 0.052 absorbs vortex energy before harmonic crossover at 2.12 Hz occurs. Bridge cable integrity maintained.',
        explanationFailure: 'Configuration does not supply enough counter-inertial modal mass. Bridge oscillation amplitude surged past safety threshold (+3.4 Hz).',
        initialWind: 45,
        initialDamper: 140000,
        initialTension: 3400,
      },
      {
        id: 204,
        questionNumber: 4,
        category: 'Critical Damping Ratio Calibration',
        kpReward: 25,
        title: 'If wind velocity accelerates to 65 m/s, what minimum damper mass is required to maintain damping ratio ζ ≥ 0.05?',
        problem: 'Compute damping ratio ζ = damperMass / 2,700,000 to prevent runaway flutter bifurcation.',
        formulaHint: 'ζ = damperMass / 2,700,000 ≥ 0.05',
        options: [
          { key: 'A', text: '95,000 kg (ζ = 0.035)', subtext: 'Under-damped: flutter threshold exceeded' },
          { key: 'B', text: '135,000 kg to 140,000 kg (ζ = 0.050 to 0.052)', subtext: 'Meets minimum critical damping criteria for high wind gusts' },
          { key: 'C', text: '50,000 kg (ζ = 0.018)', subtext: 'Immediate catastrophic torsion' },
          { key: 'D', text: '210,000 kg (ζ = 0.078)', subtext: 'Overdamped: transfers excessive shear into cable anchor nodes' },
          { key: 'E', text: 'Zero mass with active electromagnets', subtext: 'Power failure risks immediate collapse' },
        ],
        correctKey: 'B',
        explanationSuccess: 'Correct! 135,000 kg yields ζ = 135,000 / 2,700,000 = 0.050, satisfying the minimum threshold against high-velocity gale flutter.',
        explanationFailure: 'Incorrect. Damper mass must be at least 135,000 kg (135,000 / 2,700,000 = 0.05) to ensure stability.',
        initialWind: 65,
        initialDamper: 135000,
        initialTension: 3600,
      },
      {
        id: 205,
        questionNumber: 5,
        category: 'Torsional Flutter Cancellation',
        kpReward: 30,
        title: 'To guarantee zero aeroelastic divergence across turbulent hurricane gusts (V > 70 m/s), what combined system configuration must be deployed?',
        problem: 'Evaluate Safety Factor S_f = (Tension / 3000) · (Mass / 100000) · (50 / V).',
        formulaHint: 'S_f ≥ 1.0 under V = 70 m/s',
        options: [
          { key: 'A', text: 'Remove TMD and stiffen main cable tension only', subtext: 'High stiffness without damping causes brittle fatigue' },
          { key: 'B', text: 'Dual-axis 140,000 kg TMD + maintain cable tension ≥ 3,400 kN', subtext: 'Suppresses both vertical flexure and torsional twisting modes simultaneously' },
          { key: 'C', text: 'Lock deck bearings rigidly to concrete pylons', subtext: 'Thermal expansion destroys the bearing expansion joints' },
          { key: 'D', text: 'Reduce deck tension below 1,000 kN to allow aeroelastic swaying', subtext: 'Severe cable slack causes immediate divergent flutter' },
          { key: 'E', text: 'Increase wind surface area using solid aerodynamic fairings', subtext: 'Multiplies crosswind lateral drag force' },
        ],
        correctKey: 'B',
        explanationSuccess: 'Level 2 Mastered! Dual-axis tuned mass damping combined with calibrated stay tension provides an unconditional safety envelope against divergent aeroelastic flutter.',
        explanationFailure: 'Incorrect. Dual-axis 140,000 kg TMD with cable tension ≥ 3,400 kN decouples both torsional and vertical wave harmonics.',
        initialWind: 72,
        initialDamper: 140000,
        initialTension: 3800,
      },
    ],
  },
  3: {
    levelNumber: 3,
    levelTitle: 'Crosswind Velocity & Torsional Flutter',
    subtitle: 'Multi-axis Bridge Torsion Simulation & Divergence Factor',
    challenges: [
      {
        id: 301,
        questionNumber: 1,
        category: 'Torsional Divergence Angle',
        kpReward: 20,
        title: 'When torsional divergence angle θ exceeds 4.2°, what structural component suffers the greatest non-linear shear stress?',
        problem: 'Analyze cross-girder torque and hanger wire stress distribution.',
        formulaHint: 'τ = T_torque · r / J',
        options: [
          { key: 'A', text: 'Mid-span cable hanger connections (Node 14)', subtext: 'Undergoes extreme cyclic angular shear stress' },
          { key: 'B', text: 'Pylon concrete footings', subtext: 'Deep subterranean foundation absorbs compressive load only' },
          { key: 'C', text: 'Asphalt road surface layer', subtext: 'Non-structural wear layer' },
          { key: 'D', text: 'Center dividing crash barrier', subtext: 'Isolated non-structural element' },
          { key: 'E', text: 'Navigation lights at mast top', subtext: 'Negligible structural load' },
        ],
        correctKey: 'A',
        explanationSuccess: 'Correct! Node 14 mid-span cable hangers experience maximum torsional deformation during harmonic divergence.',
        explanationFailure: 'Incorrect. The mid-span hanger connections at node 14 absorb the highest localized angular twisting force.',
        initialWind: 50,
        initialDamper: 140000,
        initialTension: 3400,
      },
      {
        id: 302,
        questionNumber: 2,
        category: 'Aeroelastic Flutter Boundary',
        kpReward: 25,
        title: 'What separates vortex-induced vibration (VIV) from catastrophic aeroelastic flutter?',
        problem: 'Distinguish between self-limiting VIV and self-excited divergent flutter.',
        formulaHint: 'VIV is amplitude-limited; flutter is divergent self-excited instability',
        options: [
          { key: 'A', text: 'VIV only occurs at sub-zero temperatures', subtext: 'Thermal state has negligible effect on aeroelastic mechanics' },
          { key: 'B', text: 'VIV is self-limiting in amplitude; flutter feeds kinetic energy from the wind into unbounded divergent growth', subtext: 'Flutter extracts energy from airflow proportional to twisting amplitude' },
          { key: 'C', text: 'Flutter only affects suspension cables, not bridge decks', subtext: 'Flutter is primarily a deck torsional phenomenon' },
          { key: 'D', text: 'There is no physical difference', subtext: 'They are fundamentally distinct mathematical regimes' },
          { key: 'E', text: 'VIV requires tuned mass dampers to initiate', subtext: 'Dampers suppress vibrations, not initiate them' },
        ],
        correctKey: 'B',
        explanationSuccess: 'Brilliant! VIV is self-limiting because vortex shedding decouples as amplitude grows, whereas flutter is self-excited and rapidly divergent.',
        explanationFailure: 'Incorrect. VIV is self-limiting in amplitude, while flutter extracts energy directly from the wind stream, causing unbounded divergence.',
        initialWind: 55,
        initialDamper: 145000,
        initialTension: 3500,
      },
      {
        id: 303,
        questionNumber: 3,
        category: 'Multi-mode Interaction',
        kpReward: 25,
        title: 'When vertical bending frequency (1.65 Hz) coalesces with torsional frequency (2.12 Hz), what critical phenomenon occurs?',
        problem: 'Analyze classical 2-degree-of-freedom flutter coalescence.',
        formulaHint: 'Frequency coalescence ω_torsion ≈ ω_bending → Classical Flutter',
        options: [
          { key: 'A', text: 'Harmonic dampening self-cancels completely', subtext: 'Coalescence exacerbates instability' },
          { key: 'B', text: 'Classical 2-DOF flutter occurs with rapid phase-locked energy transfer', subtext: 'Bending and twisting motions feed each other in destructive synergy' },
          { key: 'C', text: 'Cable tension drops to 0 kN instantaneously', subtext: 'Tension fluctuates wildly rather than dropping to zero' },
          { key: 'D', text: 'Wind velocity drops to zero behind the deck', subtext: 'Wake turbulence remains vigorous' },
          { key: 'E', text: 'The bridge deck acts as a passive shock absorber', subtext: 'The deck is the excited oscillator' },
        ],
        correctKey: 'B',
        explanationSuccess: 'Superb! Classical flutter arises when bending and torsional frequencies merge, driving exponential amplitude growth.',
        explanationFailure: 'Incorrect. When bending and torsional frequencies coalesce, 2-DOF classical flutter occurs with destructive energy transfer.',
        initialWind: 58,
        initialDamper: 150000,
        initialTension: 3600,
      },
      {
        id: 304,
        questionNumber: 4,
        category: 'Damper Viscous Coefficient Calibration',
        kpReward: 30,
        title: 'To decouple coalescing modes, what damper viscous damping coefficient c is required when m = 140,000 kg and k = 2.4 MN/m?',
        problem: 'Compute c = 2 · ζ · √(k · m) with target ζ = 0.055.',
        formulaHint: 'c = 2 · ζ · √(k · m)',
        options: [
          { key: 'A', text: 'c ≈ 25,000 N·s/m', subtext: 'Under-damped by factor of two' },
          { key: 'B', text: 'c ≈ 63,800 N·s/m', subtext: '2 · 0.055 · √(2,400,000 · 140,000) ≈ 63,770 N·s/m' },
          { key: 'C', text: 'c ≈ 250,000 N·s/m', subtext: 'Overly stiff hydraulic resistance' },
          { key: 'D', text: 'c ≈ 2,000 N·s/m', subtext: 'Inconsequential resistance' },
          { key: 'E', text: 'c ≈ 0 N·s/m', subtext: 'Undamped spring oscillator' },
        ],
        correctKey: 'B',
        explanationSuccess: 'Precise calculation! c = 2 · 0.055 · √(2.4e6 · 1.4e5) ≈ 63,800 N·s/m provides optimal viscous damping.',
        explanationFailure: 'Check formula: c = 2 · 0.055 · √(2,400,000 · 140,000) ≈ 63,800 N·s/m.',
        initialWind: 60,
        initialDamper: 140000,
        initialTension: 3700,
      },
      {
        id: 305,
        questionNumber: 5,
        category: 'Level 3 Mastery Synthesis',
        kpReward: 35,
        title: 'Which final validation ensures structural clearance for Level 3 research certification?',
        problem: 'Validate safety margin SF > 1.2 at V = 60 m/s with tuned mass damper operational.',
        formulaHint: 'Verified Safety Factor SF ≥ 1.25 across all 3 axes',
        options: [
          { key: 'A', text: 'Zero damping with rigid truss retrofit', subtext: 'Weight penalty too severe' },
          { key: 'B', text: 'Multi-axis TMD + c = 63,800 N·s/m maintaining SF ≥ 1.25 under maximum gale', subtext: 'Complete suppression of modal coalescence' },
          { key: 'C', text: 'Lowering bridge speed limit to 20 km/h', subtext: 'Vehicle speed does not stop wind-induced flutter' },
          { key: 'D', text: 'Removing expansion joints completely', subtext: 'Thermal stress will fracture deck' },
          { key: 'E', text: 'Flooding ballast tanks with salt water', subtext: 'Corrosive and uncontrolled dead weight' },
        ],
        correctKey: 'B',
        explanationSuccess: 'Level 3 Cleared! Multi-axis TMD calibrated with viscous coefficient c ≈ 63,800 N·s/m guarantees an unconditional safety margin SF ≥ 1.25.',
        explanationFailure: 'Incorrect. Multi-axis TMD with c = 63,800 N·s/m is required to secure SF ≥ 1.25.',
        initialWind: 62,
        initialDamper: 140000,
        initialTension: 3700,
      },
    ],
  },
};

export const MissionChamberView: React.FC<MissionChamberViewProps> = ({
  theme,
  stats,
  onNavigate,
  onAwardKP,
  onShowToast,
}) => {
  const isDark = theme === 'dark';

  // Navigation State: Levels and Challenges
  const [currentLevel, setCurrentLevel] = useState<number>(2);
  const [currentChallenge, setCurrentChallenge] = useState<number>(3);

  // Active level and challenge data
  const activeLevelConfig = LEVEL_CONFIGS[currentLevel] || LEVEL_CONFIGS[2];
  const challengeIndex = Math.max(0, Math.min(activeLevelConfig.challenges.length - 1, currentChallenge - 1));
  const activeChallenge = activeLevelConfig.challenges[challengeIndex];

  // User input & evaluation state
  const [activeDossierTab, setActiveDossierTab] = useState<'telemetry' | 'spec'>('telemetry');
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('C');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(true);

  // Live simulation sliders (initialized from active challenge)
  const [windVelocity, setWindVelocity] = useState<number>(activeChallenge.initialWind || 45);
  const [damperMass, setDamperMass] = useState<number>(activeChallenge.initialDamper || 140000);
  const [deckTension, setDeckTension] = useState<number>(activeChallenge.initialTension || 3400);

  // Track completed challenges for score/checkmarks
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({
    '2-1': true,
    '2-2': true,
  });

  // Switch challenge handler (Navigates between challenges smoothly)
  const handleSelectChallenge = (questionNum: number) => {
    setCurrentChallenge(questionNum);
    setSubmitted(false);
    setSelectedOption('C');
    const newChallenge = activeLevelConfig.challenges[questionNum - 1];
    if (newChallenge) {
      setWindVelocity(newChallenge.initialWind);
      setDamperMass(newChallenge.initialDamper);
      setDeckTension(newChallenge.initialTension);
    }
  };

  // Back button handler: Navigates before the current challenge!
  const handlePrevChallenge = () => {
    if (currentChallenge > 1) {
      handleSelectChallenge(currentChallenge - 1);
      onShowToast(`Navigated back to Challenge ${currentChallenge - 1}`);
    } else if (currentLevel > 1) {
      // Navigate before the challenge to previous level's last challenge
      const prevLevel = currentLevel - 1;
      setCurrentLevel(prevLevel);
      setCurrentChallenge(5);
      setSubmitted(false);
      onShowToast(`Navigated back to Level ${prevLevel} (Challenge 5)`);
    } else {
      // When at Level 1, Challenge 1, navigate back to mission structure / overview
      onNavigate('mission-detail');
      onShowToast('Navigated back to Mission Structure.');
    }
  };

  // Next challenge handler
  const handleNextChallenge = () => {
    if (currentChallenge < 5) {
      handleSelectChallenge(currentChallenge + 1);
      onShowToast(`Advanced to Challenge ${currentChallenge + 1}`);
    } else if (currentLevel < 3) {
      setCurrentLevel(currentLevel + 1);
      setCurrentChallenge(1);
      setSubmitted(false);
      onShowToast(`Level ${currentLevel} Complete! Advanced to Level ${currentLevel + 1}`);
    } else {
      onShowToast('Apex Level Complete! Proceeding to Mission Certification.');
      onNavigate('mission-detail');
    }
  };

  // Switch level handler
  const handleSelectLevel = (lvl: number) => {
    setCurrentLevel(lvl);
    setCurrentChallenge(1);
    setSubmitted(false);
    setSelectedOption('C');
    const newLvl = LEVEL_CONFIGS[lvl] || LEVEL_CONFIGS[2];
    if (newLvl.challenges[0]) {
      setWindVelocity(newLvl.challenges[0].initialWind);
      setDamperMass(newLvl.challenges[0].initialDamper);
      setDeckTension(newLvl.challenges[0].initialTension);
    }
    onShowToast(`Switched to Level ${lvl}: ${newLvl.levelTitle}`);
  };

  // Compute live physics feedback
  const vortexFreq = ((0.21 * windVelocity) / 18.4) * 4; // scaled harmonic
  const dampingRatio = damperMass / 2700000;
  const isResonanceZone = Math.abs(vortexFreq - 2.12) < 0.6 && damperMass < 120000;
  const safetyFactor = Math.max(
    0.2,
    Number(((deckTension / 3000) * (damperMass / 100000) * (50 / windVelocity)).toFixed(2))
  );

  const handleSubmit = () => {
    setSubmitted(true);
    if (selectedOption === activeChallenge.correctKey) {
      setIsCorrect(true);
      onAwardKP(activeChallenge.kpReward);
      setCompletedChallenges((prev) => ({
        ...prev,
        [`${currentLevel}-${currentChallenge}`]: true,
      }));
      onShowToast(`🎉 Challenge Cleared! +${activeChallenge.kpReward} KP awarded!`);
    } else {
      setIsCorrect(false);
      onShowToast('⚠️ Resonance Alert! Configuration failed safety verification.');
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
  };

  const handleRevealAnswer = () => {
    onShowToast(
      `Instructor Note (-15 🪙): Option ${activeChallenge.correctKey} is correct. ${activeChallenge.explanationSuccess}`
    );
  };

  const handleConceptCapsule = () => {
    setActiveDossierTab('spec');
    onShowToast('Switched to Damping_Coefficients.spec (-10 🪙)');
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Top Header HUD with Back Button, Level Switcher, and Question Tracker */}
      <div
        className={`w-full px-4 py-3 mb-5 rounded-2xl border shadow-xl flex flex-wrap items-center justify-between gap-y-3 transition-colors ${
          isDark
            ? 'bg-[#12131b] border-violet-500/25 text-slate-200'
            : 'bg-white border-slate-200 text-slate-800 shadow-md'
        }`}
      >
        {/* Left Side: Back Navigation Buttons */}
        <div className="flex items-center gap-3">
          {/* Main Exit / Back to Mission Path */}
          <button
            onClick={() => onNavigate('mission-detail')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all group ${
              isDark
                ? 'bg-[#181926] text-slate-300 hover:text-white hover:bg-[#1f2030] border-violet-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
            title="Exit to mission detail ladder overview"
          >
            <span className="material-symbols-outlined text-[18px] text-violet-400 group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span>Mission Path</span>
          </button>

          {/* Dedicated Back Button in Every Level (Navigates before current challenge) */}
          <button
            onClick={handlePrevChallenge}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              isDark
                ? 'bg-violet-600/20 text-violet-300 border-violet-500/40 hover:bg-violet-600 hover:text-white'
                : 'bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-600 hover:text-white'
            }`}
            title="Navigate before this challenge"
          >
            <span className="material-symbols-outlined text-[16px]">west</span>
            <span>{currentChallenge > 1 ? `Back to Q${currentChallenge - 1}` : 'Back Before Q1'}</span>
          </button>

          <div className="h-6 w-px bg-slate-700/30 hidden sm:block" />

          {/* Level Badge & Switcher */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-violet-600/25 border border-violet-400/40 text-violet-300 font-mono text-[10px] uppercase font-bold tracking-wider">
                Mission 01
              </span>
              <span className={`font-headline-sm text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Level {currentLevel}: {activeLevelConfig.levelTitle}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handleSelectLevel(lvl)}
                  className={`text-[10px] font-mono px-2 py-0.2 rounded transition-all ${
                    currentLevel === lvl
                      ? 'bg-violet-600 text-white font-bold'
                      : isDark
                      ? 'text-slate-400 hover:text-white bg-[#181926]'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  Lvl {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Interactive Question Step Tracker (Clickable to jump to any challenge) */}
        <div
          className={`flex items-center gap-3 px-4 py-1.5 rounded-full border shadow-inner ${
            isDark ? 'bg-[#07080c] border-violet-500/20' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <span className="font-mono text-xs text-slate-400">
            Question <strong className="text-violet-400">{currentChallenge}</strong> of 5
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((qNum) => {
              const isDone = completedChallenges[`${currentLevel}-${qNum}`];
              const isCurrent = currentChallenge === qNum;

              return (
                <button
                  key={qNum}
                  onClick={() => handleSelectChallenge(qNum)}
                  title={`Go to Question ${qNum}`}
                  className={`transition-all flex items-center justify-center cursor-pointer ${
                    isCurrent
                      ? 'w-8 h-3 rounded-full bg-violet-400 animate-pulse shadow-[0_0_10px_rgba(167,139,250,0.9)] ring-2 ring-violet-500'
                      : isDone
                      ? 'w-6 h-3 rounded-full bg-violet-600 text-white shadow-xs'
                      : 'w-6 h-3 rounded-full bg-slate-700/30 hover:bg-slate-600/50'
                  }`}
                >
                  {isDone && !isCurrent && (
                    <span className="material-symbols-outlined text-[9px] text-white font-bold">check</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Gamification Stakes & Next Button */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${
              isDark ? 'bg-[#181926] border-violet-500/25 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-800'
            }`}
          >
            <span className="material-symbols-outlined text-violet-400 text-[18px]">bolt</span>
            <span className="font-mono text-xs font-bold">+{activeChallenge.kpReward} KP</span>
          </div>

          {currentChallenge < 5 && (
            <button
              onClick={handleNextChallenge}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isDark
                  ? 'bg-[#181926] text-slate-300 border-violet-500/20 hover:text-white hover:bg-[#1f2030]'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Synchronized Core Panels: Files (25%) | Question Solving (40%) | Live Simulation (35%) */}
      <div className="grid grid-cols-12 gap-5 w-full items-start">
        {/* PANEL 1: Mission Files & Reference Dossier (25% / 3 cols) */}
        <div
          className={`col-span-12 lg:col-span-3 flex flex-col gap-3 p-4 rounded-2xl border shadow-xl ${
            isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 pb-1">
            <span className="material-symbols-outlined text-violet-400 text-[20px]">folder_open</span>
            <span className={`font-headline-sm text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Resource Files
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border text-xs leading-relaxed ${
              isDark ? 'bg-[#181926] border-violet-500/15 text-slate-300' : 'bg-violet-50/70 border-violet-200 text-slate-700'
            }`}
          >
            Oscillations exceeding <strong className="text-rose-400 font-mono">2.4 Hz</strong> trigger destructive aeroelastic flutter. Cables at node 14 risk catastrophic structural shear.
          </div>

          {/* File Navigation Tabs */}
          <div className={`flex gap-1 p-1 rounded-xl border ${isDark ? 'bg-[#07080c] border-violet-500/15' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => setActiveDossierTab('telemetry')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeDossierTab === 'telemetry'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">table_chart</span>
              <span>Telemetry.csv</span>
            </button>
            <button
              onClick={() => setActiveDossierTab('spec')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                activeDossierTab === 'spec'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">architecture</span>
              <span>Coefficients.spec</span>
            </button>
          </div>

          {/* Tab 1: Telemetry Data */}
          {activeDossierTab === 'telemetry' && (
            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 ${
                isDark ? 'bg-[#07080c] border-violet-500/15' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Live Force Telemetry (Node 14)
                </span>
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700/30">
                      <th className="py-1">Freq (Hz)</th>
                      <th className="py-1">Load (kN)</th>
                      <th className="py-1 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent">
                    <tr>
                      <td className="py-1 font-semibold">0.85</td>
                      <td className="py-1 text-slate-400">124.2</td>
                      <td className="py-1 text-right text-emerald-400 font-medium">Nominal</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold">1.40</td>
                      <td className="py-1 text-slate-400">310.8</td>
                      <td className="py-1 text-right text-emerald-400 font-medium">Stable</td>
                    </tr>
                    <tr className={isDark ? 'bg-[#181926]/70' : 'bg-amber-100/50'}>
                      <td className="py-1 font-bold text-amber-500">1.95</td>
                      <td className="py-1 text-amber-500">842.1</td>
                      <td className="py-1 text-right text-amber-500">Warning</td>
                    </tr>
                    <tr className="bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30">
                      <td className="py-1 font-bold text-rose-500">2.42</td>
                      <td className="py-1 text-rose-500">1,890.4</td>
                      <td className="py-1 text-right text-rose-500">RESONANCE</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                className={`p-2 rounded-lg border font-mono text-[10px] leading-relaxed ${
                  isDark ? 'bg-[#181926] border-violet-500/20 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <strong className="text-violet-400">Formula Note:</strong>{' '}
                <span className="font-bold">ω_d = √(k/m - (c/2m)²)</span> must remain decoupled from vortex shedding frequency{' '}
                <span className="font-bold">f_s = St · V / D</span>.
              </div>
            </div>
          )}

          {/* Tab 2: Specification Sheet */}
          {activeDossierTab === 'spec' && (
            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 ${
                isDark ? 'bg-[#07080c] border-violet-500/15' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Damper Specifications
              </span>
              <ul className="text-xs space-y-1.5 font-mono">
                <li className="flex justify-between border-b border-slate-700/20 pb-1">
                  <span className="text-slate-400">Nominal TMD Mass:</span>
                  <span className="text-violet-400 font-bold">140,000 kg</span>
                </li>
                <li className="flex justify-between border-b border-slate-700/20 pb-1">
                  <span className="text-slate-400">Strouhal Number:</span>
                  <span className="text-white font-bold">St = 0.21</span>
                </li>
                <li className="flex justify-between border-b border-slate-700/20 pb-1">
                  <span className="text-slate-400">Deck Width (D):</span>
                  <span className="text-white font-bold">18.4 m</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Natural Mode f_0:</span>
                  <span className="text-amber-400 font-bold">2.12 Hz</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* PANEL 2: Question Solving Tab (40% / 5 cols) */}
        <div
          className={`col-span-12 lg:col-span-5 flex flex-col gap-3 p-5 rounded-2xl border shadow-xl ${
            isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
          }`}
        >
          {/* Navigation Bar inside the Question Panel */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/20">
            <button
              onClick={handlePrevChallenge}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isDark
                  ? 'bg-[#181926] text-violet-300 border-violet-500/30 hover:bg-[#202135]'
                  : 'bg-violet-50 text-violet-800 border-violet-200 hover:bg-violet-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>{currentChallenge > 1 ? `Back to Q${currentChallenge - 1}` : 'Back to Level Overview'}</span>
            </button>

            <span className="font-mono text-xs text-violet-400 font-bold">
              Level {currentLevel} • Challenge {currentChallenge} of 5
            </span>

            {currentChallenge < 5 ? (
              <button
                onClick={handleNextChallenge}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isDark
                    ? 'bg-[#181926] text-slate-300 border-violet-500/20 hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>Next Q</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            ) : (
              <span className="text-[11px] font-mono text-emerald-400 font-bold">Final Challenge</span>
            )}
          </div>

          {/* Question Prompt Area */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-mono text-xs flex items-center justify-center font-bold shadow-md">
                  Q{currentChallenge}
                </span>
                <span className="font-mono text-[10px] text-violet-400 uppercase font-bold tracking-wider">
                  {activeChallenge.category}
                </span>
              </div>
              <span className="font-mono text-xs text-amber-500 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">stars</span>
                {activeChallenge.kpReward} KP
              </span>
            </div>

            <h2 className={`font-headline-md text-lg md:text-xl font-bold leading-snug mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeChallenge.title}
            </h2>

            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {activeChallenge.problem} Formula:{' '}
              <code className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 font-mono text-[11px]">
                {activeChallenge.formulaHint}
              </code>
            </p>
          </div>

          {/* Multiple Choice Options */}
          <div className="flex flex-col gap-2 mt-1">
            {activeChallenge.options.map((opt) => {
              const isSelected = selectedOption === opt.key;

              return (
                <button
                  key={opt.key}
                  onClick={() => setSelectedOption(opt.key)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? isDark
                        ? 'bg-[#1f2030] border-2 border-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.25)]'
                        : 'bg-violet-50 border-2 border-violet-500 shadow-sm'
                      : isDark
                      ? 'bg-[#181926] border-violet-500/20 hover:bg-[#1f2030]'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg font-mono text-xs flex items-center justify-center font-bold shrink-0 ${
                      isSelected ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-700/20 text-slate-400'
                    }`}
                  >
                    {opt.key}
                  </span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-xs font-medium leading-snug ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {opt.text}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {opt.subtext}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback Area Banner */}
          {submitted && (
            <div
              className={`p-3 rounded-xl border shadow-lg flex flex-col gap-2 transition-all ${
                isCorrect
                  ? isDark
                    ? 'bg-violet-950/40 border-violet-500 text-violet-200'
                    : 'bg-violet-100 border-violet-400 text-violet-950'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span className="material-symbols-outlined text-[18px]">
                    {isCorrect ? 'verified' : 'warning'}
                  </span>
                  <span>
                    {isCorrect ? 'Excellent Calculation!' : 'Configuration Failed Safety Threshold!'}
                  </span>
                </div>
                {!isCorrect ? (
                  <button
                    onClick={handleRetry}
                    className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[13px]">replay</span>
                    <span>Try Again</span>
                  </button>
                ) : (
                  currentChallenge < 5 && (
                    <button
                      onClick={handleNextChallenge}
                      className="px-2.5 py-1 rounded-lg bg-violet-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm hover:bg-violet-500"
                    >
                      <span>Proceed to Q{currentChallenge + 1}</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  )
                )}
              </div>
              <p className="text-xs leading-relaxed">
                {isCorrect ? activeChallenge.explanationSuccess : activeChallenge.explanationFailure}
              </p>
            </div>
          )}

          {/* Action & Navigation Controls */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleSubmit}
              className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_0_#5b21b6] active:translate-y-0.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Submit Solution</span>
            </button>

            {/* In-Level Navigation Buttons: Back button to navigate before the challenge */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrevChallenge}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isDark
                    ? 'bg-[#181926] border-violet-500/20 text-slate-300 hover:text-white hover:bg-[#1f2030]'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-violet-400">arrow_back</span>
                <span>{currentChallenge > 1 ? `Back to Q${currentChallenge - 1}` : 'Back to Level Overview'}</span>
              </button>

              <button
                onClick={handleNextChallenge}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isDark
                    ? 'bg-[#181926] border-violet-500/20 text-slate-300 hover:text-white hover:bg-[#1f2030]'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{currentChallenge < 5 ? `Next (Q${currentChallenge + 1})` : 'Next Level'}</span>
                <span className="material-symbols-outlined text-[16px] text-violet-400">arrow_forward</span>
              </button>
            </div>

            {/* Hint & Concept Reveal Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRevealAnswer}
                className={`py-2 px-3 rounded-xl border text-xs font-mono flex items-center justify-center gap-1.5 transition-all ${
                  isDark ? 'bg-[#181926] border-violet-500/20 text-slate-300 hover:text-amber-300' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-amber-700'
                }`}
              >
                <span className="material-symbols-outlined text-amber-500 text-[16px]">visibility</span>
                <span>Reveal Answer</span>
                <span className="px-1.5 py-0.2 rounded bg-black/40 text-amber-400 font-bold">15 🪙</span>
              </button>

              <button
                onClick={handleConceptCapsule}
                className={`py-2 px-3 rounded-xl border text-xs font-mono flex items-center justify-center gap-1.5 transition-all ${
                  isDark ? 'bg-[#181926] border-violet-500/20 text-slate-300 hover:text-violet-300' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-violet-700'
                }`}
              >
                <span className="material-symbols-outlined text-violet-400 text-[16px]">menu_book</span>
                <span>Concept Capsule</span>
                <span className="px-1.5 py-0.2 rounded bg-black/40 text-amber-400 font-bold">10 🪙</span>
              </button>
            </div>
          </div>
        </div>

        {/* PANEL 3: Interactive Live Simulation Sandbox (35% / 4 cols) */}
        <div
          className={`col-span-12 lg:col-span-4 flex flex-col gap-3 p-4 rounded-2xl border shadow-xl ${
            isDark ? 'bg-[#12131b] border-violet-500/20' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-violet-400 text-[20px]">waves</span>
              <span className={`font-headline-sm text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Simulation Sandbox
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#181926] border border-violet-500/25">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_#a78bfa]" />
              <span className="font-mono text-[10px] text-violet-300 font-semibold">60 FPS Live</span>
            </div>
          </div>

          {/* Canvas / Animated Graphical Suspension Bridge Visualizer */}
          <div className="relative w-full h-48 bg-[#07080c] rounded-xl overflow-hidden border border-violet-500/20 shadow-inner flex flex-col justify-between p-3">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 200">
              <defs>
                <linearGradient id="waveGlow" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="50%" stopColor="#cebdff" />
                  <stop offset="100%" stopColor="#f97386" />
                </linearGradient>
              </defs>

              {/* Background Grid */}
              <line stroke="#1f2030" strokeDasharray="4 4" strokeWidth="0.8" x1="0" x2="400" y1="50" y2="50" />
              <line stroke="#1f2030" strokeDasharray="4 4" strokeWidth="0.8" x1="0" x2="400" y1="100" y2="100" />
              <line stroke="#1f2030" strokeDasharray="4 4" strokeWidth="0.8" x1="0" x2="400" y1="150" y2="150" />
              <line stroke="#1f2030" strokeDasharray="4 4" strokeWidth="0.8" x1="100" x2="100" y1="0" y2="200" />
              <line stroke="#1f2030" strokeDasharray="4 4" strokeWidth="0.8" x1="200" x2="200" y1="0" y2="200" />
              <line stroke="#1f2030" strokeDasharray="4 4" strokeWidth="0.8" x1="300" x2="300" y1="0" y2="200" />

              {/* Bridge Towers */}
              <rect x="75" y="30" width="8" height="140" rx="2" fill="#1f2030" stroke="rgba(167,139,250,0.3)" strokeWidth="1" />
              <rect x="315" y="30" width="8" height="140" rx="2" fill="#1f2030" stroke="rgba(167,139,250,0.3)" strokeWidth="1" />

              {/* Main Suspension Cable */}
              <path d="M 10 70 Q 75 35 79 35 T 200 130 T 319 35 T 390 70" fill="none" stroke="#747483" strokeWidth="2" />

              {/* Dynamic Oscillating Bridge Deck Path driven by Wind Velocity and Damper */}
              <path
                d={`M 20 140 Q 100 ${140 - (windVelocity / 3)} 200 ${140 + (windVelocity / 2.5)} T 380 140`}
                fill="none"
                stroke="url(#waveGlow)"
                strokeLinecap="round"
                strokeWidth="3"
              >
                <animate
                  attributeName="d"
                  dur={`${Math.max(0.6, 2.5 - windVelocity / 30)}s`}
                  repeatCount="indefinite"
                  values={`
                    M 20 140 Q 100 ${140 - windVelocity / 3} 200 ${140 + windVelocity / 3} T 380 140;
                    M 20 140 Q 100 ${140 + windVelocity / 3} 200 ${140 - windVelocity / 3} T 380 140;
                    M 20 140 Q 100 ${140 - windVelocity / 3} 200 ${140 + windVelocity / 3} T 380 140
                  `}
                />
              </path>

              {/* TMD Node 14 Representation */}
              <circle cx="200" cy="148" r="7" fill="#a78bfa" filter="drop-shadow(0 0 6px #a78bfa)">
                <animate
                  attributeName="cy"
                  dur={`${Math.max(0.6, 2.5 - windVelocity / 30)}s`}
                  repeatCount="indefinite"
                  values="158;138;158"
                />
              </circle>
              <line x1="200" y1="148" x2="200" y2="180" stroke="#a78bfa" strokeDasharray="2 2" strokeWidth="1.5" />
              <rect x="190" y="175" width="20" height="12" rx="3" fill="#8b5cf6" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            </svg>

            {/* Live Status Overlay */}
            <div className="relative z-10 flex items-center justify-between pointer-events-none">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/80 border border-violet-500/30 text-violet-300 font-bold">
                Torsional Flutter Simulation
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border ${
                  isResonanceZone
                    ? 'text-rose-400 bg-rose-950/60 border-rose-500/40 animate-pulse'
                    : 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40'
                }`}
              >
                {isResonanceZone ? 'HARMONIC COUPLING' : 'PHASE DECOUPLED'}
              </span>
            </div>

            <div className="relative z-10 flex items-end justify-between pointer-events-none">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-slate-400">Active Frequency</span>
                <span className="font-mono text-sm text-white font-bold">
                  {vortexFreq.toFixed(2)} Hz
                </span>
              </div>
              <div
                className={`flex items-center gap-1 border px-2 py-0.5 rounded-lg ${
                  isResonanceZone
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                    : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isResonanceZone ? 'warning' : 'verified'}
                </span>
                <span className="font-mono text-[10px] font-bold">
                  {isResonanceZone ? 'Critical Zone' : 'Stable Mode'}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Physics Sliders */}
          <div
            className={`flex flex-col gap-2 p-3 rounded-xl border ${
              isDark ? 'bg-[#181926] border-violet-500/15' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Dynamic Physics Inputs
            </span>

            {/* Slider 1: Wind Velocity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span>Wind Velocity (V)</span>
                <span className="font-mono text-violet-400 font-bold">{windVelocity} m/s</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={windVelocity}
                onChange={(e) => setWindVelocity(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-700/30 rounded-lg appearance-none"
              />
            </div>

            {/* Slider 2: Damper Mass */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span>Damper Mass (m)</span>
                <span className="font-mono text-violet-300 font-bold">
                  {damperMass.toLocaleString()} kg
                </span>
              </div>
              <input
                type="range"
                min="20000"
                max="250000"
                step="5000"
                value={damperMass}
                onChange={(e) => setDamperMass(Number(e.target.value))}
                className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-700/30 rounded-lg appearance-none"
              />
            </div>

            {/* Slider 3: Deck Tension */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span>Deck Tension (kN)</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {deckTension.toLocaleString()} kN
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="6000"
                step="100"
                value={deckTension}
                onChange={(e) => setDeckTension(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-700/30 rounded-lg appearance-none"
              />
            </div>
          </div>

          {/* Telemetry Diagnostics & Sparkline Readout */}
          <div
            className={`p-3 rounded-xl border flex flex-col gap-2 ${
              isDark ? 'bg-[#07080c] border-violet-500/15' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="uppercase font-bold tracking-wider">Telemetry Diagnostics</span>
              <span>Sample: #8942</span>
            </div>

            {/* Sparkline Bars */}
            <div className="w-full h-10 flex items-end gap-1 px-1 py-1 bg-[#181926] rounded-lg border border-violet-500/15">
              <div className="flex-1 bg-violet-600/40 rounded-xs" style={{ height: `${Math.min(100, vortexFreq * 25)}%` }} />
              <div className="flex-1 bg-violet-600/60 rounded-xs" style={{ height: `${Math.min(100, vortexFreq * 35)}%` }} />
              <div className="flex-1 bg-violet-600/80 rounded-xs" style={{ height: `${Math.min(100, vortexFreq * 45)}%` }} />
              <div className="flex-1 bg-violet-400 rounded-xs shadow-[0_0_8px_#a78bfa]" style={{ height: `${Math.min(100, vortexFreq * 55)}%` }} />
              <div className={`flex-1 rounded-xs ${isResonanceZone ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`} style={{ height: `${Math.min(100, vortexFreq * 65)}%` }} />
              <div className={`flex-1 rounded-xs ${isResonanceZone ? 'bg-rose-500' : 'bg-emerald-400'}`} style={{ height: `${Math.min(100, vortexFreq * 60)}%` }} />
              <div className="flex-1 bg-violet-400 rounded-xs" style={{ height: `${Math.min(100, vortexFreq * 45)}%` }} />
              <div className="flex-1 bg-violet-600/80 rounded-xs" style={{ height: `${Math.min(100, vortexFreq * 35)}%` }} />
              <div className="flex-1 bg-violet-600/60 rounded-xs" style={{ height: `${Math.min(100, vortexFreq * 25)}%` }} />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-slate-400">Resonance Peak</span>
                <span className={`font-mono font-bold ${isResonanceZone ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {vortexFreq.toFixed(2)} Hz {isResonanceZone && '(Critical!)'}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-mono text-[10px] text-slate-400">Safety Margin</span>
                <span className="font-mono text-emerald-400 font-bold">{safetyFactor} SF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
