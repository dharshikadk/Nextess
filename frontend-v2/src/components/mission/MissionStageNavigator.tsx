import React from 'react';
export type MissionStageState='locked'|'available'|'current'|'in-progress'|'completed'|'unavailable';
export type MissionStage={key:string;label:string;state:MissionStageState};
type Props={stages:MissionStage[];onSelect?:(stage:MissionStage)=>void};
export const MissionStageNavigator:React.FC<Props>=({stages,onSelect})=>(
  <nav aria-label="Mission stages" className="flex gap-2 overflow-x-auto py-2">
    {stages.map((stage,index)=>{const interactive=stage.state!=='locked'&&stage.state!=='unavailable'&&Boolean(onSelect);return(
      <button key={stage.key} type="button" disabled={!interactive} aria-current={stage.state==='current'?'step':undefined}
        aria-label={\`Stage \${index+1}: \${stage.label}, \${stage.state}\`} onClick={()=>interactive&&onSelect?.(stage)}
        className={[
          'min-w-[132px] rounded-xl border px-3 py-2 text-left text-[10px] transition-colors',
          stage.state==='current'?'border-violet-400 bg-violet-500/15 text-white':'',
          stage.state==='completed'?'border-emerald-500/30 bg-emerald-500/5 text-emerald-200':'',
          stage.state==='available'||stage.state==='in-progress'?'border-cyan-500/25 bg-cyan-500/5 text-slate-200':'',
          stage.state==='locked'||stage.state==='unavailable'?'border-slate-700 bg-slate-900/30 text-slate-500':'',
        ].join(' ')}>
        <span className="font-mono uppercase">{String(index+1).padStart(2,'0')} · {stage.state}</span>
        <span className="mt-1 block font-semibold">{stage.label}</span>
      </button>
    );})}
  </nav>
);