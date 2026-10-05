import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import { TaskRenderer, MissionTask } from './TaskRendererRegistry';
import { MissionStageNavigator, MissionStage } from './MissionStageNavigator';
import { resolveSimulationSource } from '../../data/simulationRegistry';
import { WindowPanel } from '../WindowPanel';

type Props = { theme: 'dark' | 'light'; isGuest: boolean; onNavigate: (page: 'missions-map' | 'mission-detail' | 'mission-chamber') => void; onExit: () => void; onShowToast: (message: string) => void };

export const MissionRuntime: React.FC<Props> = ({ theme, isGuest, onNavigate, onExit, onShowToast }) => {
  const dark = theme === 'dark';
  const missionId = localStorage.getItem('nextess_selected_mission') || '';
  const [mission, setMission] = useState<any>(null);
  const [investigation, setInvestigation] = useState<any>(null);
  const [stage, setStage] = useState<'brief' | 'capsule' | 'level' | 'complete'>(() => {
    const savedStage = Number(localStorage.getItem('nextess_mission_stage') || '1');
    if (savedStage >= 3) return 'level';
    if (savedStage === 2) return 'capsule';
    return 'brief';
  });
  const [capsule, setCapsule] = useState(0);
  const [level, setLevel] = useState(0);
  const [question, setQuestion] = useState(0);
  const [answer, setAnswer] = useState<unknown>('');
  const [feedback, setFeedback] = useState<any>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<any>(null);
  const [fileIndex, setFileIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [simulationSaving, setSimulationSaving] = useState(false);
  const [levelReward, setLevelReward] = useState({open:false, level:0, xp:0, coins:0, balances:null as any, perfect:false, badgeClaimed:false, badgeClaiming:false});
  const [finalRewards, setFinalRewards] = useState({xp:0,coins:0});

  useEffect(() => {
    const stageNumber = stage === 'brief' ? 1 : stage === 'capsule' ? 2 : stage === 'level' ? Math.max(3, level + 3) : 999;
    localStorage.setItem('nextess_mission_stage', String(stageNumber));
  }, [stage, level]);
  const simulationFrameRef = React.useRef<HTMLIFrameElement>(null);

  const capsules = mission?.currentPublishedVersion?.contentMetadata?.learningCapsule?.sections || [];
  const levels = investigation?.projectVersion?.levels || mission?.currentPublishedVersion?.levels || [];
  const currentLevel = levels[level];
  const questions = currentLevel?.questions || [];
  const currentQuestion = useMemo<MissionTask | undefined>(() => {
    const task = questions[question] as MissionTask | undefined;
    if (!task) return undefined;
    return { ...task, subject: mission?.subject?.key || mission?.subject?.displayName };
  }, [questions, question, mission?.subject?.key, mission?.subject?.displayName]);
  const files = investigation?.projectVersion?.caseFiles || mission?.currentPublishedVersion?.caseFiles || mission?.requiredEvidence?.files || [];
  const file = files[fileIndex] || files[0];
  const simulation = currentLevel?.simulation;
  const nextMission = mission?.nextMission || null;
  const simulationFile = simulation?.configuration?.fileName || mission?.requiredSimulation?.fileName;
  const simulationSrc = resolveSimulationSource(simulationFile, simulation?.assets || []);
  const currentAnswers = (investigation?.answers || []).filter((item:any) => item.questionId === currentQuestion?.id);
  const isFinalChallenge = level === levels.length - 1 && question === questions.length - 1;
  const revealedQuestionIds=new Set<string>(Object.keys((investigation?.state as any)?.reveals || {}));
  const currentLevelComplete = questions.length > 0 && questions.every((q:any) =>
    (investigation?.answers || []).some((a:any) => a.questionId === q.id) || revealedQuestionIds.has(q.id)
  );
  const currentLevelPerfect = questions.length > 0 && questions.every((q:any) =>
    (investigation?.answers || []).some((a:any) => a.questionId === q.id && a.result === 'CORRECT')
  );
  const latestCurrentAnswer = currentAnswers.length
    ? [...currentAnswers].sort((a:any,b:any) => String(a.submittedAt || '').localeCompare(String(b.submittedAt || ''))).at(-1)
    : null;
  const hasSubmittedCurrent = Boolean(latestCurrentAnswer);
  const hasCorrectCurrent = latestCurrentAnswer?.result === 'CORRECT';
  const canMoveNext = hasSubmittedCurrent || Boolean(revealed);
  const hasInputAnswer = !(answer === '' || answer == null || (typeof answer === 'string' && answer.trim() === ''));
  const canUseHint = !hasCorrectCurrent && !revealed && (!hasInputAnswer || (hasSubmittedCurrent && !hasCorrectCurrent));
  const canRevealAnswer = !hasCorrectCurrent && !revealed && (!hasInputAnswer || (hasSubmittedCurrent && !hasCorrectCurrent));

  useEffect(() => {
    let cancelled = false;
    if (!currentQuestion) return;
    if (!latestCurrentAnswer) {
      setAnswer('');
      const persistedReveal = investigation?.revealedAnswers?.[currentQuestion.id];
      setRevealed(persistedReveal || null);
      setFeedback(null);
      setHints([]);
      return;
    }
    const payload = latestCurrentAnswer.answerPayload;
    const previousValue = payload && typeof payload === 'object'
      ? (Object.prototype.hasOwnProperty.call(payload, 'value') ? payload.value
        : Object.prototype.hasOwnProperty.call(payload, 'text') ? payload.text : '')
      : payload ?? '';
    setAnswer(previousValue);
    setFeedback({
      correct: latestCurrentAnswer.result === 'CORRECT',
      message: latestCurrentAnswer.result === 'CORRECT'
        ? 'You already solved this challenge. Your progress is saved — continue when you’re ready. This challenge is complete; move to the next one.'
        : 'This challenge was already submitted. You can move on or reveal the answer without another charge.'
    });
    setHints([]);
    setRevealed(null);
    return () => { cancelled = true; };
  }, [currentQuestion?.id, investigation?.revealedAnswers]);

  const syncGuestBalance = (deltaXp:number, deltaCoins:number) => { const kp=Math.max(0,Number(localStorage.getItem('nextess_guest_kp')||100)+deltaXp); const coins=Math.max(0,Number(localStorage.getItem('nextess_guest_coins')||100)+deltaCoins); localStorage.setItem('nextess_guest_kp',String(kp)); localStorage.setItem('nextess_guest_coins',String(coins)); window.dispatchEvent(new CustomEvent('nextess-mission-updated',{detail:{guestBalances:{kp,coins}}})); return {kp,coins}; };
  const refreshInvestigation = async () => {
    if (!investigation?.id) return null;
    const result = await api.investigation(investigation.id);
    setInvestigation(result.investigation);
    return result.investigation;
  };

  const startMission = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const started = await api.startMission(missionId);
      localStorage.setItem('nextess_investigation_id', started.investigationId);
      localStorage.setItem('nextess_investigation_mission_id', missionId);
      const result = await api.investigation(started.investigationId);
      const inv = result.investigation;
      localStorage.setItem('nextess_selected_mission_title', mission?.title || 'Current mission');
      localStorage.setItem('nextess_guest_mission_progress','1');
      window.dispatchEvent(new Event('nextess-mission-updated'));
      setInvestigation(inv);
      const invLevels = inv?.projectVersion?.levels || [];
      const index = invLevels.findIndex((item: any) => item.id === inv.currentLevelId);
      const nextLevel = index >= 0 ? index : 0;
      setLevel(nextLevel);
      localStorage.setItem('nextess_guest_mission_progress',String(Math.round((nextLevel/Math.max(1,invLevels.length))*100)));
      const firstOpen = (invLevels[nextLevel]?.questions || []).findIndex((item: any) =>
        !(inv.answers || []).some((a: any) => a.questionId === item.id && a.result === 'CORRECT')
      );
      setQuestion(firstOpen >= 0 ? firstOpen : 0);
      setStage(inv.status === 'COMPLETED' ? 'complete' : 'level');
    } catch (e: any) {
      setError(e?.message || 'Mission could not be started.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!missionId) throw new Error('No mission was selected.');
        const result = await api.project(missionId);
        if (cancelled) return;
        setMission({...result.project, nextMission: result.nextMission || null});

        if (result.progress?.status !== 'COMPLETED') {
          // A persisted mission-chamber route must be recoverable after a hard
          // reload even when the project response has not yet reflected the
          // previous investigation as IN_PROGRESS.
          const persistedInvestigationId = localStorage.getItem('nextess_investigation_mission_id') === missionId
            ? localStorage.getItem('nextess_investigation_id')
            : null;
          const existingInvestigationId = result.progress?.investigationId || result.progress?.investigation?.id || persistedInvestigationId;
          // Opening a mission must preserve the Mission Brief/learning flow. Do not
          // create a new server investigation merely because the mission page was
          // opened: starting the investigation is an explicit learner action.
          // Existing progress (including a persisted investigation ID) is resumed
          // immediately so refresh/re-entry remains server-authoritative.
          if (!existingInvestigationId) {
            setStage('brief');
            return;
          }

          let investigationId = existingInvestigationId;
          let investigationResult: any;
          try {
            investigationResult = await api.investigation(investigationId);
          } catch (investigationError) {
            // A stale persisted investigation may no longer be available. Start a
            // fresh investigation only after an actual resume attempt failed.
            const started = await api.startMission(missionId);
            investigationId = started.investigationId;
            localStorage.setItem('nextess_investigation_id', started.investigationId);
            localStorage.setItem('nextess_investigation_mission_id', missionId);
            investigationResult = await api.investigation(started.investigationId);
          }
          if (cancelled) return;
          localStorage.setItem('nextess_investigation_id', investigationId);
          localStorage.setItem('nextess_investigation_mission_id', missionId);
          const inv = investigationResult.investigation;
          setInvestigation(inv);
          const invLevels = inv?.projectVersion?.levels || result.project?.currentPublishedVersion?.levels || [];
          const nextLevelIndex = invLevels.findIndex((item: any) => item.id === inv.currentLevelId);
          const nextLevel = nextLevelIndex >= 0 ? nextLevelIndex : 0;
          setLevel(nextLevel);
          const currentQuestions = invLevels[nextLevel]?.questions || [];
          const currentQuestionIndex = currentQuestions.findIndex((item: any) => item.id === inv.currentQuestionId);
          const firstOpen = currentQuestions.findIndex((item: any) =>
            !(inv.answers || []).some((a: any) => a.questionId === item.id && a.result === 'CORRECT')
          );
          setQuestion(currentQuestionIndex >= 0 ? currentQuestionIndex : (firstOpen >= 0 ? firstOpen : 0));
          setStage(inv.status === 'COMPLETED' ? 'complete' : 'level');
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Mission could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [missionId]);

  const stageItems = useMemo<MissionStage[]>(() => {
    const items: MissionStage[] = [
      { key: 'brief', label: 'Mission Brief', state: stage === 'brief' ? 'current' : 'completed' },
    ];
    if (capsules.length > 0) {
      items.push({
        key: 'capsule',
        label: 'Learning Capsule',
        state: stage === 'capsule' ? 'current' : stage === 'brief' ? 'available' : 'completed',
      });
    }
    levels.forEach((item: any, index: number) => {
      const completed = (item.questions || []).length > 0 && (item.questions || []).every((q: any) =>
        (investigation?.answers || []).some((a: any) => a.questionId === q.id && a.result === 'CORRECT')
      );
      const isCurrent = stage === 'level' && index === level;
      const unlocked = index <= level || completed;
      items.push({
        key: `level-${item.levelNumber ?? index + 1}`,
        label: `Level ${item.levelNumber ?? index + 1}: ${item.title || 'Investigation'}`,
        state: completed ? 'completed' : isCurrent ? 'current' : unlocked ? 'available' : 'locked',
      });
    });
    items.push({
      key: 'complete',
      label: 'Mission Complete',
      state: investigation?.status === 'COMPLETED' || stage === 'complete' ? 'available' : 'locked',
    });
    return items;
  }, [stage, level, levels, capsules.length, investigation?.answers, investigation?.status]);

  const selectStage = (selected: MissionStage) => {
    if (selected.key === 'brief') setStage('brief');
    else if (selected.key === 'capsule' && capsules.length) setStage('capsule');
    else if (selected.key === 'complete' && investigation?.status === 'COMPLETED') setStage('complete');
    else if (selected.key.startsWith('level-')) {
      const index = levels.findIndex((item: any) => `level-${item.levelNumber}` === selected.key);
      if (index >= 0 && index <= level) {
        setLevel(index);
        setQuestion(0);
        setAnswer('');
        setFeedback(null);
        setHints([]);
        setRevealed(null);
                        setStage('level');
      }
    }
  };

  const stageNumber = stage === 'brief' ? 1 : stage === 'capsule' ? 2 : stage === 'complete' ? levels.length + 3 : level + 3;
  const totalStages = Math.max(3, levels.length + 3);
  const progress = Math.round(((stageNumber - 1) / (totalStages - 1)) * 100);


  const submit = async () => {
    if (!investigation?.id || !currentQuestion || busy) return;
    if (hasSubmittedCurrent) {
      setFeedback({ correct: hasCorrectCurrent, message: hasCorrectCurrent ? 'You already solved this challenge. Your progress is saved — continue when you’re ready.' : 'You’ve already submitted this challenge. You can continue, or reveal the answer without another charge.' });
      return;
    }
    if (answer === '' || answer == null) {
      setFeedback({ correct: false, message: 'Choose an answer first, then check it when you’re ready.' });
      return;
    }
    setBusy(true);
    try {
      const result = await api.submitAnswer(
        investigation.id,
        currentQuestion.id,
        { value: typeof answer === 'string' ? answer.trim() : answer },
        globalThis.crypto.randomUUID()
      );
      const correct = result.result === 'CORRECT';
      setFeedback({
        correct,
        message: correct
          ? `Great job! You got it right.${result.reward?.xp || result.reward?.coins ? ` +${result.reward.xp || 0} KP · +${result.reward.coins || 0} coins.` : ''} Check the answer below, then continue when you’re ready.`
          : (result.penalty?.xp || result.penalty?.coins
            ? `Not quite — that’s okay. You lost ${result.penalty.xp || 0} KP · ${result.penalty.coins || 0} coins. Review the feedback, use a hint if helpful, or reveal the answer.`
            : 'Not quite — that’s okay. Review your answer, use a hint if helpful, or reveal the answer before moving on.'),
      });

      if (result.levelCompleted) {
        setLevelReward({
          open: true,
          level: currentLevel?.levelNumber ?? level + 1,
          xp: result.reward?.xp || 0,
          coins: result.reward?.coins || 0,
          balances: result.balances || null,
          perfect: Boolean(result.levelPerfect),
          badgeClaimed: false,
          badgeClaiming: false,
        });
      }

      // A successful submission is feedback only. The answer remains hidden
      // until the learner explicitly uses Reveal Answer.
      setRevealed(null);

      const guestBalances = result.anonymous ? syncGuestBalance(result.result === 'CORRECT' ? 2 : 0, result.result === 'CORRECT' ? 1 : 0) : null;
      if (result.progressPercent !== undefined) localStorage.setItem('nextess_guest_mission_progress',String(Math.max(0,Math.min(100,Number(result.progressPercent)))));
      window.dispatchEvent(new CustomEvent('nextess-mission-updated', { detail: { ...result, guestBalances } }));
      await refreshInvestigation();
    } catch (e: any) {
      setFeedback({ correct: false, message: e?.message || 'Submission failed. Retry.' });
    } finally {
      setBusy(false);
    }
  };

  const moveNext = async () => {
    if (!currentQuestion || busy) return;
    if (!canMoveNext) {
      setFeedback({ correct: false, message: 'Almost there! Answer this challenge or reveal the answer before moving on.' });
      return;
    }

    if (question + 1 < questions.length) {
      setQuestion(v => v + 1);
    } else if (level + 1 < levels.length) {
      if (!currentLevelComplete) {
        setFeedback({ correct:false, message:'Complete every challenge in this level before moving to the next level.' });
        return;
      }
      try {
        setBusy(true);
        const advanced = await api.advanceMissionLevel(investigation.id);
        const nextLevelIndex = levels.findIndex((item:any) => item.id === advanced.currentLevelId);
        setLevel(nextLevelIndex >= 0 ? nextLevelIndex : level + 1);
        setQuestion(0);
      } catch (e:any) {
        setFeedback({ correct:false, message:e?.message || 'We couldn’t open the next level yet. Please try again.' });
        return;
      } finally {
        setBusy(false);
      }
    } else {
      if (!currentLevelComplete) {
        setFeedback({ correct:false, message:'One last step: complete every challenge in this level before finishing the mission.' });
        return;
      }
      const completion = await finalize();
      if (!completion) return;
      setStage('complete');
      return;
    }

    setAnswer('');
    setFeedback(null);
    setHints([]);
    setRevealed(null);
  };

  const useHint = async () => {
    if (!investigation?.id || !currentQuestion || busy || !canUseHint) return;
    const guest = isGuest;
    if (guest && Number(localStorage.getItem('nextess_guest_coins') || 100) < 5) { setFeedback({ correct:false, message:'You need 5 coins to open a hint. Keep your coins handy!' }); return; }
    setBusy(true);
    try {
      const result = await api.useHint(investigation.id, currentQuestion.id);
      setHints((items) => [...items, result.hint]);
      const guestBalances = result.anonymous ? syncGuestBalance(0, -5) : null;
      window.dispatchEvent(new CustomEvent('nextess-mission-updated', { detail: { ...result, guestBalances } }));
    } catch (e: any) {
      setFeedback({ correct: false, message: e?.message || 'We couldn’t open a hint right now. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const revealAnswer = async () => {
    if (!investigation?.id || !currentQuestion || busy || !canRevealAnswer) return;
    const guest = isGuest;
    if (guest && (Number(localStorage.getItem('nextess_guest_kp') || 100) < 5 || Number(localStorage.getItem('nextess_guest_coins') || 100) < 2) && !hasSubmittedCurrent) { setFeedback({ correct:false, message:'You need 5 KP and 2 coins to reveal this answer.' }); return; }
    setBusy(true);
    try {
      const result = await api.revealAnswer(investigation.id, currentQuestion.id);
      setRevealed(result);
      if (result.progressPercent !== undefined) {
        localStorage.setItem('nextess_guest_mission_progress', String(Math.max(0, Math.min(100, Number(result.progressPercent)))));
      }
      const guestBalances = result.anonymous
        ? syncGuestBalance(Number(result.cost?.xp || 0) * -1, Number(result.cost?.coins || 0) * -1)
        : null;
      window.dispatchEvent(new CustomEvent('nextess-mission-updated', { detail: { ...result, guestBalances } }));
      if (result.missionCompleted) {
        await refreshInvestigation();
        const completion = await finalize();
        if (completion) setStage('complete');
      }
    } catch (e: any) {
      setFeedback({ correct: false, message: e?.message || 'We couldn’t reveal the answer right now. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const finalize = async () => {
    if (!investigation?.id) return null;
    try {
      const result = await api.completeMission(investigation.id);
      setFinalRewards(result?.totalRewards || {xp:0,coins:0});
      window.dispatchEvent(new CustomEvent('nextess-mission-updated', { detail: result }));
      onShowToast('Mission completion recorded.');
      return result;
    } catch (e: any) {
      onShowToast(e?.message || 'Mission completion could not be finalized.');
      return null;
    }
  };

  const investigationIdRef = React.useRef<string | null>(null);
  const simulationIdRef = React.useRef<string | null>(null);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveSequenceRef = React.useRef(0);

  useEffect(() => {
    investigationIdRef.current = investigation?.id || null;
    simulationIdRef.current = simulation?.id || null;
  }, [investigation?.id, simulation?.id]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // The simulation bundle is served by the same Nextess origin. The exact
      // origin check is the security boundary here; relying on MessageEvent.source
      // identity is unnecessarily brittle across embedded browser contexts.
      if (event.origin !== window.location.origin) return;

      const payload = event.data;
      if (payload?.type !== 'nextess-simulation-state' || !payload.state || typeof payload.state !== 'object') return;

      const investigationId = investigationIdRef.current;
      const simulationId = simulationIdRef.current;
      if (!investigationId || !simulationId) return;

      const sequence = ++saveSequenceRef.current;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSimulationSaving(true);

      saveTimerRef.current = setTimeout(async () => {
        try {
          await api.simulationState(investigationId, simulationId, payload.state);
          if (sequence === saveSequenceRef.current) setSimulationSaving(false);
        } catch (e: any) {
          if (sequence === saveSequenceRef.current) {
            setSimulationSaving(false);
            setFeedback({ correct: false, message: e?.message || 'Simulation state could not be saved.' });
          }
        }
      }, 50);
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const restoreSimulation = () => {
    const state = investigation?.state?.simulations?.[simulation?.id];
    if (!state || !simulationFrameRef.current?.contentWindow) return;
    simulationFrameRef.current.contentWindow.postMessage(
      { type: 'nextess-simulation-restore', state },
      window.location.origin
    );
  };

  useEffect(() => {
    if (!investigation?.state?.simulations?.[simulation?.id]) return;
    const timer = window.setTimeout(restoreSimulation, 50);
    return () => window.clearTimeout(timer);
  }, [investigation?.state?.simulations, simulation?.id]);

  const shell = `mission-light-card rounded-2xl border shadow-2xl ${dark ? 'bg-[#12131b] border-violet-500/40' : 'bg-white border-violet-200'}`;

  if (loading) return <div data-testid="mission-runtime-loading" className="min-h-[calc(100vh-120px)] flex items-center justify-center text-sm text-slate-400">Loading mission...</div>;
  if (error || !mission) return (
    <section data-testid="mission-runtime-error" className={`${shell} p-8`}>
      <div className="font-mono text-[10px] uppercase text-rose-400">Mission runtime</div>
      <h2 className="text-xl font-bold mt-2">Mission could not be opened</h2>
      <p className="text-sm text-slate-400 mt-2">{error || 'Mission not found.'}</p>
      <button onClick={onExit} className="mt-5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold">Return</button>
    </section>
  );

  if (stage === 'brief') return (
    <div data-testid="mission-runtime" className={`mission-runtime ${dark ? 'mission-runtime-dark' : 'mission-runtime-light'} w-full pb-16`}>
      <Header theme={theme} mission={mission} progress={progress} label="STAGE 01 / MISSION BRIEF" onExit={onExit} stages={stageItems} onStageSelect={selectStage} />
      <section className={`${shell} mt-5 p-6`}>
        <div className="max-w-[1100px] mx-auto">
          <div className={`rounded-2xl border p-6 ${dark ? 'border-amber-500/40 bg-[#0f1017]' : 'border-amber-200 bg-amber-50/70'}`}>
            <div className="font-mono text-[10px] text-amber-400 uppercase">Case File · Overview</div>
            <h2 className={`text-lg font-bold mt-1 ${dark ? 'text-white' : 'text-slate-900'}`}>{mission.title}</h2>
            <div className={`mt-4 rounded-xl border p-4 ${dark ? 'border-amber-500/20 bg-[#12131b]' : 'border-amber-200 bg-white'}`}>
              <div className="font-mono text-[10px] text-amber-400 uppercase font-bold">Primary Objective</div>
              <p className={`text-base leading-7 mt-2 ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{mission.mission}</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <Meta dark={dark} label="Role" value={mission.role || '—'} />
              <Meta dark={dark} label="Difficulty" value={mission.currentPublishedVersion?.contentMetadata?.difficulty || mission.difficulty || 'Easy'} />
              <Meta dark={dark} label="Mission Type" value={mission.problemType || '—'} />
            </div>
            <div className="mt-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="font-mono text-[9px] text-emerald-400 uppercase">Evidence requirement</div>
              <p className={`text-xs mt-1 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{mission.requiredEvidence?.instruction || 'Use the provided mission evidence.'}</p>
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <button
              onClick={() => capsules.length > 0 ? setStage('capsule') : startMission()}
              disabled={busy}
              data-testid="mission-brief-start"
              className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold disabled:opacity-50"
            >
              {capsules.length > 0 ? 'Next · Learning Capsule' : 'Start Investigation'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  if (stage === 'capsule') {
    const section = capsules[capsule];
    return (
      <div data-testid="mission-runtime" className={`mission-runtime ${dark ? 'mission-runtime-dark' : 'mission-runtime-light'} w-full pb-16`}>
        <Header theme={theme} mission={mission} progress={progress} label="STAGE 02 / LEARNING CAPSULE" onExit={onExit} stages={stageItems} onStageSelect={selectStage} />
        <section className={`${shell} mt-5 p-6`}>
          <div className="max-w-[1000px] mx-auto">
            <div className="flex gap-2 mb-5 overflow-x-auto">
              {capsules.map((item: any, index: number) => (
                <button key={item.title} onClick={() => setCapsule(index)} className={`px-3 py-2 rounded-xl text-xs font-mono min-w-[140px] ${index === capsule ? 'bg-violet-600 text-white font-bold' : dark ? 'bg-[#181926] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                  {index + 1}. {item.title}
                </button>
              ))}
            </div>
            <article className={`max-w-[700px] min-h-[360px] mx-auto rounded-[24px] border-2 border-violet-500/40 p-8 flex flex-col justify-between ${dark ? 'bg-[#12131b]' : 'bg-white'}`}>
              <div>
                <span className="font-mono text-[10px] text-violet-400">CONCEPT {capsule + 1} / {capsules.length}</span>
                <h2 className={`text-2xl font-bold mt-3 ${dark ? 'text-white' : 'text-slate-900'}`}>{section?.title}</h2>
                <div className="w-12 h-1 rounded-full bg-violet-500 mt-3" />
                <p className={`text-base leading-7 mt-5 ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{section?.content}</p>
              </div>
              <div className="flex flex-wrap justify-between gap-2 mt-8">
                <button disabled={capsule === 0} onClick={() => setCapsule((v) => Math.max(0, v - 1))} className={`px-4 py-2.5 rounded-xl border border-violet-500/30 text-xs disabled:opacity-40 ${dark ? 'bg-[#181926] text-slate-300' : 'bg-white text-slate-700'}`}>Previous</button>
                <div className="flex gap-2">
                  <button onClick={startMission} disabled={busy} className={`px-4 py-2.5 rounded-xl border border-violet-500/30 text-xs ${dark ? 'bg-[#181926] text-slate-300' : 'bg-white text-slate-700'}`}>Skip to levels</button>
                  <button onClick={() => capsule + 1 < capsules.length ? setCapsule((v) => v + 1) : startMission()} disabled={busy} className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold">
                    {capsule + 1 < capsules.length ? 'Next Concept' : 'Continue to Level 1'}
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    );
  }

  if (stage === 'complete') return (
    <div data-testid="mission-runtime" className={`mission-runtime ${dark ? 'mission-runtime-dark' : 'mission-runtime-light'} w-full pb-16`}>
      <Header theme={theme} mission={mission} progress={100} label="FINAL STAGE / CELEBRATION" onExit={onExit} stages={stageItems} onStageSelect={selectStage} />
      <section className={`mt-5 max-w-[900px] mx-auto rounded-[28px] border-2 border-emerald-500/40 p-8 text-center ${dark ? 'bg-[#0f1017]' : 'bg-white'}`}>
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
          <span className="material-symbols-outlined text-[42px]">celebration</span>
        </div>
        <div className="font-mono text-[10px] text-emerald-400 uppercase tracking-[.2em] mt-5">Investigation completed</div>
        <h2 className={`text-3xl font-bold mt-2 ${dark ? 'text-white' : 'text-slate-900'}`}>{mission.title}</h2>
        <p className={`text-sm leading-6 mt-3 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>All mission levels were completed and server-authoritative rewards were applied.</p>
        <div className="mt-5">
          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Your final rewards below include only challenge rewards actually earned. Revealed or incorrect challenges do not grant the 2 KP + 1 coin challenge reward.</p>
          <div role="status" aria-label="Final rewards granted" className={`mt-3 rounded-2xl border p-5 ${dark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className={`text-[10px] font-mono uppercase tracking-wider ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>Mission rewards</div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className={`rounded-xl border p-3 ${dark ? 'border-violet-500/25 bg-violet-500/10' : 'border-violet-200 bg-white'}`}><div className="text-[10px] uppercase font-mono text-violet-400">Total KP earned</div><div className="text-2xl font-bold mt-1">+{finalRewards.xp}</div></div>
              <div className={`rounded-xl border p-3 ${dark ? 'border-amber-500/25 bg-amber-500/10' : 'border-amber-200 bg-white'}`}><div className="text-[10px] uppercase font-mono text-amber-400">Total coins earned</div><div className="text-2xl font-bold mt-1">+{finalRewards.coins}</div></div>
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button type="button" onClick={onExit} className={`px-5 py-3 rounded-xl border text-xs font-bold ${dark ? 'bg-[#181926] border-violet-500/30 text-slate-200 hover:bg-[#202131]' : 'bg-white border-violet-200 text-slate-800 hover:bg-violet-50'}`}>Move to Mission Path</button>
          <button
            type="button"
            disabled={!nextMission?.id}
            onClick={() => {
              if (!nextMission?.id) return;
              localStorage.setItem('nextess_selected_mission', nextMission.id);
              localStorage.removeItem('nextess_investigation_id');
              localStorage.removeItem('nextess_investigation_mission_id');
              localStorage.setItem('nextess_mission_stage', '1');
              window.dispatchEvent(new Event('nextess-mission-updated'));
              onNavigate('mission-chamber');
            }}
            className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-40"
          >Solve Next Mission</button>
        </div>
        {!nextMission?.id && <p className="mt-3 text-[11px] text-slate-500">You have reached the end of the currently published mission path.</p>}
      </section>
    </div>
  );

  const missionPanel = (
    <aside className={`rounded-2xl border p-4 ${dark ? 'bg-[#12131b] border-amber-500/20' : 'bg-white border-amber-200'}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-amber-400 uppercase">Mission Brief / Files</span>
        <span className="font-mono text-[9px] text-slate-500">{files.length} files</span>
      </div>
      <p className="text-[11px] text-slate-400 mt-2">Use these files for evidence and data while solving the mission.</p>
      <div className="mt-3 space-y-1.5">
        {files.map((item: any, index: number) => (
          <button key={item.id || item.fileName || index} onClick={() => setFileIndex(index)} className={`w-full text-left p-2.5 rounded-xl border ${index === fileIndex ? 'bg-[#1f2030] border-amber-400' : 'bg-[#07080c] border-amber-500/20 hover:border-amber-500/40'}`}>
            <div className="font-mono text-[9px] text-amber-400 uppercase">{item.type || item.metadata?.type || 'file'}</div>
            <div className="text-[11px] font-semibold text-white mt-0.5">{item.fileName || item.name}</div>
          </button>
        ))}
      </div>
      {file && (
        <div className="mt-3 rounded-xl border border-amber-500/20 overflow-hidden ${dark ? 'bg-[#07080c]' : 'bg-white'}">
          <div className="p-3 bg-[#13141f] border-b border-amber-500/20">
            <div className="font-mono text-[9px] text-slate-500 uppercase">Selected file</div>
            <div className="text-xs font-semibold text-white mt-0.5">{file.fileName || file.name}</div>
          </div>
          <div className="p-3 max-h-[340px] overflow-y-auto">
            <div className="text-[10px] text-amber-300 mb-2">{file.purpose || file.metadata?.purpose || ''}</div>
            <pre className="whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-300 font-mono">{file.content || ''}</pre>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <div data-testid="mission-runtime" className={`mission-runtime ${dark ? 'mission-runtime-dark' : 'mission-runtime-light'} w-full pb-32`}>
      <Header theme={theme} mission={mission} progress={progress} label={`LEVEL ${currentLevel?.levelNumber ?? level + 1} / ${currentLevel?.title || 'MISSION'}`} onExit={onExit} stages={stageItems} onStageSelect={selectStage} />
      <div className="grid grid-cols-12 xl:grid-cols-[5fr_9fr_6fr] gap-5 mt-5 items-start">
        <div className="col-span-12 xl:col-span-1">{missionPanel}</div>
        <section className={`${shell} col-span-12 xl:col-span-1 p-6`}>
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 gap-3">
            <button onClick={() => {
              if (question > 0) setQuestion((v) => v - 1);
              else if (level > 0) { setLevel((v) => v - 1); setQuestion(Math.max(0, (levels[level - 1]?.questions?.length || 1) - 1)); }
              else setStage('capsule');
              setAnswer(''); setFeedback(null); setHints([]); setRevealed(null);
            }} className={`px-3 py-1.5 rounded-xl border text-xs ${dark ? 'bg-[#181926] border-cyan-500/30 text-slate-300' : 'bg-white border-slate-300 text-slate-700'}`}>← Previous</button>
            <span className="font-mono text-[11px] text-cyan-400 font-bold">TASK {question + 1} OF {questions.length}</span>
            <span className="font-mono text-[10px] text-slate-400">LEVEL {level + 1}</span>
          </div>
          <div data-testid="mission-task" aria-busy={busy ? 'true' : 'false'}>
            <h2 className={`text-base md:text-lg font-bold leading-7 mt-5 ${dark ? 'text-white' : 'text-slate-900'}`}>{currentQuestion?.prompt || 'Loading investigation task…'}</h2>
            <div className="mt-4">{currentQuestion ? <TaskRenderer
                task={currentQuestion}
                value={answer}
                onChange={(value) => {
                  if (hasSubmittedCurrent) {
                    setFeedback({ correct: hasCorrectCurrent, message: 'Already answered. Your previous response is locked.' });
                    return;
                  }
                  setAnswer(value);
                }}
                disabled={busy}
                theme={theme}
              /> : <div role="status" className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs text-slate-400">Preparing the first investigation task…</div>}</div>
          </div>
          {hints.length > 0 && <div className={`mission-light-card mt-4 p-4 rounded-xl border text-xs leading-6 ${dark ? 'bg-violet-950/30 border-violet-500/40 text-violet-200' : 'bg-violet-50 border-violet-200 text-violet-900'}`}><div className="flex items-center gap-2 font-semibold"><span className="material-symbols-outlined text-[17px]">lightbulb</span>Helpful hint</div>{hints.map((hint, i) => <div key={i} className="mt-2"><strong>Hint {i + 1}:</strong> {hint}</div>)}</div>}
          {revealed && <div className={`mission-light-card mt-4 p-4 rounded-xl border text-xs leading-6 ${dark ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}><div className="flex items-center gap-2 font-semibold"><span className="material-symbols-outlined text-[17px]">visibility</span>Here’s the answer</div><div className="mt-2 font-semibold">{String(revealed.answer ?? '')}</div><span className={dark ? 'text-slate-300' : 'text-slate-600'}>{revealed.explanation || ''}</span></div>}
          {feedback && <div role="status" className={'mission-feedback mt-4 p-4 rounded-xl border text-xs leading-6 flex items-start gap-2 ' + (feedback.correct ? (dark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800') : (dark ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'))}><span className="material-symbols-outlined text-[18px] shrink-0">{feedback.correct ? 'check_circle' : 'info'}</span><span>{feedback.message}</span></div>}
          <div className="mt-5 flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              <button type="button" onClick={useHint} disabled={busy || !canUseHint} aria-label="Open a hint for 5 coins" title="Open a helpful hint · 5 coins" className={'mission-action-button inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ' + (dark ? 'border-violet-500/30 bg-[#181926] text-slate-300' : 'border-violet-200 bg-violet-50 text-violet-800') + ' disabled:opacity-50'}><span className="material-symbols-outlined text-[17px]">lightbulb</span><span>Get a hint · 5 coins</span></button>
              <button type="button" onClick={revealAnswer} disabled={busy || !canRevealAnswer} aria-label="Reveal the answer" title="Reveal the answer · 5 KP + 2 coins" className={'mission-action-button inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ' + (dark ? 'border-amber-500/30 bg-[#181926] text-slate-300' : 'border-amber-200 bg-amber-50 text-amber-800') + ' disabled:opacity-50'}><span className="material-symbols-outlined text-[17px]">visibility</span><span>{hasSubmittedCurrent ? 'Show answer · no extra cost' : 'Show answer · 5 KP + 2 coins'}</span></button>
            </div>
            {canMoveNext
              ? <button data-testid="mission-next" aria-label={isFinalChallenge ? (currentLevelComplete ? 'Finish Mission' : 'Review Final Level') : 'Move to Next'} onClick={moveNext} disabled={busy} className="mission-primary-action inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50"><span className="material-symbols-outlined text-[17px]">{isFinalChallenge && currentLevelComplete ? 'flag' : 'arrow_forward'}</span><span>{isFinalChallenge ? (currentLevelComplete ? 'Finish Mission' : 'Review Final Level') : 'Move to Next'}</span></button>
              : <button data-testid="mission-submit" aria-label="Submit mission answer" onClick={submit} disabled={busy || !currentQuestion} className="mission-primary-action inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50"><span className="material-symbols-outlined text-[17px]">check_circle</span><span>{busy ? 'Checking…' : 'Check Answer'}</span></button>}
          </div>
        </section>
        <aside className="col-span-12 xl:col-span-1 min-w-0">
          <div className={`rounded-2xl border p-4 ${dark ? 'bg-[#12131b] border-indigo-500/40' : 'bg-white border-indigo-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-indigo-300 uppercase">Simulation Sandbox</span>
              <span className="font-mono text-[9px] text-indigo-300">{simulation ? (simulationSaving ? 'SAVING…' : 'LIVE') : 'NOT CONFIGURED'}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{mission.requiredSimulation?.description || simulation?.purpose || 'Use the simulation to investigate the mission variables.'}</p>
            <div className="mt-3 max-h-[68vh] overflow-y-auto overflow-x-hidden overscroll-contain pr-1">
              {simulationSrc ? <iframe ref={simulationFrameRef} title="Nextess mission simulation" src={simulationSrc} onLoad={restoreSimulation} className="block w-full h-[760px] border-0 rounded-xl" allow="fullscreen" loading="eager" scrolling="no" /> : <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">The exact simulation asset is not available in the current frontend bundle. No substitute has been generated.</div>}
            </div>
            {simulation?.variables?.length > 0 && <div className="mt-3 pt-3 border-t border-indigo-500/20"><div className="font-mono text-[9px] text-indigo-300 uppercase">Variable controllers</div><div className="flex flex-wrap gap-1.5 mt-2">{simulation.variables.map((item: any) => <span key={item.variableKey} className="px-2 py-1 rounded-lg bg-[#181926] border border-indigo-500/20 text-[9px] text-slate-300">{item.label} · {item.unit || item.valueType || ''}</span>)}</div></div>}
            {simulation?.consequences?.length > 0 && <div className="mt-3 pt-3 border-t border-indigo-500/20"><div className="font-mono text-[9px] text-indigo-300 uppercase">Consequences</div>{simulation.consequences.map((item: any) => <div key={item.id || item.ordering} className="text-[9px] text-slate-400 mt-1">• {item.label}</div>)}</div>}
          </div>
        </aside>
      </div>
      <WindowPanel
        open={levelReward.open}
        onClose={() => setLevelReward(v => ({...v, open:false}))}
        theme={theme}
        title={levelReward.perfect ? 'Perfect level achievement' : 'Level reward'}
        ariaLabel={levelReward.perfect ? 'Perfect level achievement' : 'Level reward'}
      >
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 flex items-center justify-center mt-4">
            <span className="material-symbols-outlined text-[34px]">workspace_premium</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[.2em] text-amber-400 mt-4">Level {levelReward.level} completed</div>
          <h2 className="text-2xl font-bold mt-2">{levelReward.perfect ? 'Perfect level!' : 'Rewards earned'}</h2>
          {levelReward.perfect && <p className="text-xs text-slate-400 mt-2">You completed every challenge correctly. A Perfect Level badge has been recorded for this level.</p>}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className={`rounded-2xl border p-4 ${dark ? 'bg-violet-500/10 border-violet-500/25' : 'bg-violet-50 border-violet-200'}`}><div className="font-mono text-[10px] uppercase text-violet-400">KP</div><div className="text-2xl font-bold mt-1">{levelReward.xp}</div></div>
            <div className={`rounded-2xl border p-4 ${dark ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-200'}`}><div className="font-mono text-[10px] uppercase text-amber-400">Coins</div><div className="text-2xl font-bold mt-1">{levelReward.coins}</div></div>
          </div>
          {levelReward.balances && <p className="mt-4 text-xs text-slate-400">Current balance: {levelReward.balances.xp} KP · {levelReward.balances.coins} coins</p>}
          <div className="flex justify-end mt-6">
            <button
              type="button"
              disabled={levelReward.badgeClaiming}
              onClick={async () => {
                if (levelReward.perfect && !levelReward.badgeClaimed) {
                  setLevelReward(v => ({...v, badgeClaiming:true}));
                  try {
                    await api.claimBadge('perfect-mission');
                    setLevelReward(v => ({...v, badgeClaimed:true, badgeClaiming:false}));
                  } catch (e:any) {
                    setFeedback({correct:false,message:e?.message || 'The badge could not be claimed yet.'});
                    setLevelReward(v => ({...v, badgeClaiming:false}));
                    return;
                  }
                }
                setLevelReward(v => ({...v, open:false}));
                void moveNext();
              }}
              className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50"
            >
              {levelReward.perfect && !levelReward.badgeClaimed ? (levelReward.badgeClaiming ? 'Claiming…' : 'Claim badge & continue') : 'Continue Mission'}
            </button>
          </div>
        </div>
      </WindowPanel>

    </div>
  );
};

const Header = ({ theme, mission, progress, label, onExit, stages, onStageSelect }: any) => {
  const dark = theme === 'dark';
  return (
  <div className={`relative overflow-hidden rounded-2xl p-5 border shadow-2xl ${dark ? 'border-violet-500/40 bg-[#12131b]' : 'border-violet-200 bg-white'}`}>
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/40 text-violet-400 font-mono text-[10px] uppercase">Discipline: {mission.subject?.displayName || ''}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono text-[10px] uppercase">Difficulty: {mission.currentPublishedVersion?.contentMetadata?.difficulty || mission.difficulty || 'Easy'}</span>
        </div>
        <h1 className={`text-2xl md:text-3xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{mission.title}</h1>
      </div>
      <div className={`flex items-center gap-4 px-5 py-3 rounded-2xl border ${dark ? 'bg-[#181926]/90 border-cyan-500/30' : 'bg-violet-50 border-cyan-200'}`}>
        <div><span className="font-mono text-[10px] text-slate-400 uppercase">Path Progress</span><div className="flex items-baseline gap-1.5"><span className="text-xl text-violet-400 font-bold">{progress}%</span><span className="text-xs text-slate-400 font-mono">{label}</span></div><div className="w-40 h-2 rounded-full bg-slate-700/30 overflow-hidden mt-1"><div className="h-full bg-gradient-to-r from-violet-600 to-indigo-400 rounded-full" style={{ width: `${progress}%` }} /></div></div>

      </div>
    </div>
    {stages?.length > 0 && <MissionStageNavigator stages={stages} onSelect={onStageSelect} />}
    <button type="button" onClick={onExit} aria-label="Exit Mission" className={`absolute right-5 bottom-5 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${dark ? 'border-slate-600 bg-[#181926] text-slate-200 hover:bg-[#202131]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
      <span className="material-symbols-outlined text-[16px]">logout</span>Exit Mission
    </button>
  </div>
);
}

const Meta = ({ label, value, dark }: { label: string; value: string; dark: boolean }) => (
  <div className={`rounded-xl p-3 border border-violet-500/15 ${dark ? 'bg-[#181926]' : 'bg-violet-50'}`}><span className="font-mono text-[9px] text-slate-400 uppercase">{label}</span><span className={`block text-sm font-semibold mt-1 ${dark ? 'text-white' : 'text-slate-900'}`}>{value}</span></div>
);
