import React from 'react';

export type MissionTask={
  id:string;
  questionType:string;
  prompt:string;
  inputSchema?:any;
  options?:Array<{optionKey?:string;optionText?:string;value?:string}>;
};

export type TaskRendererProps={task:MissionTask;value:unknown;onChange:(value:unknown)=>void;disabled?:boolean};
type Renderer=React.FC<TaskRendererProps>;

const OptionList:React.FC<TaskRendererProps & {context?:string}>=({task,value,onChange,disabled,context})=>(
  <fieldset className="flex flex-col gap-2" disabled={disabled}>
    <legend className="sr-only">{context||'Choose an answer'}</legend>
    {(task.options||[]).map((option,index)=>{
      const optionValue=option.optionText??option.value??option.optionKey??'';
      const selected=value===optionValue;
      return <button key={option.optionKey??String(index)} type="button" disabled={disabled} aria-pressed={selected}
        onClick={()=>onChange(optionValue)}
        className={'w-full text-left p-3 rounded-xl border transition-colors flex items-start gap-3 '+(selected?'bg-[#1f2030] border-cyan-400 ring-1 ring-cyan-400/30':'bg-[#181926] border-cyan-500/20 hover:bg-[#1f2030] hover:border-cyan-500/40')}>
        <span aria-hidden="true" className="w-7 h-7 rounded-lg bg-slate-700/20 text-slate-400 font-mono text-xs flex items-center justify-center font-bold shrink-0">{option.optionKey??String.fromCharCode(65+index)}</span>
        <span className="text-xs text-slate-200">{optionValue}</span>
      </button>;
    })}
  </fieldset>
);

const StructuredChoiceRenderer:Renderer=(props)=><OptionList {...props} context="Select the structured-choice answer" />;
const WhatIfRenderer:Renderer=(props)=><OptionList {...props} context="Select the predicted what-if outcome" />;
const DataAnalysisRenderer:Renderer=(props)=><OptionList {...props} context="Select the conclusion supported by the data" />;
const QuantitativeInvestigationRenderer:Renderer=(props)=><OptionList {...props} context="Select the quantitative investigation result" />;
const EngineeringDecisionRenderer:Renderer=(props)=><OptionList {...props} context="Select the engineering decision" />;
const DecisionRenderer:Renderer=(props)=><OptionList {...props} context="Select the final decision" />;

const NumericalRenderer:Renderer=({task,value,onChange,disabled})=>(
  <label className="block">
    <span className="sr-only">Numeric answer</span>
    <div className="flex gap-2">
      <input type="number" inputMode="decimal" value={value==null?'':String(value)} disabled={disabled}
        aria-label={'Numeric answer'+(task.inputSchema?.unit?' in '+task.inputSchema.unit:'')}
        onChange={event=>onChange(event.target.value)} placeholder="Enter numeric answer"
        className="flex-1 bg-[#181926] border border-cyan-500/30 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400" />
      {task.inputSchema?.unit&&<span className="px-3 py-2.5 rounded-xl bg-[#181926] border border-cyan-500/30 text-xs text-slate-400 flex items-center">{task.inputSchema.unit}</span>}
    </div>
  </label>
);

const UnsupportedRenderer:Renderer=({task})=>(
  <div role="alert" className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-200">
    This challenge type is not registered: <strong>{task.questionType}</strong>.
  </div>
);

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
export function getTaskRenderer(type:string):Renderer{
  return taskRendererRegistry[type]??UnsupportedRenderer;
}
export function TaskRenderer(props:TaskRendererProps){
  const Renderer=getTaskRenderer(props.task.questionType);
  return <Renderer {...props} />;
}