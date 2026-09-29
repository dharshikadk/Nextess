export interface ChallengeEvaluationDefinition {
  answer?: unknown;
  tolerance?: number;
  [key: string]: unknown;
}
export interface ChallengeEvaluationInput { type:string; value:unknown; definition:ChallengeEvaluationDefinition; }
export interface ChallengeEvaluationResult { correct:boolean; normalizedAnswer:unknown; feedback:{message:string}; evaluatorVersion:string; }
export type ChallengeEvaluator = (input:ChallengeEvaluationInput) => ChallengeEvaluationResult;

export const EVALUATOR_VERSION = "v4";
const normalizeText=(value:unknown)=>String(value??"").trim().toLowerCase();
export const normalizeAnswer=(value:unknown):unknown=>{
  if(Array.isArray(value)) return value.map(normalizeAnswer);
  if(typeof value==="string") return normalizeText(value);
  return value;
};
const equal=(a:unknown,b:unknown):boolean=>{
  const na=normalizeAnswer(a),nb=normalizeAnswer(b);
  if(Array.isArray(na)&&Array.isArray(nb)) return na.length===nb.length&&na.every((v,i)=>equal(v,nb[i]));
  if(na&&nb&&typeof na==="object"&&typeof nb==="object"){
    const ao=na as Record<string,unknown>,bo=nb as Record<string,unknown>;
    const ak=Object.keys(ao).sort(),bk=Object.keys(bo).sort();
    return ak.length===bk.length&&ak.every((key,i)=>key===bk[i]&&equal(ao[key],bo[key]));
  }
  return na===nb;
};
const numerical=(value:unknown,expected:unknown,tolerance:unknown)=>{
  const actual=Number(value),target=Number(expected),allowed=Number.isFinite(Number(tolerance))?Number(tolerance):0;
  return Number.isFinite(actual)&&Number.isFinite(target)&&Math.abs(actual-target)<=Math.max(0,allowed);
};
const result=(correct:boolean,value:unknown)=>({correct,normalizedAnswer:normalizeAnswer(value),feedback:{message:correct?"Correct.":"Not correct. Try again."},evaluatorVersion:EVALUATOR_VERSION});
const numericalEvaluator:ChallengeEvaluator=({value,definition})=>result(numerical(value,definition.answer,definition.tolerance),value);
const deterministicEvaluator:ChallengeEvaluator=({value,definition})=>result(equal(value,definition.answer),value);

export const challengeEvaluatorRegistry:Map<string,ChallengeEvaluator>=new Map([
  ["numerical",numericalEvaluator],
  ["structured-choice",deterministicEvaluator],
  ["what-if",deterministicEvaluator],
  ["data-analysis",deterministicEvaluator],
  ["quantitative-investigation",deterministicEvaluator],
  ["engineering-decision",deterministicEvaluator],
  ["decision",deterministicEvaluator]
]);

export function registerChallengeEvaluator(type:string,evaluator:ChallengeEvaluator){
  if(!type.trim()) throw new Error("Challenge type is required.");
  challengeEvaluatorRegistry.set(type,evaluator);
}

export function evaluateChallenge(input:ChallengeEvaluationInput):ChallengeEvaluationResult{
  const evaluator=challengeEvaluatorRegistry.get(input.type);
  if(evaluator) return evaluator(input);
  if(input.definition.answer!==undefined) return typeof input.definition.answer==="number"
    ? result(numerical(input.value,input.definition.answer,input.definition.tolerance),input.value)
    : result(equal(input.value,input.definition.answer),input.value);
  return {correct:false,normalizedAnswer:normalizeAnswer(input.value),feedback:{message:`No evaluator registered for challenge type "${input.type}".`},evaluatorVersion:EVALUATOR_VERSION};
}
