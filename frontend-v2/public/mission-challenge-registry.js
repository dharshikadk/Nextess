window.NextessChallengeRendererRegistry = Object.freeze({
  numerical: ({q,state,esc}) => {
    const unit=esc(q?.inputSchema?.unit||'');
    return '<div class="flex gap-2"><input id="numeric" type="number" placeholder="Enter numeric answer" class="flex-1 bg-[#181926] border border-cyan-500/30 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400 ui-transition"><span class="px-3 py-2.5 rounded-xl bg-[#181926] border border-cyan-500/30 text-xs text-slate-400 flex items-center">'+unit+'</span></div>';
  },
  "structured-choice": ({q,esc}) => choice({q,esc}),
  "what-if": ({q,esc}) => choice({q,esc}),
  "data-analysis": ({q,esc}) => choice({q,esc}),
  "quantitative-investigation": ({q,esc}) => choice({q,esc}),
  "engineering-decision": ({q,esc}) => choice({q,esc}),
  "decision": ({q,esc}) => choice({q,esc}),
  fallback: ({q}) => '<div class="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-200">This challenge type is not registered in the Mission Chamber.</div>'
});
function choice({q,esc}) {
  return '<div class="flex flex-col gap-2">'+(q?.options||[]).map((o,i)=>'<button data-opt="'+i+'" class="answerOpt w-full text-left p-3 rounded-xl border bg-[#181926] border-cyan-500/20 hover:bg-[#1f2030] hover:border-cyan-500/40 ui-transition flex items-start gap-3"><span class="w-7 h-7 rounded-lg bg-slate-700/20 text-slate-400 font-mono text-xs flex items-center justify-center font-bold shrink-0">'+esc(o.optionKey||String.fromCharCode(65+i))+'</span><span class="text-xs text-slate-200">'+esc(o.optionText||o.value||'')+'</span></button>').join('')+'</div>';
}
