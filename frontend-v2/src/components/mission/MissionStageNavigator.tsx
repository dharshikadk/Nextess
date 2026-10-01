import React from 'react';
export type MissionStageState='locked'|'available'|'current'|'in-progress'|'completed'|'unavailable';
export type MissionStage={key:string;label:string;state:MissionStageState};
type Props={stages:MissionStage[];onSelect?:(stage:MissionStage)=>void;theme?:'dark'|'light'};
export const MissionStageNavigator:React.FC<Props>=({stages,onSelect,theme='dark'})=>(
  <nav aria-label="Mission stages" className="flex gap-2 overflow-x-auto py-2">
    {stages.map((stage,index)=>{const dark=theme==='dark';const interactive=stage.state!=='locked'&&stage.state!=='unavailable'&&Boolean(onSelect);return(
      <button key={stage.key} type="button" disabled={!interactive} aria-current={stage.state==='current'?'step':undefined}
        aria-label={'Stage '+(index+1)+': '+stage.label+', '+stage.state} onClick={()=>interactive&&onSelect?.(stage)}
        className={[
          'min-w-[132px] rounded-xl border px-3 py-2 text-left text-[10px] transition-colors',
          stage.state==='current'?(dark?'border-violet-400 bg-violet-500/15 text-white':'border-violet-400 bg-violet-50 text-violet-900'):'',
          stage.state==='completed'?(dark?'border-emerald-500/30 bg-emerald-500/5 text-emerald-200':'border-emerald-300 bg-emerald-50 text-emerald-800'):'',
          stage.state==='available'||stage.state==='in-progress'?(dark?'border-cyan-500/25 bg-cyan-500/5 text-slate-200':'border-cyan-300 bg-cyan-50 text-slate-800'):'',
          stage.state==='locked'||stage.state==='unavailable'?(dark?'border-slate-700 bg-slate-900/30 text-slate-500':'border-slate-200 bg-slate-50 text-slate-400'):'',
        ].join(' ')}>
        <span className="font-mono uppercase">{String(index+1).padStart(2,'0')} · {stage.state}</span>
        <span className="mt-1 block font-semibold">{stage.label}</span>
      </button>
    );})}
  </nav>
);