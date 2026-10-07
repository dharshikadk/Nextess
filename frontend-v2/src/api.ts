const isBrowser=typeof window!=='undefined';
const isLocalBrowser=isBrowser&&(window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1');
const DEFAULT_API_BASE=isLocalBrowser?'http://localhost:4000':'';
const configuredApiBase=String(import.meta.env.VITE_API_BASE_URL||'').trim().replace(/\/$/,'');
const LOCAL_API_BASES=new Set(['http://localhost:4000','http://127.0.0.1:4000']);
const configuredHostMismatch=isBrowser&&LOCAL_API_BASES.has(configuredApiBase)&&((window.location.hostname==='localhost'&&configuredApiBase==='http://127.0.0.1:4000')||(window.location.hostname==='127.0.0.1'&&configuredApiBase==='http://localhost:4000'));
const configuredRemoteLocalBase=!isLocalBrowser&&LOCAL_API_BASES.has(configuredApiBase);
export const API_BASE=(configuredApiBase&&!configuredHostMismatch&&!configuredRemoteLocalBase?configuredApiBase:DEFAULT_API_BASE).replace(/\/$/,'');
export type ApiErrorCode =
  | 'VALIDATION_ERROR' | 'AUTH_REQUIRED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT'
  | 'RATE_LIMITED' | 'MISSION_UNAVAILABLE' | 'INVALID_VERSION' | 'INVALID_TASK'
  | 'INVALID_STATE' | 'IDEMPOTENCY_KEY_REQUIRED' | 'INTERNAL_ERROR' | string;

export class ApiError extends Error {
  code: ApiErrorCode;
  requestId?: string;
  status: number;
  details: unknown[];
  retryAfterMs?: number;
  constructor(message:string, code:ApiErrorCode, status:number, requestId?:string, details:unknown[]=[], retryAfterMs?:number){
    super(message); this.name='ApiError'; this.code=code; this.status=status; this.requestId=requestId; this.details=details; this.retryAfterMs=retryAfterMs;
  }
}
async function request<T>(path:string,init:RequestInit={}):Promise<T>{
  const method=(init.method||'GET').toUpperCase();
  const maxAttempts=method==='GET'?3:1;
  let lastError: unknown;
  for(let attempt=1;attempt<=maxAttempts;attempt++){
    try{
      const response=await fetch(API_BASE+path,{...init,credentials:'include',headers:{'Content-Type':'application/json',...(init.headers||{})}});
      const body=await response.json().catch(()=>({}));
      if(response.ok)return body as T;
      const error=body?.error;
      const retryAfterHeader=response.headers.get('Retry-After');
      const retryAfterSeconds=retryAfterHeader&&/^\\d+(?:\\.\\d+)?$/.test(retryAfterHeader)?Number(retryAfterHeader):0;
      const retryAfterMs=retryAfterSeconds>0?Math.min(retryAfterSeconds*1000,10000):undefined;
      const retryable=(response.status>=500&&response.status<=599)||(response.status===429&&Boolean(retryAfterMs));
      const message=error?.message||'Request failed.';
      const messageWithRetry=response.status===429&&retryAfterMs?message+' Retry available in '+Math.ceil(retryAfterMs/1000)+' seconds.':message;
      if(!retryable||attempt===maxAttempts){
        throw new ApiError(messageWithRetry,error?.code||'INTERNAL_ERROR',response.status,error?.requestId||response.headers.get('X-Request-Id')||undefined,Array.isArray(error?.details)?error.details:[],retryAfterMs);
      }
      lastError=new ApiError(messageWithRetry,error?.code||'INTERNAL_ERROR',response.status,error?.requestId||response.headers.get('X-Request-Id')||undefined,Array.isArray(error?.details)?error.details:[],retryAfterMs);
    }catch(error){
      lastError=error;
      if(error instanceof ApiError && error.status<500 && error.status!==429)throw error;
      if(attempt===maxAttempts)throw error;
    }
    const waitMs=lastError instanceof ApiError&&lastError.status===429&&lastError.retryAfterMs?lastError.retryAfterMs:attempt*400;
    await new Promise(resolve=>setTimeout(resolve,waitMs));
  }
  throw lastError instanceof Error?lastError:new Error('Request failed.');
}
export const api={
  me:()=>request<any>('/v1/auth/me'), login:(username:string,password:string)=>request<any>('/v1/auth/login',{method:'POST',body:JSON.stringify({username,password})}),
  register:(data:any)=>request<any>('/v1/auth/register',{method:'POST',body:JSON.stringify(data)}), logout:()=>request<any>('/v1/auth/logout',{method:'POST'}),
  dashboard:()=>request<any>('/v1/dashboard'), profile:()=>request<any>('/v1/profile'), updateProfile:(data:any)=>request<any>('/v1/profile',{method:'PATCH',body:JSON.stringify(data)}),
  settings:()=>request<any>('/v1/settings'), freezeStreak:(days:number)=>request<any>('/v1/streak/freeze',{method:'POST',body:JSON.stringify({days})}), updateSettings:(data:any)=>request<any>('/v1/settings',{method:'PATCH',body:JSON.stringify(data)}), streak:()=>request<any>('/v1/streak'), setStreakGoal:(days:number)=>request<any>('/v1/streak/goal',{method:'POST',body:JSON.stringify({days})}),
  leaderboard:()=>request<any>('/v1/leaderboard'), leaderboardNudge:()=>request<any>('/v1/user/leaderboard-nudge'), joinLeague:()=>request<any>('/v1/league/join',{method:'POST'}), badges:()=>request<any>('/v1/badges'), claimBadge:(badgeKey:string)=>request<any>('/v1/badges/'+encodeURIComponent(badgeKey)+'/claim',{method:'POST'}),
  directives:()=>request<any>('/v1/directives'), claimDirective:(id:string)=>request<any>('/v1/directives/'+id+'/claim',{method:'POST'}), quote:()=>request<any>('/v1/quotes/daily'),
  feedback:(category:string,message:string)=>request<any>('/v1/feedback',{method:'POST',body:JSON.stringify({category,message})}),
  subjects:()=>request<any>('/v1/subjects'), projects:(subjectId:string)=>request<any>('/v1/subjects/'+subjectId+'/projects'), project:(id:string)=>request<any>('/v1/projects/'+id),
  startMission:(id:string)=>request<any>('/v1/projects/'+id+'/start',{method:'POST'}), investigation:(id:string)=>request<any>('/v1/investigations/'+id),
  submitAnswer:(id:string,questionId:string,answer:any,idempotencyKey?:string)=>request<any>('/v1/investigations/'+id+'/answers',{method:'POST',headers:idempotencyKey?{'Idempotency-Key':idempotencyKey}:undefined,body:JSON.stringify({questionId,answer})}),
  useHint:(id:string,questionId:string)=>request<any>('/v1/investigations/'+id+'/hints',{method:'POST',body:JSON.stringify({questionId})}),
  revealAnswer:(id:string,questionId:string)=>request<any>('/v1/investigations/'+id+'/reveal-answer',{method:'POST',body:JSON.stringify({questionId})}),
  advanceMissionLevel:(id:string)=>request<any>('/v1/investigations/'+id+'/advance-level',{method:'POST'}),
  completeMission:(id:string)=>request<any>('/v1/investigations/'+id+'/complete',{method:'POST'}),
  simulationState:(id:string,simulationId:string,state:any)=>request<any>('/v1/investigations/'+id+'/simulation-state',{method:'POST',body:JSON.stringify({simulationId,state})})
};
