import React from 'react';

export type MissionTask={
  id:string;
  subject?:string;
  questionType:string;
  prompt:string;
  inputSchema?:any;
  options?:Array<{optionKey?:string;optionText?:string;value?:string}>;
};

export type TaskRendererProps={task:MissionTask;value:unknown;onChange:(value:unknown)=>void;disabled?:boolean;theme?:'dark'|'light'};
type Renderer=React.FC<TaskRendererProps>;

const OptionList:React.FC<TaskRendererProps & {context?:string}>=({task,value,onChange,disabled,context,theme='dark'})=>{
  const dark=theme==='dark';
  return <fieldset className="flex flex-col gap-2" disabled={disabled}>
    <legend className="sr-only">{context||'Choose an answer'}</legend>
    {(task.options||[]).map((option,index)=>{
      const optionValue=option.optionText??option.value??option.optionKey??'';
      const selected=value===optionValue;
      return <button key={option.optionKey??String(index)} type="button" disabled={disabled} aria-pressed={selected}
        onClick={()=>onChange(optionValue)}
        className={'w-full text-left p-3 rounded-xl border transition-colors flex items-start gap-3 '+(selected?(dark?'bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-400/30':'bg-cyan-50 border-cyan-400 ring-1 ring-cyan-300'):(dark?'bg-[#181926] border-cyan-500/20 hover:bg-[#1f2030] hover:border-cyan-500/40':'bg-slate-50 border-slate-200 hover:bg-white hover:border-cyan-300'))}>
        <span aria-hidden="true" className={`w-7 h-7 rounded-lg font-mono text-xs flex items-center justify-center font-bold shrink-0 ${dark?'bg-slate-700/30 text-slate-400':'bg-slate-200 text-slate-600'}`}>{option.optionKey??String.fromCharCode(65+index)}</span>
        <span className={`text-xs ${dark?'text-slate-200':'text-slate-800'}`}>{optionValue}</span>
      </button>;
    })}
  </fieldset>;
};

const StructuredChoiceRenderer:Renderer=(props)=><OptionList {...props} context="Select the structured-choice answer" />;
const WhatIfRenderer:Renderer=(props)=><OptionList {...props} context="Select the predicted what-if outcome" />;
const DataAnalysisRenderer:Renderer=(props)=><OptionList {...props} context="Select the conclusion supported by the data" />;
const QuantitativeInvestigationRenderer:Renderer=(props)=><OptionList {...props} context="Select the quantitative investigation result" />;
const EngineeringDecisionRenderer:Renderer=(props)=><OptionList {...props} context="Select the engineering decision" />;
const DecisionRenderer:Renderer=(props)=><OptionList {...props} context="Select the final decision" />;

const NumericalRenderer:Renderer=({task,value,onChange,disabled,theme='dark'})=>{
  const dark=theme==='dark';
  return <label className="block">
    <span className="sr-only">Numeric answer</span>
    <div className="flex gap-2">
      <input type="number" inputMode="decimal" value={value==null?'':String(value)} disabled={disabled}
        aria-label={'Numeric answer'+(task.inputSchema?.unit?' in '+task.inputSchema.unit:'')}
        onChange={event=>onChange(event.target.value)} placeholder="Enter numeric answer"
        className={`flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-400 ${dark?'bg-[#181926] border-cyan-500/30 text-white':'bg-white border-slate-300 text-slate-900'}`} />
      {task.inputSchema?.unit&&<span className={`px-3 py-2.5 rounded-xl border text-xs flex items-center ${dark?'bg-[#181926] border-cyan-500/30 text-slate-400':'bg-slate-50 border-slate-300 text-slate-600'}`}>{task.inputSchema.unit}</span>}
    </div>
  </label>;
};

const UnsupportedRenderer:Renderer=({task,theme='dark'})=><div role="alert" className={`p-3 rounded-xl border text-xs ${theme==='dark'?'border-rose-500/30 bg-rose-500/5 text-rose-200':'border-rose-300 bg-rose-50 text-rose-700'}`}>This challenge type is not registered: <strong>{task.questionType}</strong>.</div>;

export const taskRendererRegistry:Record<string,Renderer>={
  numerical:NumericalRenderer,
  'structured-choice':StructuredChoiceRenderer,
  'what-if':WhatIfRenderer,
  'data-analysis':DataAnalysisRenderer,
  'quantitative-investigation':QuantitativeInvestigationRenderer,
  'engineering-decision':EngineeringDecisionRenderer,
  decision:DecisionRenderer,
};

export function registerTaskRenderer(type:string,renderer:Renderer){
  if(!type.trim())throw new Error('Task renderer type is required.');
  taskRendererRegistry[type]=renderer;
}

type SubjectRendererRegistry = Record<string, Record<string, Renderer>>;
export const subjectTaskRendererRegistry: SubjectRendererRegistry = {};

export function registerSubjectTaskRenderer(subject: string, type: string, renderer: Renderer) {
  const subjectKey = subject.trim().toLowerCase();
  const typeKey = type.trim();
  if (!subjectKey) throw new Error('Task renderer subject is required.');
  if (!typeKey) throw new Error('Task renderer type is required.');
  subjectTaskRendererRegistry[subjectKey] ??= {};
  subjectTaskRendererRegistry[subjectKey][typeKey] = renderer;
}

export function getTaskRenderer(type: string, subject?: string): Renderer {
  const subjectKey = String(subject || '').trim().toLowerCase();
  const subjectRenderer = subjectKey
    ? subjectTaskRendererRegistry[subjectKey]?.[type]
    : undefined;
  return subjectRenderer ?? taskRendererRegistry[type] ?? UnsupportedRenderer;
}
export function TaskRenderer(props:TaskRendererProps){
  const Renderer=getTaskRenderer(props.task.questionType, props.task.subject);
  return <Renderer {...props} />;
}
