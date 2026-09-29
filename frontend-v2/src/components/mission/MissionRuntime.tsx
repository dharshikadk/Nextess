import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import { TaskRenderer, MissionTask } from './TaskRendererRegistry';

type Props = { theme: 'dark' | 'light'; onExit: () => void; onShowToast: (message: string) => void };

const simulationPath = (fileName?: string) => {
  const file = String(fileName || '').trim().replace(/^\/+/, '');
  if (!file || !/^[A-Za-z0-9._/-]+$/.test(file)) return null;
  return file.startsWith('simulations/') ? '/' + file : '/simulations/' + file;
};

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
  const [reward, setReward] = useState<any>(null);
  const [fileIndex, setFileIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const capsules = mission?.currentPublishedVersion?.contentMetadata?.learningCapsule?.sections || [];
  const levels = investigation?.projectVersion?.levels || mission?.currentPublishedVersion?.levels || [];
  const currentLevel = levels[level];
  const questions = currentLevel?.questions || [];
  const currentQuestion = questions[question] as MissionTask | undefined;
  const files = investigation?.projectVersion?.caseFiles || mission?.currentPublishedVersion?.caseFiles || mission?.requiredEvidence?.files || [];
  const file = files[fileIndex] || files[0];
  const simulation = currentLevel?.simulation;
  const simulationFile = simulation?.configuration?.fileName || mission?.requiredSimulation?.fileName;
  const simulationSrc = simulationPath(simulationFile);

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
        if (!cancelled) setMission(result.project);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Mission could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [missionId]);

  const submit = async () => {
    if (!investigation?.id || !currentQuestion || busy) return;
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
        crypto.randomUUID()
      );
      setFeedback({
        correct: result.result === 'CORRECT',
        message: result.result === 'CORRECT'
          ? 'Correct.'
          : (result.penalty?.xp || result.penalty?.coins
            ? `-${result.penalty.xp || 0} KP, -${result.penalty.coins || 0} coins. Try again.`
            : 'Not correct. Try again.'),
      });
      window.dispatchEvent(new CustomEvent('nextess-mission-updated', { detail: result }));
      const refreshed = await refreshInvestigation();
      if (result.levelCompleted) {
        setReward({ title: currentLevel?.title || `Level ${level + 1}`, result, final: Boolean(result.missionCompleted) });
      } else if (result.result === 'CORRECT') {
        const refreshedQuestions = refreshed?.projectVersion?.levels?.[level]?.questions || [];
        const next = refreshedQuestions.findIndex((item: any) =>
          !(refreshed?.answers || []).some((a: any) => a.questionId === item.id && a.result === 'CORRECT')
        );
        setQuestion(next >= 0 ? next : question + 1);
        setAnswer('');
        setHints([]);
        setRevealed(null);
      }
    } catch (e: any) {
      setFeedback({ correct: false, message: e?.message || 'Submission failed. Retry.' });
    } finally {
      setBusy(false);
    }
  };

  const useHint = async () => {
    if (!investigation?.id || !currentQuestion || busy) return;
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
      window.dispatchEvent(new CustomEvent('nextess-mission-updated', { detail: result }));
    } catch (e: any) {
      setFeedback({ correct: false, message: e?.message || 'Unable to reveal the answer.' });
    } finally {
      setBusy(false);
    }
  };

  const continueReward = async () => {
    const final = reward?.final;
    setReward(null);
    setFeedback(null);
    setAnswer('');
    setHints([]);
    setRevealed(null);
    if (final) { setStage('complete'); return; }
    try {
      const refreshed = await refreshInvestigation();
      const index = (refreshed?.projectVersion?.levels || []).findIndex((item: any) => item.id === refreshed?.currentLevelId);
      setLevel(index >= 0 ? index : level + 1);
      setQuestion(0);
    } catch {}
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

  const stageNumber = stage === 'brief' ? 1 : stage === 'capsule' ? 2 : stage === 'complete' ? levels.length + 3 : level + 3;
  const totalStages = Math.max(3, levels.length + 3);
  const progress = Math.round(((stageNumber - 1) / (totalStages - 1)) * 100);

  const shell = `rounded-2xl border shadow-2xl ${dark ? 'bg-[#12131b] border-violet-500/40' : 'bg-white border-violet-200'}`;

  if (loading) return <div className="min-h-[calc(100vh-120px)] flex items-center justify-center text-sm text-slate-400">Loading mission...</div>;
  if (error || !mission) return (
    <section className={`${shell} p-8`}>
      <div className="font-mono text-[10px] uppercase text-rose-400">Mission runtime</div>
      <h2 className="text-xl font-bold mt-2">Mission could not be opened</h2>
      <p className="text-sm text-slate-400 mt-2">{error || 'Mission not found.'}</p>
      <button onClick={onExit} className="mt-5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold">Return</button>
    </section>
  );

  if (stage === 'brief') return (
    <div className="w-full pb-16">
      <Header mission={mission} progress={progress} label="STAGE 01 / MISSION BRIEF" onExit={onExit} />
      <section className={`${shell} mt-5 p-6`}>
        <div className="max-w-[1100px] mx-auto">
          <div className="rounded-2xl border border-amber-500/40 bg-[#0f1017] p-6">
            <div className="font-mono text-[10px] text-amber-400 uppercase">Case File · Overview</div>
            <h2 className="text-lg font-bold text-white mt-1">{mission.title}</h2>
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-[#12131b] p-4">
              <div className="font-mono text-[10px] text-amber-400 uppercase font-bold">Primary Objective</div>
              <p className="text-base leading-7 text-slate-200 mt-2">{mission.mission}</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <Meta label="Role" value={mission.role || '—'} />
              <Meta label="Difficulty" value={mission.currentPublishedVersion?.contentMetadata?.difficulty || mission.difficulty || 'Easy'} />
              <Meta label="Mission Type" value={mission.problemType || '—'} />
            </div>
            <div className="mt-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="font-mono text-[9px] text-emerald-400 uppercase">Evidence requirement</div>
              <p className="text-xs text-slate-300 mt-1">{mission.requiredEvidence?.instruction || 'Use the provided mission evidence.'}</p>
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <button onClick={() => setStage('capsule')} className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">Next · Learning Capsule</button>
          </div>
        </div>
      </section>
    </div>
  );

  if (stage === 'capsule') {
    const section = capsules[capsule];
    return (
      <div className="w-full pb-16">
        <Header mission={mission} progress={progress} label="STAGE 02 / LEARNING CAPSULE" onExit={onExit} />
        <section className={`${shell} mt-5 p-6`}>
          <div className="max-w-[1000px] mx-auto">
            <div className="flex gap-2 mb-5 overflow-x-auto">
              {capsules.map((item: any, index: number) => (
                <button key={item.title} onClick={() => setCapsule(index)} className={`px-3 py-2 rounded-xl text-xs font-mono min-w-[140px] ${index === capsule ? 'bg-violet-600 text-white font-bold' : 'bg-[#181926] text-slate-400'}`}>
                  {index + 1}. {item.title}
                </button>
              ))}
            </div>
            <article className="max-w-[700px] min-h-[360px] mx-auto rounded-[24px] border-2 border-violet-500/40 bg-[#12131b] p-8 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-violet-400">CONCEPT {capsule + 1} / {capsules.length}</span>
                <h2 className="text-2xl font-bold text-white mt-3">{section?.title}</h2>
                <div className="w-12 h-1 rounded-full bg-violet-500 mt-3" />
                <p className="text-base leading-7 text-slate-200 mt-5">{section?.content}</p>
              </div>
              <div className="flex flex-wrap justify-between gap-2 mt-8">
                <button disabled={capsule === 0} onClick={() => setCapsule((v) => Math.max(0, v - 1))} className="px-4 py-2.5 rounded-xl border border-violet-500/30 bg-[#181926] text-slate-300 text-xs disabled:opacity-40">Previous</button>
                <div className="flex gap-2">
                  <button onClick={startMission} disabled={busy} className="px-4 py-2.5 rounded-xl border border-violet-500/30 bg-[#181926] text-slate-300 text-xs">Skip to levels</button>
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
    <div className="w-full pb-16">
      <Header mission={mission} progress={100} label="FINAL STAGE / CELEBRATION" onExit={onExit} />
      <section className="mt-5 max-w-[900px] mx-auto rounded-[28px] border-2 border-emerald-500/40 bg-[#0f1017] p-8 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
          <span className="material-symbols-outlined text-[42px]">celebration</span>
        </div>
        <div className="font-mono text-[10px] text-emerald-400 uppercase tracking-[.2em] mt-5">Investigation completed</div>
        <h2 className="text-3xl font-bold text-white mt-2">{mission.title}</h2>
        <p className="text-slate-300 text-sm leading-6 mt-3">All mission levels were completed and server-authoritative rewards were applied.</p>
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
    <div className="w-full pb-16">
      <Header mission={mission} progress={progress} label={`LEVEL ${currentLevel?.levelNumber ?? level + 1} / ${currentLevel?.title || 'MISSION'}`} onExit={onExit} />
      <div className="grid grid-cols-12 gap-5 mt-5 items-start">
        <div className="col-span-12 lg:col-span-3">{missionPanel}</div>
        <section className={`${shell} col-span-12 lg:col-span-6 p-6`}>
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 gap-3">
            <button onClick={() => {
              if (question > 0) setQuestion((v) => v - 1);
              else if (level > 0) setLevel((v) => v - 1);
              else setStage('capsule');
              setAnswer(''); setFeedback(null); setHints([]); setRevealed(null);
            }} className="px-3 py-1.5 rounded-xl border bg-[#181926] border-cyan-500/30 text-xs text-slate-300">← Previous</button>
            <span className="font-mono text-[11px] text-cyan-400 font-bold">TASK {question + 1} OF {questions.length}</span>
            <span className="font-mono text-[10px] text-slate-400">LEVEL {level + 1}</span>
          </div>
          <h2 className="text-base md:text-lg font-bold leading-7 text-white mt-5">{currentQuestion?.prompt}</h2>
          <div className="mt-4">{currentQuestion && <TaskRenderer task={currentQuestion} value={answer} onChange={setAnswer} disabled={busy} />}</div>
          {hints.length > 0 && <div className="mt-4 p-4 rounded-xl border bg-violet-950/30 border-violet-500/40 text-violet-200 text-xs leading-6">{hints.map((hint, i) => <div key={i}><strong>Hint {i + 1}:</strong> {hint}</div>)}</div>}
          {revealed && <div className="mt-4 p-4 rounded-xl border bg-amber-950/30 border-amber-500/40 text-amber-200 text-xs leading-6"><strong>Answer:</strong> {String(revealed.answer ?? '')}<br /><span className="text-slate-300">{revealed.explanation || ''}</span></div>}
          {feedback && <div role="status" className={`mt-4 p-4 rounded-xl border text-xs leading-6 ${feedback.correct ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/30 border-rose-500/40 text-rose-200'}`}>{feedback.message}</div>}
          <div className="mt-5 flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              <button onClick={useHint} disabled={busy} className="px-3 py-2 rounded-xl border border-violet-500/30 bg-[#181926] text-slate-300 text-xs">Hint</button>
              <button onClick={revealAnswer} disabled={busy} className="px-3 py-2 rounded-xl border border-amber-500/30 bg-[#181926] text-slate-300 text-xs">Reveal answer</button>
            </div>
            <button onClick={submit} disabled={busy} className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50">{busy ? 'Submitting…' : 'Submit'}</button>
          </div>
        </section>
        <aside className="col-span-12 lg:col-span-3">
          <div className={`rounded-2xl border p-4 ${dark ? 'bg-[#12131b] border-indigo-500/40' : 'bg-white border-indigo-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-indigo-300 uppercase">Simulation Sandbox</span>
              <span className="font-mono text-[9px] text-indigo-300">{simulation ? 'LIVE' : 'NOT CONFIGURED'}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{mission.requiredSimulation?.description || simulation?.purpose || 'Use the simulation to investigate the mission variables.'}</p>
            <div className="mt-3">
              {simulationSrc ? <iframe title="Nextess mission simulation" src={simulationSrc} className="w-full h-[450px] border-0 rounded-xl" allow="fullscreen" loading="eager" /> : <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">The exact simulation asset is not available in the current frontend bundle. No substitute has been generated.</div>}
            </div>
            {simulation?.variables?.length > 0 && <div className="mt-3 pt-3 border-t border-indigo-500/20"><div className="font-mono text-[9px] text-indigo-300 uppercase">Variable controllers</div><div className="flex flex-wrap gap-1.5 mt-2">{simulation.variables.map((item: any) => <span key={item.variableKey} className="px-2 py-1 rounded-lg bg-[#181926] border border-indigo-500/20 text-[9px] text-slate-300">{item.label} · {item.unit || item.valueType || ''}</span>)}</div></div>}
            {simulation?.consequences?.length > 0 && <div className="mt-3 pt-3 border-t border-indigo-500/20"><div className="font-mono text-[9px] text-indigo-300 uppercase">Consequences</div>{simulation.consequences.map((item: any) => <div key={item.id || item.ordering} className="text-[9px] text-slate-400 mt-1">• {item.label}</div>)}</div>}
          </div>
        </aside>
      </div>
      {reward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-[430px] rounded-3xl border-2 border-violet-500/50 bg-[#12131b] shadow-2xl p-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center text-emerald-300"><span className="material-symbols-outlined text-[34px]">celebration</span></div>
              <div className="font-mono text-[10px] text-emerald-400 uppercase tracking-[.2em] mt-4">Level completed</div>
              <h2 className="text-2xl font-bold text-white mt-1">{reward.title}</h2>
              <div className="grid grid-cols-2 gap-3 mt-5"><Meta label="KP earned" value={`+${reward.result?.reward?.xp || 0}`} /><Meta label="Coins earned" value={`+${reward.result?.reward?.coins || 0}`} /></div>
              <button onClick={continueReward} className="w-full mt-5 py-3 rounded-xl bg-violet-600 text-white text-xs font-bold">{reward.final ? 'View Mission Celebration' : 'Continue to Next Level'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Header = ({ mission, progress, label, onExit }: any) => (
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
  </div>
);

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl p-3 border border-violet-500/15 bg-[#181926]"><span className="font-mono text-[9px] text-slate-400 uppercase">{label}</span><span className="block text-sm font-semibold text-white mt-1">{value}</span></div>
);
