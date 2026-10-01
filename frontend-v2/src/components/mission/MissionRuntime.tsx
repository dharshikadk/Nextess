import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import { TaskRenderer, MissionTask } from './TaskRendererRegistry';
import { MissionStageNavigator, MissionStage } from './MissionStageNavigator';
import { resolveSimulationSource } from '../../data/simulationRegistry';

type Props = { theme: 'dark' | 'light'; onExit: () => void; onShowToast: (message: string) => void };

export const MissionRuntime: React.FC<Props> = ({ theme, onExit, onShowToast }) => {
  const dark = theme === 'dark';
  const missionId = localStorage.getItem('nextess_selected_mission') || '';
  const [mission, setMission] = useState<any>(null);
  const [investigation, setInvestigation] = useState<any>(null);
  const [stage, setStage] = useState<'brief' | 'capsule' | 'level' | 'complete'>('brief');
  const [capsule, setCapsule] = useState(0);
  const [level, setLevel] = useState(0);
  const [question, setQuestion] = useState(0);
  const [answer, setAnswer] = useState<unknown>('');
  const [feedback, setFeedback] = useState<any>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<any>(null);
  const [revealLock, setRevealLock] = useState(false);
  const [revealedQuestionId, setRevealedQuestionId] = useState<string | null>(null);
  const [fileIndex, setFileIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [simulationSaving, setSimulationSaving] = useState(false);
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
  const simulationFile = simulation?.configuration?.fileName || mission?.requiredSimulation?.fileName;
  const simulationSrc = resolveSimulationSource(simulationFile);
  const currentAnswers = (investigation?.answers || []).filter((item:any) => item.questionId === currentQuestion?.id);
  const hasSubmittedCurrent = currentAnswers.length > 0;
  const hasCorrectCurrent = currentAnswers.some((item:any) => item.result === 'CORRECT');
  const isFinalChallenge = level === levels.length - 1 && question === questions.length - 1;

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
      const result = await api.investigation(started.investigationId);
      const inv = result.investigation;
      setInvestigation(inv);
      const invLevels = inv?.projectVersion?.levels || [];
      const index = invLevels.findIndex((item: any) => item.id === inv.currentLevelId);
      const nextLevel = index >= 0 ? index : 0;
      setLevel(nextLevel);
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
        setMission(result.project);

        if (result.progress?.status === 'IN_PROGRESS') {
          const started = await api.startMission(missionId);
          if (cancelled) return;
          const investigationResult = await api.investigation(started.investigationId);
          if (cancelled) return;
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
        setRevealedQuestionId(null);
        setRevealLock(false);
        setStage('level');
      }
    }
  };

  const stageNumber = stage === 'brief' ? 1 : stage === 'capsule' ? 2 : stage === 'complete' ? levels.length + 3 : level + 3;
  const totalStages = Math.max(3, levels.length + 3);
  const progress = Math.round(((stageNumber - 1) / (totalStages - 1)) * 100);


  const submit = async () => {
    if (!investigation?.id || !currentQuestion || busy || revealLock) return;
    if (answer === '' || answer == null) {
      setFeedback({ correct: false, message: 'Select an option or enter an answer before submitting.' });
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
      setFeedback({
        correct: result.result === 'CORRECT',
        message: result.result === 'CORRECT'
          ? `Correct.${result.reward?.xp || result.reward?.coins ? ` +${result.reward.xp || 0} KP, +${result.reward.coins || 0} coins.` : ''}`
          : (result.penalty?.xp || result.penalty?.coins
            ? `-${result.penalty.xp || 0} KP, -${result.penalty.coins || 0} coins. Try again.`
            : 'Not correct. Try again.'),
      });
      window.dispatchEvent(new CustomEvent('nextess-mission-updated', { detail: result }));
      await refreshInvestigation();
      setRevealLock(false);
      setRevealedQuestionId(null);
      setRevealed(null);
    } catch (e: any) {
      setFeedback({ correct: false, message: e?.message || 'Submission failed. Retry.' });
    } finally {
      setBusy(false);
    }
  };

  const moveNext = async () => {
    if (!currentQuestion || busy) return;
    if (revealLock) {
      if (question + 1 < questions.length) {
        setQuestion(v => v + 1);
        setAnswer('');
        setRevealed(null);
        setFeedback({ correct: false, message: 'This challenge was revealed. Return to it and answer it before submitting the following challenges.' });
        return;
      }
      setFeedback({ correct: false, message: 'Answer this revealed challenge before finishing the mission.' });
      return;
    }
    const currentLevelComplete = hasCorrectCurrent && questions.length > 0 && questions.every((q:any) =>
      (investigation?.answers || []).some((a:any) => a.questionId === q.id && a.result === 'CORRECT')
    );
    if (currentLevelComplete) {
      if (isFinalChallenge) {
        await finalize();
        setStage('complete');
        return;
      }
      const refreshed = await refreshInvestigation();
      const nextLevelIndex = (refreshed?.projectVersion?.levels || []).findIndex((item:any) => item.id === refreshed?.currentLevelId);
      setLevel(nextLevelIndex >= 0 ? nextLevelIndex : level + 1);
      setQuestion(0);
    } else if (question + 1 < questions.length) {
      setQuestion(v => v + 1);
    } else if (level + 1 < levels.length) {
      const refreshed = await refreshInvestigation();
      const nextLevelIndex = (refreshed?.projectVersion?.levels || []).findIndex((item:any) => item.id === refreshed?.currentLevelId);
      setLevel(nextLevelIndex >= 0 ? nextLevelIndex : level + 1);
      setQuestion(0);
    }
    setAnswer('');
    setFeedback(null);
    setHints([]);
    setRevealed(null);
  };

  const useHint = async () => {
    if (!investigation?.id || !currentQuestion || busy || revealLock) return;
    setBusy(true);
    try {
      const result = await api.useHint(investigation.id, currentQuestion.id);
      setHints((items) => [...items, result.hint]);
      window.dispatchEvent(new CustomEvent('nextess-mission-updated', { detail: result }));
    } catch (e: any) {
      setFeedback({ correct: false, message: e?.message || 'Unable to reveal a hint.' });
    } finally {
      setBusy(false);
    }
  };

  const revealAnswer = async () => {
    if (!investigation?.id || !currentQuestion || busy) return;
    setBusy(true);
    try {
      const result = await api.revealAnswer(investigation.id, currentQuestion.id);
      setRevealed(result);
      setRevealedQuestionId(currentQuestion.id);
      setRevealLock(!hasSubmittedCurrent);
      window.dispatchEvent(new CustomEvent('nextess-mission-updated', { detail: result }));
    } catch (e: any) {
      setFeedback({ correct: false, message: e?.message || 'Unable to reveal the answer.' });
    } finally {
      setBusy(false);
    }
  };

  const finalize = async () => {
    if (!investigation?.id) return;
    try {
      await api.completeMission(investigation.id);
      window.dispatchEvent(new Event('nextess-mission-updated'));
      onShowToast('Mission completion recorded.');
    } catch (e: any) {
      onShowToast(e?.message || 'Mission completion could not be finalized.');
    }
  };

  useEffect(() => {
    if (!investigation?.id || !simulation?.id || !simulationSrc) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== simulationFrameRef.current?.contentWindow) return;
      const payload = event.data;
      if (payload?.type !== 'nextess-simulation-state' || !payload.state || typeof payload.state !== 'object') return;
      if (timer) clearTimeout(timer);
      setSimulationSaving(true);
      timer = setTimeout(() => {
        api.simulationState(investigation.id, simulation.id, payload.state)
          .catch((e: any) => setFeedback({ correct: false, message: e?.message || 'Simulation state could not be saved.' }))
          .finally(() => setSimulationSaving(false));
      }, 250);
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (timer) clearTimeout(timer);
    };
  }, [investigation?.id, simulation?.id, simulationSrc]);

  const restoreSimulation = () => {
    const state = investigation?.state?.simulations?.[simulation?.id];
    if (!state || !simulationFrameRef.current?.contentWindow) return;
    simulationFrameRef.current.contentWindow.postMessage(
      { type: 'nextess-simulation-restore', state },
      window.location.origin
    );
  };

  const shell = `rounded-2xl border shadow-2xl ${dark ? 'bg-[#12131b] border-violet-500/40' : 'bg-white border-violet-200'}`;

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
      <Header mission={mission} progress={progress} label="STAGE 01 / MISSION BRIEF" onExit={onExit} stages={stageItems} onStageSelect={selectStage} />
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
              <Meta label="Role" value={mission.role || '—'} />
              <Meta label="Difficulty" value={mission.currentPublishedVersion?.contentMetadata?.difficulty || mission.difficulty || 'Easy'} />
              <Meta label="Mission Type" value={mission.problemType || '—'} />
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
      <div className={`mission-runtime ${dark ? 'mission-runtime-dark' : 'mission-runtime-light'} w-full pb-16`}>
        <Header mission={mission} progress={progress} label="STAGE 02 / LEARNING CAPSULE" onExit={onExit} stages={stageItems} onStageSelect={selectStage} />
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
    <div className={`mission-runtime ${dark ? 'mission-runtime-dark' : 'mission-runtime-light'} w-full pb-16`}>
      <Header mission={mission} progress={100} label="FINAL STAGE / CELEBRATION" onExit={onExit} stages={stageItems} onStageSelect={selectStage} />
      <section className={`mt-5 max-w-[900px] mx-auto rounded-[28px] border-2 border-emerald-500/40 p-8 text-center ${dark ? 'bg-[#0f1017]' : 'bg-white'}`}>
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
          <span className="material-symbols-outlined text-[42px]">celebration</span>
        </div>
        <div className="font-mono text-[10px] text-emerald-400 uppercase tracking-[.2em] mt-5">Investigation completed</div>
        <h2 className={`text-3xl font-bold mt-2 ${dark ? 'text-white' : 'text-slate-900'}`}>{mission.title}</h2>
        <p className={`text-sm leading-6 mt-3 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>All mission levels were completed and server-authoritative rewards were applied.</p>
        <button onClick={finalize} className="mt-5 px-5 py-3 rounded-xl bg-violet-600 text-white text-xs font-bold">Finalize completion</button>
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
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-[#07080c] overflow-hidden">
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
    <div className={`mission-runtime ${dark ? 'mission-runtime-dark' : 'mission-runtime-light'} w-full pb-16`}>
      <Header mission={mission} progress={progress} label={`LEVEL ${currentLevel?.levelNumber ?? level + 1} / ${currentLevel?.title || 'MISSION'}`} onExit={onExit} stages={stageItems} onStageSelect={selectStage} />
      <div className="flex justify-end mt-3"><button type="button" onClick={onExit} className={`px-4 py-2 rounded-xl border text-xs font-semibold ${dark ? 'bg-[#12131b] border-rose-500/30 text-slate-300' : 'bg-white border-rose-200 text-rose-700'}`}>Exit Mission</button></div>
      <div className="grid grid-cols-12 gap-5 mt-5 items-start">
        <div className="col-span-12 lg:col-span-3">{missionPanel}</div>
        <section className={`${shell} col-span-12 lg:col-span-6 p-6`}>
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 gap-3">
            <button onClick={() => {
              const targetQuestion = question > 0 ? questions[question - 1] : null;
              const targetId = targetQuestion?.id || (level > 0 ? levels[level - 1]?.questions?.at(-1)?.id : null);
              if (question > 0) setQuestion((v) => v - 1);
              else if (level > 0) { setLevel((v) => v - 1); setQuestion(Math.max(0, (levels[level - 1]?.questions?.length || 1) - 1)); }
              else setStage('capsule');
              setRevealLock(Boolean(revealedQuestionId && targetId && revealedQuestionId !== targetId));
              setAnswer(''); setFeedback(null); setHints([]);
            }} className={`px-3 py-1.5 rounded-xl border text-xs ${dark ? 'bg-[#181926] border-cyan-500/30 text-slate-300' : 'bg-white border-slate-300 text-slate-700'}`}>← Previous</button>
            <span className="font-mono text-[11px] text-cyan-400 font-bold">TASK {question + 1} OF {questions.length}</span>
            <span className="font-mono text-[10px] text-slate-400">LEVEL {level + 1}</span>
          </div>
          <div data-testid="mission-task" aria-busy={busy ? 'true' : 'false'}>
            <h2 className="text-base md:text-lg font-bold leading-7 text-white mt-5">{currentQuestion?.prompt || 'Loading investigation task…'}</h2>
            <div className="mt-4">{currentQuestion ? <TaskRenderer task={currentQuestion} value={answer} onChange={setAnswer} disabled={busy || revealLock} theme={theme} /> : <div role="status" className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs text-slate-400">Preparing the first investigation task…</div>}</div>
          </div>
          {hints.length > 0 && <div className="mt-4 p-4 rounded-xl border bg-violet-950/30 border-violet-500/40 text-violet-200 text-xs leading-6">{hints.map((hint, i) => <div key={i}><strong>Hint {i + 1}:</strong> {hint}</div>)}</div>}
          {revealed && <div className="mt-4 p-4 rounded-xl border bg-amber-950/30 border-amber-500/40 text-amber-200 text-xs leading-6"><strong>Answer:</strong> {String(revealed.answer ?? '')}<br /><span className="text-slate-300">{revealed.explanation || ''}</span></div>}
          {feedback && <div role="status" className={`mt-4 p-4 rounded-xl border text-xs leading-6 ${feedback.correct ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/30 border-rose-500/40 text-rose-200'}`}>{feedback.message}</div>}
          <div className="mt-5 flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              <button onClick={useHint} disabled={busy || revealLock} className={`px-3 py-2 rounded-xl border text-xs ${dark ? 'border-violet-500/30 bg-[#181926] text-slate-300' : 'border-violet-200 bg-violet-50 text-violet-800'} disabled:opacity-50`}>Use 5 coins to show hints</button>
              <button onClick={revealAnswer} disabled={busy || revealLock} className={`px-3 py-2 rounded-xl border text-xs ${dark ? 'border-amber-500/30 bg-[#181926] text-slate-300' : 'border-amber-200 bg-amber-50 text-amber-800'} disabled:opacity-50`}>{hasSubmittedCurrent ? 'Reveal answer · no charge' : 'Reveal answer · 5 KP · 2 coins'}</button>
            </div>
            {revealed || hasCorrectCurrent
              ? <button data-testid="mission-next" aria-label={isFinalChallenge ? 'Finish Mission' : 'Move to Next'} onClick={moveNext} disabled={busy} className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50">{isFinalChallenge ? 'Finish Mission' : 'Move to Next'}</button>
              : <button data-testid="mission-submit" aria-label="Submit mission answer" onClick={submit} disabled={busy || !currentQuestion || revealLock} className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50">{busy ? 'Submitting…' : 'Submit'}</button>}
          </div>
        </section>
        <aside className="col-span-12 lg:col-span-3">
          <div className={`rounded-2xl border p-4 ${dark ? 'bg-[#12131b] border-indigo-500/40' : 'bg-white border-indigo-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-indigo-300 uppercase">Simulation Sandbox</span>
              <span className="font-mono text-[9px] text-indigo-300">{simulation ? (simulationSaving ? 'SAVING…' : 'LIVE') : 'NOT CONFIGURED'}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{mission.requiredSimulation?.description || simulation?.purpose || 'Use the simulation to investigate the mission variables.'}</p>
            <div className="mt-3">
              {simulationSrc ? <iframe ref={simulationFrameRef} title="Nextess mission simulation" src={simulationSrc} onLoad={restoreSimulation} className="w-full h-[450px] border-0 rounded-xl" allow="fullscreen" loading="eager" /> : <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">The exact simulation asset is not available in the current frontend bundle. No substitute has been generated.</div>}
            </div>
            {simulation?.variables?.length > 0 && <div className="mt-3 pt-3 border-t border-indigo-500/20"><div className="font-mono text-[9px] text-indigo-300 uppercase">Variable controllers</div><div className="flex flex-wrap gap-1.5 mt-2">{simulation.variables.map((item: any) => <span key={item.variableKey} className="px-2 py-1 rounded-lg bg-[#181926] border border-indigo-500/20 text-[9px] text-slate-300">{item.label} · {item.unit || item.valueType || ''}</span>)}</div></div>}
            {simulation?.consequences?.length > 0 && <div className="mt-3 pt-3 border-t border-indigo-500/20"><div className="font-mono text-[9px] text-indigo-300 uppercase">Consequences</div>{simulation.consequences.map((item: any) => <div key={item.id || item.ordering} className="text-[9px] text-slate-400 mt-1">• {item.label}</div>)}</div>}
          </div>
        </aside>
      </div>
    </div>
  );
};

const Header = ({ mission, progress, label, onExit, stages, onStageSelect }: any) => (
  <div className="relative overflow-hidden rounded-2xl p-5 border border-violet-500/40 bg-[#12131b] shadow-2xl">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/40 text-violet-400 font-mono text-[10px] uppercase">Discipline: {mission.subject?.displayName || ''}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono text-[10px] uppercase">Difficulty: {mission.currentPublishedVersion?.contentMetadata?.difficulty || mission.difficulty || 'Easy'}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{mission.title}</h1>
      </div>
      <div className="flex items-center gap-4 px-5 py-3 rounded-2xl border bg-[#181926]/90 border-cyan-500/30">
        <div><span className="font-mono text-[10px] text-slate-400 uppercase">Path Progress</span><div className="flex items-baseline gap-1.5"><span className="text-xl text-violet-400 font-bold">{progress}%</span><span className="text-xs text-slate-400 font-mono">{label}</span></div><div className="w-40 h-2 rounded-full bg-slate-700/30 overflow-hidden mt-1"><div className="h-full bg-gradient-to-r from-violet-600 to-indigo-400 rounded-full" style={{ width: `${progress}%` }} /></div></div>
        <button onClick={onExit} className="px-3 py-2 rounded-xl border border-rose-500/30 bg-[#181926] text-xs text-slate-300">Exit</button>
      </div>
    </div>
    {stages?.length > 0 && <MissionStageNavigator stages={stages} onSelect={onStageSelect} />}
  </div>
);

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl p-3 border border-violet-500/15 bg-[#181926]"><span className="font-mono text-[9px] text-slate-400 uppercase">{label}</span><span className="block text-sm font-semibold text-white mt-1">{value}</span></div>
);
