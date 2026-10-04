import 'dotenv/config';import express from 'express';import cors from 'cors';import crypto from 'node:crypto';import {PrismaClient,RewardType,StreakState} from '@prisma/client';import {evaluateChallenge} from './evaluators.js';import {validateUuid,validateObject,validateString} from './validation.js';import {hashPassword,verifyPassword} from './password.js';const prisma=new PrismaClient();const app=express();app.disable('x-powered-by');const port=Number(process.env.PORT||4000);const origin=process.env.FRONTEND_ORIGIN||'http://localhost:3000';const rateWindowMs=60_000;const rateBuckets=new Map<string,{count:number,resetAt:number}>();const statefulLimit=Number(process.env.RATE_LIMIT_STATEFUL||60);const authLimit=Number(process.env.RATE_LIMIT_AUTH||12);const rateLimit=(limit:number)=>(req:express.Request,res:express.Response,next:express.NextFunction)=>{const now=Date.now();const isAuthPath=req.path.startsWith('/v1/auth/');const bucketScope=isAuthPath?'auth:'+req.path:'stateful';const key=(req.ip||req.socket.remoteAddress||'unknown')+':'+bucketScope;const bucket=rateBuckets.get(key);if(!bucket||bucket.resetAt<=now){rateBuckets.set(key,{count:1,resetAt:now+rateWindowMs});return next();}if(bucket.count>=limit){res.setHeader('Retry-After',String(Math.ceil((bucket.resetAt-now)/1000)));return fail(res,'RATE_LIMITED','Too many requests. Retry shortly.',429);}bucket.count+=1;if(rateBuckets.size>5000){for(const [entry,value] of rateBuckets)if(value.resetAt<=now)rateBuckets.delete(entry);}next()};app.set('trust proxy',process.env.TRUST_PROXY==='true'?1:false);app.use(cors({origin,credentials:true}));app.use(express.json({limit:'1mb'}));
app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');next();});app.use((req,res,next)=>{const incoming=req.header('X-Request-Id');const requestId=incoming&&/^[A-Za-z0-9._:-]{1,100}$/.test(incoming)?incoming:crypto.randomUUID();res.setHeader('X-Request-Id',requestId);res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');if(process.env.NODE_ENV==='production')res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');if(['POST','PUT','PATCH','DELETE'].includes(req.method)&&req.path.startsWith('/v1/')&&req.header('Origin')&&req.header('Origin')!==origin)return fail(res,'FORBIDDEN','Cross-origin state-changing requests are not allowed.',403);next()});app.use((req,res,next)=>{const started=Date.now();res.on('finish',()=>console.log(JSON.stringify({type:'http_request',requestId:res.getHeader('X-Request-Id'),method:req.method,path:req.path,status:res.statusCode,durationMs:Date.now()-started})));next()});app.use((req,res,next)=>rateLimit(req.path.startsWith('/v1/auth/')?authLimit:statefulLimit)(req,res,next));const hash=(v:string)=>crypto.createHash('sha256').update(v).digest('hex');
const cookie='nextess_session';const guestCookie='nextess_guest';const SESSION_DAYS=Math.max(1,Math.min(90,Number(process.env.SESSION_DAYS)||30));const GUEST_SESSION_DAYS=14;
const parseCookie=(req:express.Request,name:string)=>req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);
async function guestSession(req:express.Request,res:express.Response,create=false){const raw=parseCookie(req,guestCookie);if(raw){const existing=await prisma.anonymousSession.findUnique({where:{sessionHash:hash(raw)}});if(existing&&existing.expiresAt>=new Date()){await prisma.anonymousSession.update({where:{id:existing.id},data:{lastActivityAt:new Date()}});return existing;}res.clearCookie(guestCookie);}if(!create)return null;const token=crypto.randomBytes(32).toString('base64url');const row=await prisma.anonymousSession.create({data:{sessionHash:hash(token),expiresAt:new Date(Date.now()+GUEST_SESSION_DAYS*864e5)}});res.cookie(guestCookie,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:GUEST_SESSION_DAYS*864e5});return row;}
async function learner(req:R,res:express.Response,createGuest=false){if(req.userId)return {userId:req.userId,anonymousSessionId:null,anonymous:false};const guest=await guestSession(req,res,createGuest);return guest?{userId:null,anonymousSessionId:guest.id,anonymous:true}:null;}const CHALLENGE_REWARD={xp:2,coins:1};
const STREAK_GOAL_REWARDS:Record<number,{xp:number;coins:number}>={7:{xp:20,coins:10},14:{xp:40,coins:20}};
type R=express.Request&{userId?:string};const fail=(res:express.Response,code:string,message:string,status=400)=>res.status(status).json({error:{code,message,requestId:res.getHeader('X-Request-Id'),details:[]}});
const requestIdempotencyKey=(req:express.Request)=>{const raw=req.header('Idempotency-Key')?.trim();return raw&&raw.length<=180?raw:null};
const serializableTransaction=async<T>(work:(tx:any)=>Promise<T>,retries=3):Promise<T>=>{for(let attempt=0;;attempt++){try{return await prisma.$transaction(work,{isolationLevel:'Serializable'});}catch(e:any){if(e?.code==='P2034'&&attempt<retries)continue;throw e;}}};const view=(u:any)=>u&&({id:u.id,name:u.name,username:u.username,gradeClass:u.gradeClass,profileType:u.profileType,profession:u.profession,educationStage:u.educationStage,schoolClass:u.schoolClass,fieldOfStudy:u.fieldOfStudy,profileStatus:u.profileStatus||null,profileImageData:u.profileImageData||null,level:u.level,xp:u.xp,coins:u.coins,streakGoalDays:u.streakGoalDays??null,streakGoalRewardedAt:u.streakGoalRewardedAt??null});async function auth(req:R,res:express.Response,next:express.NextFunction){const h=req.headers.authorization;const b=h?.startsWith('Bearer ')?h.slice(7):undefined;const c=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookie+'='))?.slice(cookie.length+1);const token=b||c;if(!token)return fail(res,'AUTH_REQUIRED','Authentication required.',401);const s=await prisma.authSession.findUnique({where:{tokenHash:hash(token)}});if(!s||s.expiresAt<new Date())return fail(res,'AUTH_REQUIRED','Session expired.',401);req.userId=s.userId;const touched=await prisma.authSession.updateMany({where:{id:s.id},data:{lastActivityAt:new Date()}});if(touched.count===0)return fail(res,'AUTH_REQUIRED','Session is no longer valid.',401);next()}async function optionalAuth(req:R,res:express.Response,next:express.NextFunction){const h=req.headers.authorization;const b=h?.startsWith('Bearer ')?h.slice(7):undefined;const c=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookie+'='))?.slice(cookie.length+1);const token=b||c;if(token){const sessionRow=await prisma.authSession.findUnique({where:{tokenHash:hash(token)}});if(sessionRow&&sessionRow.expiresAt>=new Date()){req.userId=sessionRow.userId;const touched=await prisma.authSession.updateMany({where:{id:sessionRow.id},data:{lastActivityAt:new Date()}});if(touched.count===0)delete req.userId;}}next()}async function session(u:any,res:express.Response,extra:any={}){const token=crypto.randomBytes(32).toString('base64url');await prisma.authSession.create({data:{userId:u.id,tokenHash:hash(token),expiresAt:new Date(Date.now()+SESSION_DAYS*864e5)}});res.cookie(cookie,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:SESSION_DAYS*864e5});res.json({user:view(u),...extra})}
async function migrateGuestSessionToUser(req:express.Request,res:express.Response,userId:string){
  const raw=parseCookie(req,guestCookie);
  if(!raw)return;
  const guest=await prisma.anonymousSession.findUnique({where:{sessionHash:hash(raw)}});
  if(!guest||guest.expiresAt<new Date())return;
  await prisma.$transaction(async tx=>{
    const investigations=await tx.investigation.findMany({where:{anonymousSessionId:guest.id},orderBy:{lastActivityAt:'desc'}});
    const projectVersionIds=[...new Set(investigations.map(i=>i.projectVersionId))];
    const versions=projectVersionIds.length?await tx.projectVersion.findMany({
      where:{id:{in:projectVersionIds}},
      select:{id:true,levels:{select:{id:true,levelNumber:true},orderBy:{levelNumber:'asc'}}}
    }):[];
    const versionById=new Map(versions.map(v=>[v.id,v]));
    const latestByProject=new Map<string,typeof investigations[number]>();
    for(const inv of investigations){
      const current=latestByProject.get(inv.projectId);
      if(!current||inv.lastActivityAt>current.lastActivityAt)latestByProject.set(inv.projectId,inv);
    }
    if(investigations.length){
      await tx.investigationAnswer.updateMany({where:{investigationId:{in:investigations.map(i=>i.id)}},data:{userId}});
      await tx.investigation.updateMany({where:{anonymousSessionId:guest.id},data:{userId,anonymousSessionId:null}});
      for(const inv of latestByProject.values()){
        const version=versionById.get(inv.projectVersionId);
        const level=version?.levels.find(l=>l.id===inv.currentLevelId);
        const percent=inv.status==='COMPLETED'?100:level&&version?.levels.length?Math.max(0,Math.min(99,Math.round((level.levelNumber-1)/version.levels.length*100))):0;
        const existingProgress=await tx.userProjectProgress.findUnique({where:{userId_projectId:{userId,projectId:inv.projectId}}});
        const shouldMerge=!existingProgress || (existingProgress.status!=='COMPLETED' && (percent>=existingProgress.progressPercent || inv.lastActivityAt>=(existingProgress.lastActivityAt||new Date(0))));
        if(shouldMerge){
          await tx.userProjectProgress.upsert({
            where:{userId_projectId:{userId,projectId:inv.projectId}},
            update:{status:inv.status==='COMPLETED'?'COMPLETED':'IN_PROGRESS',currentLevelId:inv.status==='COMPLETED'?null:inv.currentLevelId,currentQuestionId:inv.status==='COMPLETED'?null:inv.currentQuestionId,progressPercent:Math.max(existingProgress?.progressPercent||0,percent),completedAt:inv.completedAt||existingProgress?.completedAt||null,lastActivityAt:inv.lastActivityAt},
            create:{userId,projectId:inv.projectId,status:inv.status==='COMPLETED'?'COMPLETED':'IN_PROGRESS',currentLevelId:inv.status==='COMPLETED'?null:inv.currentLevelId,currentQuestionId:inv.status==='COMPLETED'?null:inv.currentQuestionId,progressPercent:percent,completedAt:inv.completedAt,lastActivityAt:inv.lastActivityAt}
          });
        }
      }
    }
    const enrollments=await tx.subjectEnrollment.findMany({where:{anonymousSessionId:guest.id}});
    for(const enrollment of enrollments){
      const existing=await tx.subjectEnrollment.findUnique({where:{userId_subjectId:{userId,subjectId:enrollment.subjectId}}});
      if(existing)await tx.subjectEnrollment.delete({where:{id:enrollment.id}});
      else await tx.subjectEnrollment.update({where:{id:enrollment.id},data:{userId,anonymousSessionId:null}});
    }
    await tx.anonymousSession.delete({where:{id:guest.id}});
  });
  res.clearCookie(guestCookie);
}async function awardBadge(tx:any,userId:string,key:string,metadata:any={}){const badge=await tx.badge.findUnique({where:{key}});if(!badge)return false;try{await tx.userBadge.create({data:{userId,badgeId:badge.id,metadata}});return true}catch(e:any){if(e?.code==='P2002')return false;throw e}}
async function streak(id:string){const rows=await prisma.streakActivity.findMany({where:{userId:id},orderBy:{activityDate:'desc'},take:100});let n=0;const today=new Date();today.setUTCHours(0,0,0,0);for(const r of rows){const d=new Date(r.activityDate);d.setUTCHours(0,0,0,0);const diff=Math.round((today.getTime()-d.getTime())/864e5);if(diff===n)n++;else if(diff>n)break}return n}async function rewardChallenge(tx:any,userId:string,investigationId:string,questionId:string){const base='mission-challenge:'+investigationId+':'+questionId;let ax=false,ac=false;try{await tx.rewardLedger.create({data:{userId,investigationId,sourceId:questionId,rewardType:RewardType.XP,amount:CHALLENGE_REWARD.xp,reasonCode:'MISSION_CHALLENGE_CORRECT',idempotencyKey:base+':xp'}});ax=true}catch(e:any){if(e?.code!=='P2002')throw e}try{await tx.rewardLedger.create({data:{userId,investigationId,sourceId:questionId,rewardType:RewardType.COINS,amount:CHALLENGE_REWARD.coins,reasonCode:'MISSION_CHALLENGE_CORRECT',idempotencyKey:base+':coins'}});ac=true}catch(e:any){if(e?.code!=='P2002')throw e}if(ax||ac){const u=await tx.user.findUnique({where:{id:userId},select:{xp:true,level:true}});if(!u)throw new Error('USER_NOT_FOUND');const nextXp=u.xp+(ax?CHALLENGE_REWARD.xp:0);const nextLevel=Math.max(u.level,Math.max(1,Math.floor(nextXp/100)));await tx.user.update({where:{id:userId},data:{...(ax?{xp:{increment:CHALLENGE_REWARD.xp}}:{}),...(ac?{coins:{increment:CHALLENGE_REWARD.coins}}:{}),level:nextLevel,lastActivityAt:new Date()}});const c=await tx.leagueCycle.findFirst({where:{status:'OPEN'},orderBy:{startsAt:'desc'}});if(c&&ax)await tx.leagueParticipant.upsert({where:{cycleId_userId:{cycleId:c.id,userId}},update:{kp:{increment:CHALLENGE_REWARD.xp}},create:{cycleId:c.id,userId,kp:CHALLENGE_REWARD.xp}});await tx.streakActivity.upsert({where:{userId_activityDate:{userId,activityDate:(()=>{const d=new Date();d.setUTCHours(0,0,0,0);return d})()}},update:{},create:{userId,activityDate:(()=>{const d=new Date();d.setUTCHours(0,0,0,0);return d})(),state:StreakState.QUALIFIED,sourceId:questionId}});}return {xp:ax?CHALLENGE_REWARD.xp:0,coins:ac?CHALLENGE_REWARD.coins:0};}
async function rewardMissionLevel(tx:any,userId:string,investigationId:string,levelId:string,xp:number,coins:number,isFinal:boolean){
  const safeXp=Math.max(0,Math.trunc(xp)),safeCoins=Math.max(0,Math.trunc(coins)),base="mission-level:"+investigationId+":"+levelId;
  let ax=false,ac=false;
  try{await tx.rewardLedger.create({data:{userId,investigationId,sourceId:levelId,rewardType:RewardType.XP,amount:safeXp,reasonCode:isFinal?'MISSION_FINAL_LEVEL':'MISSION_LEVEL',idempotencyKey:base+":xp"}});ax=true}catch(e:any){if(e?.code!=='P2002')throw e}
  try{await tx.rewardLedger.create({data:{userId,investigationId,sourceId:levelId,rewardType:RewardType.COINS,amount:safeCoins,reasonCode:isFinal?'MISSION_FINAL_LEVEL':'MISSION_LEVEL',idempotencyKey:base+":coins"}});ac=true}catch(e:any){if(e?.code!=='P2002')throw e}
  if(ax||ac){
    const currentUser=await tx.user.findUnique({where:{id:userId},select:{xp:true,level:true}});
    if(!currentUser)throw new Error('USER_NOT_FOUND');
    const nextXp=currentUser.xp+(ax?safeXp:0);
    const nextLevel=Math.max(currentUser.level,Math.max(1,Math.floor(nextXp/100)));
    await tx.user.update({where:{id:userId},data:{...(ax?{xp:{increment:safeXp}}:{}),...(ac?{coins:{increment:safeCoins}}:{}),level:nextLevel,lastActivityAt:new Date()}});
    const c=await tx.leagueCycle.findFirst({where:{status:'OPEN'},orderBy:{startsAt:'desc'}});
    if(c&&ax)await tx.leagueParticipant.upsert({where:{cycleId_userId:{cycleId:c.id,userId}},update:{kp:{increment:safeXp}},create:{cycleId:c.id,userId,kp:safeXp}});
  }
  return {xp:ax?safeXp:0,coins:ac?safeCoins:0};
}app.get('/health',(_,r)=>{
 r.setHeader('X-Content-Type-Options','nosniff');
 r.setHeader('X-Frame-Options','DENY');
 return r.json({ok:true,service:'nextess-api'});
});app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ ok: true, ready: true });
  } catch {
    return res.status(503).json({ ok: false, ready: false });
  }
});app.post('/v1/auth/register',async(req,res)=>{try{const {name,password,profileType='STUDENT',profession,educationStage,schoolClass,fieldOfStudy,profileStatus,profileImageData}=req.body;const username=String(req.body.username||'').trim().toLowerCase();if(!validateString(name,1,120)||!validateString(username,1,50)||!password||typeof password!=='string'||password.length<8)return fail(res,'VALIDATION_ERROR','Name, username and a password of at least 8 characters are required.');if(!['STUDENT','WORKING_PROFESSIONAL','OTHER'].includes(profileType))return fail(res,'VALIDATION_ERROR','Invalid profile type.');if(profileStatus!==undefined&&!validateString(profileStatus,0,60))return fail(res,'VALIDATION_ERROR','Profile status must be at most 60 characters.');if(profileImageData!==undefined&&profileImageData!==null&&(!validateString(profileImageData,1,400000)||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(profileImageData)))return fail(res,'VALIDATION_ERROR','Profile image must be a PNG, JPEG, or WebP data image under 400 KB.');if(await prisma.user.findFirst({where:{username:{equals:username,mode:'insensitive'}}}))return fail(res,'CONFLICT','Username is already in use.',409);const u=await prisma.user.create({data:{name:String(name).trim(),username,passwordHash:hashPassword(password),profileType,profession:profession||null,educationStage:educationStage||null,schoolClass:schoolClass||null,fieldOfStudy:fieldOfStudy||null,profileStatus:profileStatus||null,profileImageData:profileImageData||null}});await prisma.$transaction(async tx=>{await tx.rewardLedger.createMany({data:[{userId:u.id,sourceId:u.id,rewardType:RewardType.XP,amount:100,reasonCode:'WELCOME_GRANT',idempotencyKey:'welcome:'+u.id+':xp'},{userId:u.id,sourceId:u.id,rewardType:RewardType.COINS,amount:100,reasonCode:'WELCOME_GRANT',idempotencyKey:'welcome:'+u.id+':coins'}]});await tx.user.update({where:{id:u.id},data:{xp:100,coins:100}})});await migrateGuestSessionToUser(req,res,u.id);return session({...u,xp:100,coins:100},res,{firstLogin:true})}catch(e:any){if(e?.code==='P2002')return fail(res,'CONFLICT','Username is already in use.',409);return fail(res,'INTERNAL_ERROR','Unable to create account.',500)}});app.post('/v1/auth/login',async(req,res)=>{const username=String(req.body?.username||'').trim().toLowerCase();const u=await prisma.user.findFirst({where:{username:{equals:username,mode:'insensitive'}}});const passwordCheck=verifyPassword(req.body?.password,u?.passwordHash||'');if(!u||!passwordCheck.valid)return fail(res,'INVALID_CREDENTIALS','Username or password is incorrect.',401);const firstLogin=!u.firstLoginCompletedAt;if(passwordCheck.needsUpgrade){await prisma.user.update({where:{id:u.id},data:{passwordHash:hashPassword(String(req.body.password))}});}await migrateGuestSessionToUser(req,res,u.id);if(firstLogin)await prisma.user.update({where:{id:u.id},data:{firstLoginCompletedAt:new Date(),lastActivityAt:new Date()}});return session({...u,firstLoginCompletedAt:firstLogin?new Date():u.firstLoginCompletedAt},res,{firstLogin})});app.post('/v1/auth/logout',auth,async(req:R,res)=>{const h=req.headers.authorization;const bearerToken=h?.startsWith('Bearer ')?h.slice(7):null;const cookieToken=parseCookie(req,cookie);const tokenHashes=[bearerToken,cookieToken].filter((value):value is string=>Boolean(value)).map(hash);if(tokenHashes.length)await prisma.authSession.deleteMany({where:{tokenHash:{in:tokenHashes}}});res.clearCookie(cookie);res.json({ok:true})});app.get('/v1/auth/me',auth,async(req:R,res)=>res.json({user:view(await prisma.user.findUnique({where:{id:req.userId!}}))}));app.get('/v1/profile',auth,async(req:R,res)=>res.json({user:view(await prisma.user.findUnique({where:{id:req.userId!}}))}));app.patch('/v1/profile',auth,async(req:R,res)=>{const keys=['name','profileType','profession','educationStage','schoolClass','fieldOfStudy','profileStatus','profileImageData'];const data:any={};for(const k of keys)if(req.body[k]!==undefined)data[k]=req.body[k]||null;if(data.name!==undefined&&!validateString(data.name,1,120))return fail(res,'VALIDATION_ERROR','Name is required and must be at most 120 characters.');if(data.profileType!==undefined&&!['STUDENT','WORKING_PROFESSIONAL','OTHER'].includes(data.profileType))return fail(res,'VALIDATION_ERROR','Invalid profile type.');if(data.profileStatus!==undefined&&data.profileStatus!==null&&!validateString(data.profileStatus,1,60))return fail(res,'VALIDATION_ERROR','Profile status must be at most 60 characters.');if(data.profileImageData!==undefined&&data.profileImageData!==null&&(!validateString(data.profileImageData,1,400000)||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data.profileImageData)))return fail(res,'VALIDATION_ERROR','Profile image must be a PNG, JPEG, or WebP data image under 400 KB.');res.json({user:view(await prisma.user.update({where:{id:req.userId!},data}))})});app.get('/v1/settings',auth,async(req:R,res)=>res.json({settings:await prisma.userSetting.upsert({where:{userId:req.userId!},create:{userId:req.userId!},update:{}})}));app.patch('/v1/settings',auth,async(req:R,res)=>res.json({settings:await prisma.userSetting.upsert({where:{userId:req.userId!},create:{userId:req.userId!},update:{theme:req.body.theme==='light'?'light':'dark'}})}));app.get('/v1/streak',auth,async(req:R,res)=>{const u=await prisma.user.findUnique({where:{id:req.userId!},select:{streakGoalDays:true,streakGoalRewardedAt:true}});const today=new Date();today.setUTCHours(0,0,0,0);const latest=await prisma.streakActivity.findFirst({where:{userId:req.userId!,activityDate:{lte:today}},orderBy:{activityDate:'desc'}});const latestDay=latest?new Date(latest.activityDate):null;if(latestDay)latestDay.setUTCHours(0,0,0,0);const missedDays=latestDay?Math.max(0,Math.round((today.getTime()-latestDay.getTime())/864e5)-1):0;res.json({streakDays:await streak(req.userId!),missedDays,streakGoalDays:u?.streakGoalDays??null,streakGoalRewardedAt:u?.streakGoalRewardedAt??null});});
app.post('/v1/streak/goal',auth,async(req:R,res)=>{const days=Number(req.body?.days);if(![7,14].includes(days))return fail(res,'VALIDATION_ERROR','Choose a 7-day or 14-day streak goal.');const reward=STREAK_GOAL_REWARDS[days];try{const result=await serializableTransaction(async tx=>{const u=await tx.user.findUnique({where:{id:req.userId!},select:{streakGoalDays:true,streakGoalRewardedAt:true,xp:true,level:true}});if(!u)throw new Error('USER_NOT_FOUND');if(u.streakGoalRewardedAt||u.streakGoalDays)return {already:true};await tx.user.update({where:{id:req.userId!},data:{streakGoalDays:days,streakGoalRewardedAt:new Date(),xp:{increment:reward.xp},coins:{increment:reward.coins},level:Math.max(u.level,Math.max(1,Math.floor((u.xp+reward.xp)/100))),lastActivityAt:new Date()}});await tx.rewardLedger.create({data:{userId:req.userId!,sourceId:req.userId!,rewardType:RewardType.XP,amount:reward.xp,reasonCode:'STREAK_GOAL_COMMITMENT',idempotencyKey:'streak-goal:'+req.userId+':'+days+':xp'}});await tx.rewardLedger.create({data:{userId:req.userId!,sourceId:req.userId!,rewardType:RewardType.COINS,amount:reward.coins,reasonCode:'STREAK_GOAL_COMMITMENT',idempotencyKey:'streak-goal:'+req.userId+':'+days+':coins'}});return {already:false};});const balances=await prisma.user.findUnique({where:{id:req.userId!},select:{xp:true,coins:true}});res.json({days,reward,already:result.already,balances});}catch(e:any){return fail(res,'INTERNAL_ERROR','The streak goal could not be saved.',500)}});app.post('/v1/streak/freeze',auth,async(req:R,res)=>{
  const days=Number(req.body?.days);
  if(!Number.isInteger(days)||!([1,2] as number[]).includes(days))return fail(res,'VALIDATION_ERROR','Choose a 1-day or 2-day streak freeze.');
  const cost=days===1?60:120; const today=new Date(); today.setUTCHours(0,0,0,0);
  const idempotency=requestIdempotencyKey(req);
  const transactionKey=idempotency?'streak-freeze:'+req.userId+':'+idempotency:'streak-freeze:'+req.userId+':'+today.toISOString().slice(0,10)+':'+days;
  try{
    const result=await serializableTransaction(async tx=>{
      const existing=await tx.rewardLedger.findFirst({where:{userId:req.userId!,reasonCode:'STREAK_FREEZE_'+days,idempotencyKey:transactionKey},select:{id:true}});
      if(existing)return {replayed:true};
      const latest=await tx.streakActivity.findFirst({where:{userId:req.userId!,activityDate:{lt:today}},orderBy:{activityDate:'desc'}});
      if(!latest)throw new Error('NO_STREAK');
      const latestDay=new Date(latest.activityDate); latestDay.setUTCHours(0,0,0,0);
      const missed=Math.round((today.getTime()-latestDay.getTime())/864e5)-1;
      if(missed!==days)throw new Error('INVALID_MISSED_DAYS');
      const updated=await tx.user.updateMany({where:{id:req.userId!,coins:{gte:cost}},data:{coins:{decrement:cost},lastActivityAt:new Date()}});
      if(updated.count!==1)throw new Error('INSUFFICIENT_FUNDS');
      for(let i=1;i<=days;i++){const d=new Date(latestDay);d.setUTCDate(d.getUTCDate()+i);await tx.streakActivity.create({data:{userId:req.userId!,activityDate:d,state:StreakState.RECOVERED,sourceId:req.userId!}});}
      await tx.streakActivity.upsert({where:{userId_activityDate:{userId:req.userId!,activityDate:today}},update:{state:StreakState.RECOVERED,sourceId:req.userId!},create:{userId:req.userId!,activityDate:today,state:StreakState.RECOVERED,sourceId:req.userId!}});
      await tx.rewardLedger.create({data:{userId:req.userId!,sourceId:req.userId!,rewardType:RewardType.COINS,amount:-cost,reasonCode:'STREAK_FREEZE_'+days,idempotencyKey:transactionKey}});
      return {replayed:false};
    });
    const balances=await prisma.user.findUnique({where:{id:req.userId!},select:{xp:true,coins:true}});
    return res.json({frozenDays:days,costCoins:cost,replayed:result.replayed,streakDays:await streak(req.userId!),balances});
  }catch(e:any){
    if(e?.message==='NO_STREAK')return fail(res,'STREAK_FREEZE_UNAVAILABLE','A streak freeze requires an existing streak.',409);
    if(e?.message==='INVALID_MISSED_DAYS')return fail(res,'STREAK_FREEZE_UNAVAILABLE','The requested freeze does not match the actual consecutive missed days.',409);
    if(e?.message==='INSUFFICIENT_FUNDS')return fail(res,'INSUFFICIENT_FUNDS','A '+days+'-day freeze costs '+cost+' coins.',409);
    if(e?.code==='P2002')return fail(res,'STREAK_FREEZE_ALREADY_USED','Those days are already covered by activity.',409);
    return fail(res,'INTERNAL_ERROR','Unable to apply streak freeze.',500);
  }
});app.get('/v1/dashboard',auth,async(req:R,res)=>{const u=await prisma.user.findUnique({where:{id:req.userId!}});const progress=await prisma.userProjectProgress.findMany({where:{userId:req.userId!},include:{project:true},orderBy:{lastActivityAt:'desc'},take:5});res.json({user:view(u),streakDays:await streak(req.userId!),badgesCount:await prisma.userBadge.count({where:{userId:req.userId!}}),activeProgress:progress.map(p=>({projectId:p.projectId,title:p.project.title,status:p.status,progressPercent:p.progressPercent}))})});app.get('/v1/badges',auth,async(req:R,res)=>res.json({badges:await prisma.userBadge.findMany({where:{userId:req.userId!},include:{badge:true},orderBy:{earnedAt:'desc'}})}));app.get('/v1/leaderboard',async(_,res)=>{
 const c=await prisma.leagueCycle.findFirst({where:{status:'OPEN'},orderBy:{startsAt:'desc'}});
 const users=await prisma.user.findMany({orderBy:[{xp:'desc'},{createdAt:'asc'}],select:{id:true,name:true,username:true,xp:true}});
 const participantRows=c?await prisma.leagueParticipant.findMany({where:{cycleId:c.id},select:{userId:true,streakDays:true}}):[];
 const streakByUser=new Map(participantRows.map(row=>[row.userId,row.streakDays]));
 const entries=users.map((user,index)=>({rank:index+1,userId:user.id,name:user.name,username:user.username,kp:user.xp,streakDays:streakByUser.get(user.id)||0}));
 res.json({opened:entries.length>0,cycle:c?{id:c.id,name:c.name,startsAt:c.startsAt,endsAt:c.endsAt}:null,entries});
});app.post('/v1/league/join',auth,async(req:R,res)=>{const c=await prisma.leagueCycle.findFirst({where:{status:'OPEN'},orderBy:{startsAt:'desc'}});if(!c)return fail(res,'LEAGUE_CLOSED','There is no open league cycle.',409);res.json({joined:true,entry:await prisma.leagueParticipant.upsert({where:{cycleId_userId:{cycleId:c.id,userId:req.userId!}},update:{},create:{cycleId:c.id,userId:req.userId!}})})});app.get('/v1/quotes/daily',async(_,res)=>{const quotes=await prisma.dailyQuote.findMany({orderBy:{dateKey:'asc'}});if(!quotes.length)return res.json({quote:null});const dayKey=new Date().toISOString().slice(0,10);const index=Math.floor(Date.now()/864e5)%quotes.length;const selected=quotes[index];res.json({quote:{id:selected.id,quote:selected.quote,author:selected.source,date:dayKey,category:selected.category}})});app.get('/v1/directives',auth,async(req:R,res)=>{const ds=await prisma.dailyDirective.findMany({where:{active:true},orderBy:{ordering:'asc'}});const day=new Date(new Date().toISOString().slice(0,10));const cs=await prisma.directiveClaim.findMany({where:{userId:req.userId!,claimDate:day}});res.json({directives:ds.map(d=>({...d,claimed:cs.some(c=>c.directiveId===d.id)}))})});app.post('/v1/directives/:id/claim',auth,async(req:R,res)=>{const d=await prisma.dailyDirective.findUnique({where:{id:String(req.params.id)}});if(!d)return fail(res,'NOT_FOUND','Directive not found.',404);const day=new Date(new Date().toISOString().slice(0,10));try{await prisma.$transaction(async tx=>{await tx.directiveClaim.create({data:{directiveId:d.id,userId:req.userId!,claimDate:day}});const currentUser=await tx.user.findUnique({where:{id:req.userId!},select:{xp:true,level:true}});if(!currentUser)throw new Error('USER_NOT_FOUND');const nextXp=currentUser.xp+d.rewardXp;const nextLevel=Math.max(currentUser.level,Math.max(1,Math.floor(nextXp/100)));await tx.user.update({where:{id:req.userId!},data:{xp:{increment:d.rewardXp},coins:{increment:d.rewardCoins},level:nextLevel,lastActivityAt:new Date()}});if(d.rewardXp)await tx.rewardLedger.create({data:{userId:req.userId!,sourceId:d.id,rewardType:RewardType.XP,amount:d.rewardXp,reasonCode:'DIRECTIVE',idempotencyKey:'directive:'+d.id+':'+req.userId+':xp:'+day.toISOString()}});if(d.rewardCoins)await tx.rewardLedger.create({data:{userId:req.userId!,sourceId:d.id,rewardType:RewardType.COINS,amount:d.rewardCoins,reasonCode:'DIRECTIVE',idempotencyKey:'directive:'+d.id+':'+req.userId+':coins:'+day.toISOString()}});await tx.streakActivity.upsert({where:{userId_activityDate:{userId:req.userId!,activityDate:day}},update:{},create:{userId:req.userId!,activityDate:day,state:StreakState.QUALIFIED,sourceId:d.id}});const c=await tx.leagueCycle.findFirst({where:{status:'OPEN'},orderBy:{startsAt:'desc'}});if(c)await tx.leagueParticipant.upsert({where:{cycleId_userId:{cycleId:c.id,userId:req.userId!}},update:{kp:{increment:d.rewardXp}},create:{cycleId:c.id,userId:req.userId!,kp:d.rewardXp}})});res.json({claimed:true,rewardXp:d.rewardXp,rewardCoins:d.rewardCoins})}catch{return fail(res,'ALREADY_CLAIMED','Directive already claimed today.',409)}});app.post('/v1/feedback',auth,async(req:R,res)=>{if(!validateString(req.body?.message,1,5000))return fail(res,'VALIDATION_ERROR','Message is required and must be a string of at most 5000 characters.');res.status(201).json({feedback:await prisma.feedback.create({data:{userId:req.userId!,category:req.body.category||'GENERAL',message:req.body.message}})})});app.post('/v1/test/prepare-mission-access',async(req,res)=>{
  if(process.env.E2E_TEST_MODE!=='1')return fail(res,'NOT_FOUND','Not found.',404);
  const token=String(req.headers['x-e2e-token']||'');
  if(!process.env.E2E_TEST_TOKEN||token!==process.env.E2E_TEST_TOKEN)return fail(res,'NOT_FOUND','Not found.',404);
  const missionTitle=String(req.body?.missionTitle||'').trim();
  if(!missionTitle)return fail(res,'VALIDATION_ERROR','missionTitle is required.');
  const mission=await prisma.project.findFirst({
    where:{title:missionTitle,status:'PUBLISHED',currentPublishedVersion:{status:'PUBLISHED'}},
    include:{subject:true},
  });
  if(!mission)return fail(res,'NOT_FOUND','Mission not found.',404);
  const previous=await prisma.project.findMany({
    where:{subjectId:mission.subjectId,status:'PUBLISHED',currentPublishedVersion:{status:'PUBLISHED'},createdAt:{lt:mission.createdAt}},
    orderBy:{createdAt:'asc'},
    select:{id:true,title:true},
  });
  const suffix=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const username=('e2e_'+suffix).slice(0,50);
  const password='NextessE2E!2026';
  const user=await prisma.user.create({
    data:{name:'E2E Mission Fixture',username,passwordHash:hashPassword(password),profileType:'STUDENT',xp:100,coins:100},
  });
  if(previous.length){
    await prisma.userProjectProgress.createMany({
      data:previous.map(project=>({
        userId:user.id,
        projectId:project.id,
        status:'COMPLETED',
        progressPercent:100,
        completedAt:new Date(),
        lastActivityAt:new Date(),
      })),
      skipDuplicates:true,
    });
  }
  res.status(201).json({username,password,missionId:mission.id,preparedPreviousMissions:previous.map(p=>p.title)});
});
app.get('/v1/subjects',async(_,res)=>res.json({subjects:await prisma.subject.findMany({orderBy:{ordering:'asc'}})}));app.get('/v1/subjects/:subjectId/projects',optionalAuth,async(req:R,res)=>{const projects=await prisma.project.findMany({where:{subjectId:String(req.params.subjectId),status:'PUBLISHED',currentPublishedVersion:{status:'PUBLISHED'}},orderBy:{createdAt:'asc'},include:{subject:true,currentPublishedVersion:{select:{id:true,version:true,contentMetadata:true,levels:{orderBy:{levelNumber:'asc'},select:{id:true,levelNumber:true,title:true,rewardXp:true,rewardCoins:true,questions:{select:{id:true}}}}}}}});const progressRows=req.userId?await prisma.userProjectProgress.findMany({where:{userId:req.userId,projectId:{in:projects.map(p=>p.id)}}}):[];const guest=req.userId?null:await guestSession(req,res,false);const guestCompleted=guest?await prisma.investigation.findMany({where:{anonymousSessionId:guest.id,status:'COMPLETED',projectId:{in:projects.map(p=>p.id)}},select:{projectId:true}}):[];const completed=new Set([...progressRows.filter(p=>p.status==='COMPLETED').map(p=>p.projectId),...guestCompleted.map(p=>p.projectId)]);res.json({projects:projects.map((p,index)=>({...p,levelsCount:p.currentPublishedVersion?.levels.length??0,progressStatus:req.userId?(progressRows.find(row=>row.projectId===p.id)?.status||'NOT_STARTED'):(guestCompleted.some(row=>row.projectId===p.id)?'COMPLETED':'NOT_STARTED'),unlocked:index===0||completed.has(projects[index-1].id)}))})});app.get('/v1/projects/:projectId',optionalAuth,async(req:R,res)=>{
 const p:any=await prisma.project.findFirst({
  where:{id:String(req.params.projectId),status:'PUBLISHED'},
  include:{
   subject:true,
   currentPublishedVersion:{
    include:{
     levels:{
      orderBy:{levelNumber:'asc'},
      select:{
       id:true,levelNumber:true,title:true,learningObjectives:true,completionRules:true,debrief:true,
       questions:{
        orderBy:{ordering:'asc'},
        select:{
         id:true,questionNumber:true,questionType:true,prompt:true,inputSchema:true,
         options:{orderBy:{optionKey:'asc'}},
         hints:{orderBy:{level:'asc'}}
        }
       },
       simulation:{
        include:{
         assets:true,
         variables:{orderBy:{variableKey:'asc'}},
         consequences:{orderBy:{ordering:'asc'}}
        }
       }
      }
     },
     caseFiles:{orderBy:{ordering:'asc'}}
    }
   }
  }
 });
 if(!p||p.currentPublishedVersion?.status!=='PUBLISHED')return fail(res,'NOT_FOUND','Published project not found.',404);
 const progress=req.userId?await prisma.userProjectProgress.findUnique({where:{userId_projectId:{userId:req.userId,projectId:p.id}}}):null;
 const levelProgress=req.userId?await prisma.userLevelProgress.findMany({where:{userId:req.userId,level:{projectVersionId:p.currentPublishedVersion?.id}},orderBy:{levelId:'asc'}}):[];
 const previousMission=await prisma.project.findFirst({where:{subjectId:p.subjectId,status:'PUBLISHED',createdAt:{lt:p.createdAt},currentPublishedVersion:{status:'PUBLISHED'}},orderBy:{createdAt:'desc'},select:{id:true,title:true}});
 let unlocked=!previousMission;
 if(previousMission){
   if(req.userId){
     const previousProgress=await prisma.userProjectProgress.findUnique({where:{userId_projectId:{userId:req.userId,projectId:previousMission.id}},select:{status:true}});
     unlocked=previousProgress?.status==='COMPLETED';
   }else{
     const guest=await guestSession(req,res,false);
     unlocked=Boolean(guest&&await prisma.investigation.findFirst({where:{anonymousSessionId:guest.id,projectId:previousMission.id,status:'COMPLETED'},select:{id:true}}));
   }
 }
 const nextMission=await prisma.project.findFirst({where:{subjectId:p.subjectId,status:'PUBLISHED',createdAt:{gt:p.createdAt},currentPublishedVersion:{status:'PUBLISHED'}},orderBy:{createdAt:'asc'},select:{id:true,title:true}});
 res.json({project:p,progress,levelProgress,unlocked,nextMission});
});
app.post('/v1/projects/:projectId/start',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,true);
 if(!identity)return fail(res,'SESSION_ERROR','Unable to establish a learner session.',500);
 if(!validateUuid(String(req.params.projectId)))return fail(res,'VALIDATION_ERROR','Invalid project ID.');
 const p=await prisma.project.findUnique({where:{id:String(req.params.projectId),status:'PUBLISHED'},include:{currentPublishedVersion:true}});
 if(!p?.currentPublishedVersion||p.currentPublishedVersion.status!=='PUBLISHED')return fail(res,'NOT_FOUND','Published project not found.',404);
 if(identity.anonymous&&!p.anonymousAccess)return fail(res,'AUTH_REQUIRED','Sign in to start this mission.',401);const previous=await prisma.project.findFirst({where:{subjectId:p.subjectId,status:'PUBLISHED',currentPublishedVersion:{status:'PUBLISHED'},createdAt:{lt:p.createdAt}},orderBy:{createdAt:'desc'},select:{id:true,title:true}});if(previous){const previousRow=identity.userId?await prisma.userProjectProgress.findUnique({where:{userId_projectId:{userId:identity.userId,projectId:previous.id}},select:{status:true}}):null;const previousCompleted=identity.userId?previousRow?.status==='COMPLETED':Boolean(await prisma.investigation.findFirst({where:{anonymousSessionId:identity.anonymousSessionId,projectId:previous.id,status:'COMPLETED'},select:{id:true}}));if(!previousCompleted)return fail(res,'MISSION_LOCKED','Complete "'+previous.title+'" before starting this mission.',409);}
 const whereIdentity=identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId};
 const existing=await prisma.investigation.findFirst({where:{...whereIdentity,projectId:p.id,status:'IN_PROGRESS'},orderBy:{startedAt:'desc'}});
 if(existing)return res.json({investigationId:existing.id,replayed:false,resumed:true,anonymous:identity.anonymous});
 const progress=identity.userId?await prisma.userProjectProgress.findUnique({where:{userId_projectId:{userId:identity.userId,projectId:p.id}}}):null;
 const replayed=Boolean(identity.userId&&progress?.status==='COMPLETED');
 const firstLevel=await prisma.level.findFirst({where:{projectVersionId:p.currentPublishedVersion.id},orderBy:{levelNumber:'asc'},include:{questions:{orderBy:{ordering:'asc'},take:1}}});
 if(!firstLevel?.questions[0])return fail(res,'MISSION_INVALID','Published mission has no startable task.',409);
 try{
  const inv=await serializableTransaction(async tx=>{
   if(replayed){
    const u=await tx.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}});
    if(!u||u.xp<10||u.coins<10)throw new Error('INSUFFICIENT_FUNDS');
    const stamp=crypto.randomUUID();
    await tx.user.update({where:{id:identity.userId!},data:{xp:{decrement:10},coins:{decrement:10},lastActivityAt:new Date()}});
    await tx.rewardLedger.create({data:{userId:identity.userId!,sourceId:p.id,rewardType:RewardType.XP,amount:-10,reasonCode:'MISSION_REVIEW',idempotencyKey:'mission-review:'+p.id+':'+stamp+':xp'}});
    await tx.rewardLedger.create({data:{userId:identity.userId!,sourceId:p.id,rewardType:RewardType.COINS,amount:-10,reasonCode:'MISSION_REVIEW',idempotencyKey:'mission-review:'+p.id+':'+stamp+':coins'}});
   }
   const created=await tx.investigation.create({data:{projectId:p.id,projectVersionId:p.currentPublishedVersion!.id,userId:identity.userId??undefined,anonymousSessionId:identity.anonymousSessionId??undefined,currentLevelId:firstLevel.id,currentQuestionId:firstLevel.questions[0].id,status:'IN_PROGRESS'}});
   if(identity.userId)await tx.userProjectProgress.upsert({where:{userId_projectId:{userId:identity.userId,projectId:p.id}},update:{status:'IN_PROGRESS',currentLevelId:firstLevel.id,currentQuestionId:firstLevel.questions[0].id,progressPercent:0,completedAt:null,lastActivityAt:new Date()},create:{userId:identity.userId,projectId:p.id,status:'IN_PROGRESS',currentLevelId:firstLevel.id,currentQuestionId:firstLevel.questions[0].id,progressPercent:0,lastActivityAt:new Date()}});
   return created;
  });
  res.status(201).json({investigationId:inv.id,replayed,anonymous:identity.anonymous});
 }catch(e:any){
  if(e?.message==='INSUFFICIENT_FUNDS')return fail(res,'INSUFFICIENT_FUNDS','Reviewing a completed mission costs 10 KP and 10 coins.',409);
  return fail(res,'INTERNAL_ERROR','Unable to start mission.',500);
 }
});
app.get('/v1/investigations/:id',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);
 if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 const inv:any=await prisma.investigation.findFirst({where:{id:String(req.params.id),...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})},include:{project:true,projectVersion:{include:{levels:{orderBy:{levelNumber:'asc'},include:{questions:{orderBy:{ordering:'asc'},select:{id:true,questionNumber:true,questionType:true,prompt:true,inputSchema:true,options:{orderBy:{optionKey:'asc'}},hints:{orderBy:{level:'asc'}}}},simulation:{include:{assets:true,variables:{orderBy:{variableKey:'asc'},},consequences:{orderBy:{ordering:'asc'}}}}}},caseFiles:{orderBy:{ordering:'asc'}}}},answers:{orderBy:{submittedAt:'asc'},select:{id:true,questionId:true,attemptNumber:true,result:true,feedbackData:true,submittedAt:true}}}});
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 const user=identity.userId?await prisma.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}}):{xp:0,coins:0};
 res.json({investigation:inv,balances:user,anonymous:identity.anonymous});
});
app.post('/v1/investigations/:id/answers',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);
 if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 if(!validateUuid(String(req.params.id)))return fail(res,'VALIDATION_ERROR','Invalid investigation ID.');
 const inv:any=await prisma.investigation.findFirst({where:{id:String(req.params.id),...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})},include:{projectVersion:{include:{levels:{orderBy:{levelNumber:'asc'},include:{questions:{orderBy:{ordering:'asc'}}}}}}}});
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 if(!validateUuid(req.body?.questionId))return fail(res,'VALIDATION_ERROR','Invalid question ID.');
 if(!req.body||req.body.answer===undefined)return fail(res,'VALIDATION_ERROR','An answer is required.');
 const clientKey=requestIdempotencyKey(req);
 if(!clientKey)return fail(res,'IDEMPOTENCY_KEY_REQUIRED','An Idempotency-Key header is required for answer submission.',400);
 const scopedKey=hash((identity.userId||('anonymous:'+identity.anonymousSessionId))+':investigation:'+inv.id+':answer:'+clientKey);
 const existing=await prisma.investigationAnswer.findUnique({where:{idempotencyKey:scopedKey}});
 if(existing){
  const balances=identity.userId?await prisma.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}}):{xp:0,coins:0};
  return res.json({result:existing.result,answerId:existing.id,feedbackData:existing.feedbackData,replayed:true,levelCompleted:false,missionCompleted:false,reward:{xp:0,coins:0},penalty:{xp:0,coins:0},levelPenalty:{xp:0,coins:0},netChange:{xp:0,coins:0},balances:balances??{xp:0,coins:0},anonymous:identity.anonymous});
 }
 if(inv.status!=='IN_PROGRESS')return fail(res,'INVESTIGATION_CLOSED','This investigation is already completed.',409);
 const q=await prisma.question.findFirst({where:{id:req.body.questionId,level:{projectVersionId:inv.projectVersionId}}});
 if(!q)return fail(res,'NOT_FOUND','Question not found for this investigation.',404);
 const incoming=validateObject(req.body.answer)
  ? (Object.prototype.hasOwnProperty.call(req.body.answer,'value')?req.body.answer.value:Object.prototype.hasOwnProperty.call(req.body.answer,'text')?req.body.answer.text:req.body.answer)
  : req.body.answer;
 if(incoming===undefined||incoming===null||(typeof incoming==='string'&&incoming.trim()===''))return fail(res,'VALIDATION_ERROR','An answer is required.');
 const evaluation=evaluateChallenge({type:q.questionType,value:incoming,definition:(q.evaluationDefinition||{}) as any});
 try{
  const outcome=await serializableTransaction(async tx=>{
   const current:any=await tx.investigation.findUnique({where:{id:inv.id},include:{projectVersion:{include:{levels:{orderBy:{levelNumber:'asc'},include:{questions:{orderBy:{ordering:'asc'}}}}}}}});
   if(!current)throw new Error('INVESTIGATION_NOT_FOUND');
   if(current.status!=='IN_PROGRESS')throw new Error('INVESTIGATION_CLOSED');
   const attempts=await tx.investigationAnswer.count({where:{investigationId:current.id,questionId:q.id}})+1;
   const created=await tx.investigationAnswer.create({data:{investigationId:current.id,questionId:q.id,userId:identity.userId??undefined,attemptNumber:attempts,idempotencyKey:scopedKey,answerPayload:req.body.answer,normalizedAnswer:{value:evaluation.normalizedAnswer as any},result:evaluation.correct?'CORRECT':'INCORRECT',evaluatorVersion:evaluation.evaluatorVersion,feedbackData:evaluation.feedback}});
   let penalty={xp:0,coins:0};
   if(evaluation.correct&&identity.userId){
    await rewardChallenge(tx,identity.userId!,current.id,q.id);
   }
   if(!evaluation.correct&&identity.userId){
    const u=await tx.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}});
    if(!u)throw new Error('USER_NOT_FOUND');
    const xpPenalty=0,coinPenalty=0;
    if(xpPenalty||coinPenalty){
     await tx.user.update({where:{id:identity.userId!},data:{...(xpPenalty?{xp:{decrement:xpPenalty}}:{}),...(coinPenalty?{coins:{decrement:coinPenalty}}:{}),lastActivityAt:new Date()}});
     if(xpPenalty)await tx.rewardLedger.create({data:{userId:identity.userId!,investigationId:current.id,sourceId:q.id,rewardType:RewardType.XP,amount:-xpPenalty,reasonCode:'MISSION_WRONG_ANSWER',idempotencyKey:'wrong:'+created.id+':xp'}});
     if(coinPenalty)await tx.rewardLedger.create({data:{userId:identity.userId!,investigationId:current.id,sourceId:q.id,rewardType:RewardType.COINS,amount:-coinPenalty,reasonCode:'MISSION_WRONG_ANSWER',idempotencyKey:'wrong:'+created.id+':coins'}});
     penalty={xp:xpPenalty,coins:coinPenalty};
    }
   }
   let levelCompleted=false,missionCompleted=false,reward={xp:0,coins:0},levelPenalty={xp:0,coins:0},levelPerfect=false;
   {
    const level=current.projectVersion.levels.find((l:any)=>l.questions.some((x:any)=>x.id===q.id));
    if(level){
     const ids=level.questions.map((x:any)=>x.id);
     const rows=await tx.investigationAnswer.findMany({where:{investigationId:current.id,questionId:{in:ids}},orderBy:{submittedAt:'desc'}});
     const latest=new Map<string,any>();for(const row of rows)if(!latest.has(row.questionId))latest.set(row.questionId,row);
     const reveals:any=current.state&&typeof current.state==='object'&&current.state.reveals&&typeof current.state.reveals==='object'?current.state.reveals:{};levelCompleted=ids.length>0&&ids.every((id:string)=>Boolean(latest.get(id)||reveals[id]));levelPerfect=levelCompleted&&ids.every((id:string)=>latest.get(id)?.result==='CORRECT');
     const nextQuestion=level.questions.find((x:any)=>!latest.has(x.id)&&!reveals[x.id]);
     if(levelCompleted){
      const finalLevel=current.projectVersion.levels[current.projectVersion.levels.length-1]?.id===level.id;
      if(identity.userId){
       const positive=await tx.rewardLedger.findMany({where:{userId:identity.userId!,investigationId:current.id,sourceId:{in:ids},amount:{gt:0}},select:{rewardType:true,amount:true}});reward={xp:positive.filter((x:any)=>x.rewardType===RewardType.XP).reduce((a:number,x:any)=>a+Number(x.amount),0),coins:positive.filter((x:any)=>x.rewardType===RewardType.COINS).reduce((a:number,x:any)=>a+Number(x.amount),0)};if(levelPerfect)await awardBadge(tx,identity.userId!,'perfect-mission',{levelId:level.id,investigationId:current.id});
       await tx.userLevelProgress.upsert({where:{userId_levelId:{userId:identity.userId!,levelId:level.id}},update:{status:'COMPLETED',completedQuestions:ids.length,totalQuestions:ids.length,completedAt:new Date(),currentQuestionId:null},create:{userId:identity.userId!,levelId:level.id,status:'COMPLETED',completedQuestions:ids.length,totalQuestions:ids.length,completedAt:new Date(),currentQuestionId:null}});
      }
      if(finalLevel){
       missionCompleted=true;
       await tx.investigation.update({where:{id:current.id},data:{status:'COMPLETED',completedAt:new Date(),lastActivityAt:new Date(),currentLevelId:level.id,currentQuestionId:q.id}});
       if(identity.userId)await tx.userProjectProgress.upsert({where:{userId_projectId:{userId:identity.userId!,projectId:current.projectId}},update:{status:'COMPLETED',progressPercent:100,completedAt:new Date(),currentLevelId:null,currentQuestionId:null,lastActivityAt:new Date()},create:{userId:identity.userId!,projectId:current.projectId,status:'COMPLETED',progressPercent:100,completedAt:new Date(),lastActivityAt:new Date()}});
      }else if(identity.userId){
       await tx.userLevelProgress.upsert({where:{userId_levelId:{userId:identity.userId!,levelId:level.id}},update:{status:'COMPLETED',completedQuestions:ids.length,totalQuestions:ids.length,completedAt:new Date(),currentQuestionId:null},create:{userId:identity.userId!,levelId:level.id,status:'COMPLETED',completedQuestions:ids.length,totalQuestions:ids.length,completedAt:new Date(),currentQuestionId:null}});
      }
     }else if(nextQuestion){
      const nextIndex=level.questions.findIndex((x:any)=>x.id===nextQuestion.id);
      await tx.investigation.update({where:{id:current.id},data:{currentLevelId:level.id,currentQuestionId:nextQuestion.id,lastActivityAt:new Date()}});
      if(identity.userId)await tx.userLevelProgress.upsert({where:{userId_levelId:{userId:identity.userId!,levelId:level.id}},update:{status:'IN_PROGRESS',currentQuestionId:nextQuestion.id,completedQuestions:Math.max(0,nextIndex),totalQuestions:ids.length},create:{userId:identity.userId!,levelId:level.id,status:'IN_PROGRESS',currentQuestionId:nextQuestion.id,completedQuestions:Math.max(0,nextIndex),totalQuestions:ids.length}});
     }
     if(identity.userId){
      const rowsPenalty=await tx.rewardLedger.findMany({where:{userId:identity.userId!,investigationId:current.id,sourceId:{in:ids},reasonCode:'MISSION_WRONG_ANSWER'},select:{rewardType:true,amount:true}});
      levelPenalty={xp:Math.abs(rowsPenalty.filter((x:any)=>x.rewardType===RewardType.XP).reduce((a:number,x:any)=>a+Number(x.amount),0)),coins:Math.abs(rowsPenalty.filter((x:any)=>x.rewardType===RewardType.COINS).reduce((a:number,x:any)=>a+Number(x.amount),0))};
     }
    }
   }
   const balances=identity.userId?await tx.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}}):{xp:0,coins:0};
   return {answer:created,levelCompleted,levelPerfect,missionCompleted,reward,penalty:{xp:0,coins:0},levelPenalty:{xp:0,coins:0},balances:balances??{xp:0,coins:0}};
  });
  return res.json({result:evaluation.correct?'CORRECT':'INCORRECT',answerId:outcome.answer.id,feedbackData:evaluation.feedback,explanation:q.explanation,replayed:false,levelCompleted:outcome.levelCompleted,levelPerfect:outcome.levelPerfect,missionCompleted:outcome.missionCompleted,reward:outcome.reward,penalty:{xp:0,coins:0},levelPenalty:{xp:0,coins:0},netChange:{xp:outcome.reward.xp,coins:outcome.reward.coins},balances:outcome.balances,anonymous:identity.anonymous});
 }catch(e:any){
  if(e?.message==='INVESTIGATION_NOT_FOUND')return fail(res,'NOT_FOUND','Investigation not found.',404);
  if(e?.message==='INVESTIGATION_CLOSED')return fail(res,'INVESTIGATION_CLOSED','This investigation is already completed.',409);
  if(e?.message==='TASK_NOT_AVAILABLE')return fail(res,'TASK_NOT_AVAILABLE','Complete the current task before advancing.',409);
  if(e?.message==='USER_NOT_FOUND')return fail(res,'AUTH_REQUIRED','Authentication session is no longer valid.',401);
  if(e?.code==='P2002'){
   const replay=await prisma.investigationAnswer.findUnique({where:{idempotencyKey:scopedKey}});
   if(replay)return res.json({result:replay.result,answerId:replay.id,feedbackData:replay.feedbackData,replayed:true,levelCompleted:false,missionCompleted:false,reward:{xp:0,coins:0},penalty:{xp:0,coins:0},levelPenalty:{xp:0,coins:0},netChange:{xp:0,coins:0},balances:identity.userId?(await prisma.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}})??{xp:0,coins:0}):{xp:0,coins:0},anonymous:identity.anonymous});
  }
  return fail(res,'CONFLICT','The answer submission could not be safely committed. Retry with the same Idempotency-Key.',409);
 }
});
app.post('/v1/investigations/:id/hints',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 const inv:any=await prisma.investigation.findFirst({where:{id:String(req.params.id),...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})}});
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 if(inv.status!=='IN_PROGRESS')return fail(res,'INVESTIGATION_CLOSED','This investigation is already completed.',409);
 if(!validateUuid(String(req.body?.questionId)))return fail(res,'VALIDATION_ERROR','Invalid question ID.');
 const q=await prisma.question.findFirst({where:{id:req.body.questionId,level:{projectVersionId:inv.projectVersionId}},include:{hints:{orderBy:{level:'asc'}}}});
 if(!q)return fail(res,'NOT_FOUND','Question not found for this investigation.',404);
 const submitted=Boolean(await prisma.investigationAnswer.findFirst({where:{investigationId:inv.id,questionId:q.id},select:{id:true}}));
 const state:any=inv.state&&typeof inv.state==='object'?inv.state:{};const revealedAlready=Boolean(state.reveals?.[q.id]);const ledgerUsed=identity.userId?await prisma.rewardLedger.count({where:{userId:identity.userId!,investigationId:inv.id,sourceId:q.id,rewardType:RewardType.COINS,reasonCode:'MISSION_HINT'}}):0;const used=Math.max(Number(state.hints?.[q.id]||0),ledgerUsed);
 const next=q.hints.find((h:any)=>h.level===used+1);if(!next)return fail(res,'NO_MORE_HINTS','All hints for this question have already been revealed.',409);
 const costCoins=identity.userId&&!submitted&&!revealedAlready?5:0;
 try{
  if(identity.userId){
   await prisma.$transaction(async tx=>{
    if(costCoins){
      const updated=await tx.user.updateMany({where:{id:identity.userId!,coins:{gte:costCoins}},data:{coins:{decrement:costCoins},lastActivityAt:new Date()}});
      if(updated.count!==1)throw new Error('INSUFFICIENT_FUNDS');
      await tx.rewardLedger.create({data:{userId:identity.userId!,investigationId:inv.id,sourceId:q.id,rewardType:RewardType.COINS,amount:-costCoins,reasonCode:'MISSION_HINT',idempotencyKey:'hint:'+inv.id+':'+q.id+':'+next.level}});
    }
    await tx.investigation.update({where:{id:inv.id},data:{state:{...state,hints:{...(state.hints||{}),[q.id]:next.level}}}});
   });
  }else{
   await prisma.investigation.update({where:{id:inv.id},data:{state:{...state,hints:{...(state.hints||{}),[q.id]:next.level}}}});
  }
  const balances=identity.userId?await prisma.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}}):{xp:0,coins:0};
  res.json({hint:next.text,level:next.level,cost:{xp:0,coins:costCoins},balances,anonymous:identity.anonymous});
 }catch(e:any){
  if(e?.message==='INSUFFICIENT_FUNDS')return fail(res,'INSUFFICIENT_FUNDS','Using a hint costs 5 coins.',409);
  if(e?.code==='P2002')return fail(res,'HINT_ALREADY_USED','That hint has already been revealed.',409);
  return fail(res,'INTERNAL_ERROR','Unable to reveal hint.',500);
 }
});
app.post('/v1/investigations/:id/reveal-answer', optionalAuth, async (req:R,res) => {
 const identity=await learner(req,res,false);
 if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);

 const inv:any=await prisma.investigation.findFirst({
  where:{id:String(req.params.id),...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})}
 });
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 if(inv.status!=='IN_PROGRESS')return fail(res,'INVESTIGATION_CLOSED','This investigation is already completed.',409);
 if(!validateUuid(String(req.body?.questionId)))return fail(res,'VALIDATION_ERROR','Invalid question ID.');
 const q=await prisma.question.findFirst({
  where:{id:req.body.questionId,level:{projectVersionId:inv.projectVersionId}}
 });
 if(!q)return fail(res,'NOT_FOUND','Question not found for this investigation.',404);

 const def:any=q.evaluationDefinition||{};
 const base='reveal:'+inv.id+':'+q.id;
 const state:any=inv.state&&typeof inv.state==='object'?inv.state:{};

 const submitted=Boolean(await prisma.investigationAnswer.findFirst({
  where:{investigationId:inv.id,questionId:q.id},
  select:{id:true}
 }));
 if(submitted){
  return res.json({
   answer:def.answer,
   explanation:q.explanation,
   cost:{xp:0,coins:0},
   alreadyCharged:true,
   balances:identity.userId
    ? (await prisma.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}})??{xp:0,coins:0})
    : {xp:0,coins:0},
   anonymous:identity.anonymous
  });
 }

 if(!identity.userId){
  if(state.reveals?.[q.id]){
   return res.json({
    answer:def.answer,explanation:q.explanation,cost:{xp:0,coins:0},
    alreadyCharged:true,balances:{xp:0,coins:0},anonymous:true
   });
  }

  await prisma.investigation.update({
   where:{id:inv.id},
   data:{state:{...state,reveals:{...(state.reveals||{}),[q.id]:true}}}
  });

  return res.json({
   answer:def.answer,explanation:q.explanation,cost:{xp:0,coins:0},
   alreadyCharged:false,balances:{xp:0,coins:0},anonymous:true
  });
 }

 const already=await prisma.rewardLedger.findFirst({
  where:{idempotencyKey:base+':xp'}
 });
 if(already){
  if(!state.reveals?.[q.id]){
   await prisma.investigation.update({
    where:{id:inv.id},
    data:{state:{...state,reveals:{...(state.reveals||{}),[q.id]:true}}}
   });
  }

  return res.json({
   answer:def.answer,
   explanation:q.explanation,
   cost:{xp:0,coins:0},
   alreadyCharged:true,
   balances:await prisma.user.findUnique({
    where:{id:identity.userId!},
    select:{xp:true,coins:true}
   })
  });
 }

 try{
  await prisma.$transaction(async tx=>{
   const updated=await tx.user.updateMany({
    where:{id:identity.userId!,xp:{gte:5},coins:{gte:2}},
    data:{xp:{decrement:5},coins:{decrement:2},lastActivityAt:new Date()}
   });
   if(updated.count!==1)throw new Error('INSUFFICIENT_FUNDS');

   await tx.rewardLedger.create({
    data:{
     userId:identity.userId!,investigationId:inv.id,sourceId:q.id,
     rewardType:RewardType.XP,amount:-5,reasonCode:'MISSION_REVEAL',
     idempotencyKey:base+':xp'
    }
   });
   await tx.rewardLedger.create({
    data:{
     userId:identity.userId!,investigationId:inv.id,sourceId:q.id,
     rewardType:RewardType.COINS,amount:-2,reasonCode:'MISSION_REVEAL',
     idempotencyKey:base+':coins'
    }
   });
   await tx.investigation.update({
    where:{id:inv.id},
    data:{state:{...state,reveals:{...(state.reveals||{}),[q.id]:true}}}
   });
  });

  return res.json({
   answer:def.answer,
   explanation:q.explanation,
   cost:{xp:5,coins:2},
   balances:await prisma.user.findUnique({
    where:{id:identity.userId!},
    select:{xp:true,coins:true}
   })
  });
 }catch(e:any){
  if(e?.message==='INSUFFICIENT_FUNDS'){
   return fail(res,'INSUFFICIENT_FUNDS','Revealing an answer costs 5 KP and 2 coins.',409);
  }
  if(e?.code==='P2002'){
   return fail(res,'REVEAL_ALREADY_USED','The answer has already been revealed for this question.',409);
  }
  return fail(res,'INTERNAL_ERROR','Unable to reveal answer.',500);
 }
});

app.post('/v1/investigations/:id/advance-level',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);
 if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 const inv:any=await prisma.investigation.findFirst({
  where:{id:String(req.params.id),...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})},
  include:{projectVersion:{include:{levels:{orderBy:{levelNumber:'asc'},include:{questions:{orderBy:{ordering:'asc'}}}}}}}
 });
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 if(inv.status!=='IN_PROGRESS')return fail(res,'INVESTIGATION_CLOSED','This investigation is already completed.',409);
 const currentIndex=inv.projectVersion.levels.findIndex((level:any)=>level.id===inv.currentLevelId);
 if(currentIndex<0)return fail(res,'INVALID_STATE','The current mission level could not be resolved.',409);
 const currentLevel=inv.projectVersion.levels[currentIndex];
 const hasSubmitted=Boolean(inv.currentQuestionId&&await prisma.investigationAnswer.findFirst({where:{investigationId:inv.id,questionId:inv.currentQuestionId},select:{id:true}}));
 const state:any=inv.state&&typeof inv.state==='object'?inv.state:{};
 const hasReveal=Boolean(inv.currentQuestionId&&state.reveals?.[inv.currentQuestionId]);
 if(!hasSubmitted&&!hasReveal)return fail(res,'TASK_NOT_AVAILABLE','Answer or reveal the current challenge before moving to the next level.',409);
 if(currentIndex>=inv.projectVersion.levels.length-1)return fail(res,'MISSION_NOT_COMPLETE','Resolve every challenge in the final level before finishing the mission.',409);
 const nextLevel=inv.projectVersion.levels[currentIndex+1];
 const nextQuestion=nextLevel.questions[0];
 if(!nextQuestion)return fail(res,'MISSION_INVALID','The next mission level has no startable task.',409);
 const progressPercent=Math.round((currentIndex+1)/inv.projectVersion.levels.length*100);
 await serializableTransaction(async tx=>{
  await tx.investigation.update({where:{id:inv.id},data:{currentLevelId:nextLevel.id,currentQuestionId:nextQuestion.id,lastActivityAt:new Date()}});
  if(identity.userId){
   await tx.userProjectProgress.upsert({
    where:{userId_projectId:{userId:identity.userId!,projectId:inv.projectId}},
    update:{status:'IN_PROGRESS',currentLevelId:nextLevel.id,currentQuestionId:nextQuestion.id,progressPercent,lastActivityAt:new Date()},
    create:{userId:identity.userId!,projectId:inv.projectId,status:'IN_PROGRESS',currentLevelId:nextLevel.id,currentQuestionId:nextQuestion.id,progressPercent,lastActivityAt:new Date()}
   });
  }
 });
 res.json({advanced:true,currentLevelId:nextLevel.id,currentQuestionId:nextQuestion.id,levelNumber:nextLevel.levelNumber,progressPercent,skippedLevelId:currentLevel.id,anonymous:identity.anonymous});
});
app.post('/v1/investigations/:id/complete',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 const inv:any=await prisma.investigation.findFirst({where:{id:String(req.params.id),...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})},include:{projectVersion:{include:{levels:{include:{questions:true}}}},project:true}});
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 if(inv.status!=='COMPLETED')return fail(res,'INCOMPLETE','Resolve every challenge before finishing the investigation.',409);
 if(identity.anonymous){const answers=await prisma.investigationAnswer.findMany({where:{investigationId:inv.id,result:'CORRECT'},select:{id:true}});return res.json({completed:true,report:null,totalRewards:{xp:answers.length*2,coins:answers.length},anonymous:true});}
 const ledger=await prisma.rewardLedger.findMany({where:{userId:identity.userId!,investigationId:inv.id,amount:{gt:0}},select:{rewardType:true,amount:true}});const totalXp=ledger.filter((x:any)=>x.rewardType===RewardType.XP).reduce((s:number,x:any)=>s+Number(x.amount),0);const totalCoins=ledger.filter((x:any)=>x.rewardType===RewardType.COINS).reduce((s:number,x:any)=>s+Number(x.amount),0);await prisma.userBadge.create({data:{userId:identity.userId!,badgeId:(await prisma.badge.findUniqueOrThrow({where:{key:'mission-complete'}})).id,metadata:{investigationId:inv.id}}}).catch((e:any)=>{if(e?.code!=='P2002')throw e});const report=await prisma.projectCompletionReport.upsert({where:{investigationId:inv.id},update:{xpEarned:totalXp,coinsEarned:totalCoins},create:{userId:identity.userId!,projectId:inv.projectId,investigationId:inv.id,overallScore:100,xpEarned:totalXp,coinsEarned:totalCoins}});res.json({completed:true,report,totalRewards:{xp:totalXp,coins:totalCoins}});
});
app.post('/v1/investigations/:id/simulation-state',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 const inv:any=await prisma.investigation.findFirst({where:{id:String(req.params.id),...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})}});
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 if(inv.status!=='IN_PROGRESS')return fail(res,'INVESTIGATION_CLOSED','This investigation is already completed.',409);
 if(!validateUuid(String(req.params.id)))return fail(res,'VALIDATION_ERROR','Invalid investigation ID.');
 const simulationId=String(req.body?.simulationId||'').trim();
 if(!simulationId||simulationId.length>120||!validateObject(req.body?.state))return fail(res,'VALIDATION_ERROR','simulationId and an object state are required.');
 const currentLevel=inv.currentLevelId?await prisma.level.findUnique({where:{id:inv.currentLevelId},include:{simulation:true}}):null;
 if(!currentLevel?.simulation||currentLevel.simulation.id!==simulationId)return fail(res,'TASK_NOT_AVAILABLE','The simulation is not attached to the current mission level.',409);
 const currentState:any=inv.state&&typeof inv.state==='object'?inv.state:{};
 const nextState={...currentState,simulations:{...(currentState.simulations||{}),[simulationId]:req.body.state}};
 await prisma.investigation.update({where:{id:inv.id},data:{state:nextState,lastActivityAt:new Date()}});
 res.json({saved:true,simulationId,state:req.body.state});
});
app.use((err:any,_req:express.Request,res:express.Response,next:express.NextFunction)=>{
 if(res.headersSent)return next(err);
 const isJsonSyntax=err instanceof SyntaxError && Object.prototype.hasOwnProperty.call(err,'body');
 if(isJsonSyntax)return fail(res,'VALIDATION_ERROR','Malformed JSON request body.',400);
 console.error(JSON.stringify({requestId:res.getHeader('X-Request-Id'),error:err instanceof Error?err.message:'unknown error'}));
 return fail(res,'INTERNAL_ERROR','An unexpected server error occurred.',500);
});
const host=process.env.HOST||'127.0.0.1';
app.listen(port,host,()=>console.log('Nextess API listening on '+host+':'+port));
