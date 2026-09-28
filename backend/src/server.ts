import 'dotenv/config';import express from 'express';import cors from 'cors';import crypto from 'node:crypto';import {PrismaClient,RewardType,StreakState} from '@prisma/client';import {evaluateChallenge} from './evaluators.js';const prisma=new PrismaClient();const app=express();const port=Number(process.env.PORT||4000);const origin=process.env.FRONTEND_ORIGIN||'http://localhost:3000';app.use(cors({origin,credentials:true}));app.use(express.json({limit:'1mb'}));app.use((req,res,next)=>{res.setHeader('X-Request-Id',crypto.randomUUID());next()});const hash=(v:string)=>crypto.createHash('sha256').update(v).digest('hex');const pass=(p:string)=>{const salt=crypto.randomBytes(16).toString('hex');return salt+'$'+hash(salt+':'+p)};const valid=(p:string,s:string)=>{const [salt,d]=s.split('$');return !!salt&&d===hash(salt+':'+p)};const cookie='nextess_session';const guestCookie='nextess_guest';const GUEST_SESSION_DAYS=14;
const parseCookie=(req:express.Request,name:string)=>req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);
async function guestSession(req:express.Request,res:express.Response,create=false){const raw=parseCookie(req,guestCookie);if(raw){const existing=await prisma.anonymousSession.findUnique({where:{sessionHash:hash(raw)}});if(existing&&existing.expiresAt>=new Date()){await prisma.anonymousSession.update({where:{id:existing.id},data:{lastActivityAt:new Date()}});return existing;}res.clearCookie(guestCookie);}if(!create)return null;const token=crypto.randomBytes(32).toString('base64url');const row=await prisma.anonymousSession.create({data:{sessionHash:hash(token),expiresAt:new Date(Date.now()+GUEST_SESSION_DAYS*864e5)}});res.cookie(guestCookie,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:GUEST_SESSION_DAYS*864e5});return row;}
async function learner(req:R,res:express.Response,createGuest=false){if(req.userId)return {userId:req.userId,anonymousSessionId:null,anonymous:false};const guest=await guestSession(req,res,createGuest);return guest?{userId:null,anonymousSessionId:guest.id,anonymous:true}:null;}const MISSION_WRONG_ANSWER_PENALTY={xp:1,coins:1};type R=express.Request&{userId?:string};const fail=(res:express.Response,code:string,message:string,status=400)=>res.status(status).json({error:{code,message,requestId:res.getHeader('X-Request-Id'),details:[]}});
const requestIdempotencyKey=(req:express.Request)=>{const raw=req.header('Idempotency-Key')?.trim();return raw&&raw.length<=180?raw:null;};
const serializableTransaction=async<T>(work:(tx:any)=>Promise<T>,retries=3):Promise<T>=>{for(let attempt=0;;attempt++){try{return await prisma.$transaction(work,{isolationLevel:'Serializable'});}catch(e:any){if(e?.code==='P2034'&&attempt<retries)continue;throw e;}}};const view=(u:any)=>u&&({id:u.id,name:u.name,username:u.username,gradeClass:u.gradeClass,profileType:u.profileType,profession:u.profession,educationStage:u.educationStage,schoolClass:u.schoolClass,fieldOfStudy:u.fieldOfStudy,level:u.level,xp:u.xp,coins:u.coins});async function auth(req:R,res:express.Response,next:express.NextFunction){const h=req.headers.authorization;const b=h?.startsWith('Bearer ')?h.slice(7):undefined;const c=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookie+'='))?.slice(cookie.length+1);const token=b||c;if(!token)return fail(res,'AUTH_REQUIRED','Authentication required.',401);const s=await prisma.authSession.findUnique({where:{tokenHash:hash(token)}});if(!s||s.expiresAt<new Date())return fail(res,'AUTH_REQUIRED','Session expired.',401);req.userId=s.userId;await prisma.authSession.update({where:{id:s.id},data:{lastActivityAt:new Date()}});next()}async function optionalAuth(req:R,res:express.Response,next:express.NextFunction){const h=req.headers.authorization;const b=h?.startsWith('Bearer ')?h.slice(7):undefined;const c=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookie+'='))?.slice(cookie.length+1);const token=b||c;if(token){const sessionRow=await prisma.authSession.findUnique({where:{tokenHash:hash(token)}});if(sessionRow&&sessionRow.expiresAt>=new Date()){req.userId=sessionRow.userId;await prisma.authSession.update({where:{id:sessionRow.id},data:{lastActivityAt:new Date()}})}}next()}async function session(u:any,res:express.Response){const token=crypto.randomBytes(32).toString('base64url');await prisma.authSession.create({data:{userId:u.id,tokenHash:hash(token),expiresAt:new Date(Date.now()+30*864e5)}});res.cookie(cookie,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:30*864e5});res.json({user:view(u)})}
async function migrateGuestSessionToUser(req:express.Request,userId:string){
  const raw=parseCookie(req,guestCookie);
  if(!raw)return;
  const guest=await prisma.anonymousSession.findUnique({where:{sessionHash:hash(raw)}});
  if(!guest||guest.expiresAt<new Date())return;
  await prisma.$transaction(async tx=>{
    const investigations=await tx.investigation.findMany({where:{anonymousSessionId:guest.id},orderBy:{lastActivityAt:'desc'}});
    const projectVersionIds=[...new Set(investigations.map(i=>i.projectVersionId))];
    const versions=projectVersionIds.length?await tx.projectVersion.findMany({where:{id:{in:projectVersionIds}},include:{levels:{orderBy:{levelNumber:'asc'}}}}):[];
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
}async function streak(id:string){const rows=await prisma.streakActivity.findMany({where:{userId:id},orderBy:{activityDate:'desc'},take:100});let n=0;const today=new Date();today.setUTCHours(0,0,0,0);for(const r of rows){const d=new Date(r.activityDate);d.setUTCHours(0,0,0,0);const diff=Math.round((today.getTime()-d.getTime())/864e5);if(diff===n)n++;else if(diff>n)break}return n}async function rewardMissionLevel(tx:any,userId:string,investigationId:string,levelId:string,xp:number,coins:number,isFinal:boolean){
  const safeXp=Math.max(0,Math.trunc(xp)),safeCoins=Math.max(0,Math.trunc(coins)),base="mission-level:"+investigationId+":"+levelId;
  let ax=false,ac=false;
  try{await tx.rewardLedger.create({data:{userId,investigationId,sourceId:levelId,rewardType:RewardType.XP,amount:safeXp,reasonCode:isFinal?'MISSION_FINAL_LEVEL':'MISSION_LEVEL',idempotencyKey:base+":xp"}});ax=true}catch(e:any){if(e?.code!=='P2002')throw e}
  try{await tx.rewardLedger.create({data:{userId,investigationId,sourceId:levelId,rewardType:RewardType.COINS,amount:safeCoins,reasonCode:isFinal?'MISSION_FINAL_LEVEL':'MISSION_LEVEL',idempotencyKey:base+":coins"}});ac=true}catch(e:any){if(e?.code!=='P2002')throw e}
  if(ax||ac){await tx.user.update({where:{id:userId},data:{...(ax?{xp:{increment:safeXp}}:{}),...(ac?{coins:{increment:safeCoins}}:{}),lastActivityAt:new Date()}});const c=await tx.leagueCycle.findFirst({where:{status:'OPEN'},orderBy:{startsAt:'desc'}});if(c&&ax)await tx.leagueParticipant.upsert({where:{cycleId_userId:{cycleId:c.id,userId}},update:{kp:{increment:safeXp}},create:{cycleId:c.id,userId,kp:safeXp}})}
  return {xp:ax?safeXp:0,coins:ac?safeCoins:0};
}app.get('/health',(_,r)=>r.json({ok:true}));app.post('/v1/auth/register',async(req,res)=>{try{const {name,password,profileType='STUDENT',profession,educationStage,schoolClass,fieldOfStudy}=req.body;const username=String(req.body.username||'').trim().toLowerCase();if(!String(name||'').trim()||!username||username.length>50||!password||password.length<8)return fail(res,'VALIDATION_ERROR','Name, username and a password of at least 8 characters are required.');if(await prisma.user.findFirst({where:{username:{equals:username,mode:'insensitive'}}}))return fail(res,'CONFLICT','Username is already in use.',409);const u=await prisma.user.create({data:{name:String(name).trim(),username,passwordHash:pass(password),profileType,profession:profession||null,educationStage:educationStage||null,schoolClass:schoolClass||null,fieldOfStudy:fieldOfStudy||null}});await prisma.$transaction(async tx=>{await tx.rewardLedger.createMany({data:[{userId:u.id,sourceId:u.id,rewardType:RewardType.XP,amount:100,reasonCode:'WELCOME_GRANT',idempotencyKey:'welcome:'+u.id+':xp'},{userId:u.id,sourceId:u.id,rewardType:RewardType.COINS,amount:100,reasonCode:'WELCOME_GRANT',idempotencyKey:'welcome:'+u.id+':coins'}]});await tx.user.update({where:{id:u.id},data:{xp:100,coins:100}})});await migrateGuestSessionToUser(req,u.id);return session({...u,xp:100,coins:100},res)}catch(e:any){if(e?.code==='P2002')return fail(res,'CONFLICT','Username is already in use.',409);return fail(res,'INTERNAL_ERROR','Unable to create account.',500)}});app.post('/v1/auth/login',async(req,res)=>{const username=String(req.body?.username||'').trim().toLowerCase();const u=await prisma.user.findFirst({where:{username:{equals:username,mode:'insensitive'}}});if(!u||!valid(req.body.password,u.passwordHash))return fail(res,'INVALID_CREDENTIALS','Username or password is incorrect.',401);await migrateGuestSessionToUser(req,u.id);return session(u,res)});app.post('/v1/auth/logout',auth,async(req:R,res)=>{const h=req.headers.authorization;if(h?.startsWith('Bearer '))await prisma.authSession.deleteMany({where:{tokenHash:hash(h.slice(7))}});res.clearCookie(cookie);res.json({ok:true})});app.get('/v1/auth/me',auth,async(req:R,res)=>res.json({user:view(await prisma.user.findUnique({where:{id:req.userId!}}))}));app.get('/v1/profile',auth,async(req:R,res)=>res.json({user:view(await prisma.user.findUnique({where:{id:req.userId!}}))}));app.patch('/v1/profile',auth,async(req:R,res)=>{const keys=['name','profileType','profession','educationStage','schoolClass','fieldOfStudy'];const data:any={};for(const k of keys)if(req.body[k]!==undefined)data[k]=req.body[k]||null;res.json({user:view(await prisma.user.update({where:{id:req.userId!},data}))})});app.get('/v1/settings',auth,async(req:R,res)=>res.json({settings:await prisma.userSetting.upsert({where:{userId:req.userId!},create:{userId:req.userId!},update:{}})}));app.patch('/v1/settings',auth,async(req:R,res)=>res.json({settings:await prisma.userSetting.upsert({where:{userId:req.userId!},create:{userId:req.userId!,theme:req.body.theme==='light'?'light':'dark'},update:{theme:req.body.theme==='light'?'light':'dark'}})));app.get('/v1/streak',auth,async(req:R,res)=>res.json({streakDays:await streak(req.userId!)}));app.get('/v1/dashboard',auth,async(req:R,res)=>{const u=await prisma.user.findUnique({where:{id:req.userId!}});const progress=await prisma.userProjectProgress.findMany({where:{userId:req.userId!},include:{project:true},orderBy:{lastActivityAt:'desc'},take:5});res.json({user:view(u),streakDays:await streak(req.userId!),badgesCount:await prisma.userBadge.count({where:{userId:req.userId!}}),activeProgress:progress.map(p=>({projectId:p.projectId,title:p.project.title,status:p.status,progressPercent:p.progressPercent}))})});app.get('/v1/badges',auth,async(req:R,res)=>res.json({badges:await prisma.userBadge.findMany({where:{userId:req.userId!},include:{badge:true},orderBy:{earnedAt:'desc'}})}));app.get('/v1/leaderboard',async(_,res)=>{const c=await prisma.leagueCycle.findFirst({where:{status:'OPEN'},orderBy:{startsAt:'desc'}});if(!c)return res.json({opened:false,entries:[]});const rows=await prisma.leagueParticipant.findMany({where:{cycleId:c.id},include:{user:true},orderBy:[{kp:'desc'},{updatedAt:'asc'}]});res.json({opened:rows.length>0,cycle:{id:c.id,name:c.name,startsAt:c.startsAt,endsAt:c.endsAt},entries:rows.map((r,i)=>({rank:i+1,userId:r.userId,name:r.user.name,username:r.user.username,kp:r.kp,streakDays:r.streakDays}))})});app.post('/v1/league/join',auth,async(req:R,res)=>{const c=await prisma.leagueCycle.findFirst({where:{status:'OPEN'},orderBy:{startsAt:'desc'}});if(!c)return fail(res,'LEAGUE_CLOSED','There is no open league cycle.',409);res.json({joined:true,entry:await prisma.leagueParticipant.upsert({where:{cycleId_userId:{cycleId:c.id,userId:req.userId!}},update:{},create:{cycleId:c.id,userId:req.userId!}})})});app.get('/v1/quotes/daily',async(_,res)=>{const quotes=await prisma.dailyQuote.findMany({orderBy:{dateKey:'asc'}});if(!quotes.length)return res.json({quote:null});const dayKey=new Date().toISOString().slice(0,10);const index=Math.floor(Date.now()/864e5)%quotes.length;const selected=quotes[index];res.json({quote:{id:selected.id,quote:selected.quote,author:selected.source,date:dayKey,category:selected.category}})});app.get('/v1/directives',auth,async(req:R,res)=>{const ds=await prisma.dailyDirective.findMany({where:{active:true},orderBy:{ordering:'asc'}});const day=new Date(new Date().toISOString().slice(0,10));const cs=await prisma.directiveClaim.findMany({where:{userId:req.userId!,claimDate:day}});res.json({directives:ds.map(d=>({...d,claimed:cs.some(c=>c.directiveId===d.id)}))})});app.post('/v1/directives/:id/claim',auth,async(req:R,res)=>{const d=await prisma.dailyDirective.findUnique({where:{id:req.params.id}});if(!d)return fail(res,'NOT_FOUND','Directive not found.',404);const day=new Date(new Date().toISOString().slice(0,10));try{await prisma.$transaction(async tx=>{await tx.directiveClaim.create({data:{directiveId:d.id,userId:req.userId!,claimDate:day}});await tx.user.update({where:{id:req.userId!},data:{xp:{increment:d.rewardXp},coins:{increment:d.rewardCoins},lastActivityAt:new Date()}});if(d.rewardXp)await tx.rewardLedger.create({data:{userId:req.userId!,sourceId:d.id,rewardType:RewardType.XP,amount:d.rewardXp,reasonCode:'DIRECTIVE',idempotencyKey:'directive:'+d.id+':'+req.userId+':xp:'+day.toISOString()}});if(d.rewardCoins)await tx.rewardLedger.create({data:{userId:req.userId!,sourceId:d.id,rewardType:RewardType.COINS,amount:d.rewardCoins,reasonCode:'DIRECTIVE',idempotencyKey:'directive:'+d.id+':'+req.userId+':coins:'+day.toISOString()}});await tx.streakActivity.upsert({where:{userId_activityDate:{userId:req.userId!,activityDate:day}},update:{},create:{userId:req.userId!,activityDate:day,state:StreakState.QUALIFIED,sourceId:d.id}});const c=await tx.leagueCycle.findFirst({where:{status:'OPEN'},orderBy:{startsAt:'desc'}});if(c)await tx.leagueParticipant.upsert({where:{cycleId_userId:{cycleId:c.id,userId:req.userId!}},update:{kp:{increment:d.rewardXp}},create:{cycleId:c.id,userId:req.userId!,kp:d.rewardXp}})});res.json({claimed:true,rewardXp:d.rewardXp,rewardCoins:d.rewardCoins})}catch{return fail(res,'ALREADY_CLAIMED','Directive already claimed today.',409)}});app.post('/v1/feedback',auth,async(req:R,res)=>{if(!req.body.message)return fail(res,'VALIDATION_ERROR','Message is required.');res.status(201).json({feedback:await prisma.feedback.create({data:{userId:req.userId!,category:req.body.category||'GENERAL',message:req.body.message}})})});app.get('/v1/subjects',async(_,res)=>res.json({subjects:await prisma.subject.findMany({orderBy:{ordering:'asc'}})}));app.get('/v1/subjects/:subjectId/projects',async(req,res)=>{const projects=await prisma.project.findMany({where:{subjectId:req.params.subjectId,status:'PUBLISHED',currentPublishedVersion:{status:'PUBLISHED'}},orderBy:{createdAt:'asc'},include:{subject:true,currentPublishedVersion:{select:{id:true,version:true,contentMetadata:true,levels:{orderBy:{levelNumber:'asc'},select:{id:true,levelNumber:true,title:true,rewardXp:true,rewardCoins:true,questions:{select:{id:true}}}}}}}});res.json({projects:projects.map(p=>({...p,levelsCount:p.currentPublishedVersion?.levels.length??0}))})});app.get('/v1/projects/:projectId',optionalAuth,async(req:R,res)=>{
 const p=await prisma.project.findUnique({where:{id:req.params.projectId,status:'PUBLISHED'},include:{subject:true,currentPublishedVersion:{include:{levels:{orderBy:{levelNumber:'asc'},select:{id:true,levelNumber:true,title:true,learningObjectives:true,completionRules:true,debrief:true,questions:{orderBy:{ordering:'asc'},select:{id:true,questionNumber:true,questionType:true,prompt:true,inputSchema:true,options:{orderBy:{optionKey:'asc'}},hints:{orderBy:{level:'asc'}}}},simulation:{include:{assets:true,variables:{orderBy:{variableKey:'asc'}},consequences:{orderBy:{ordering:'asc'}}}}}},caseFiles:{orderBy:{ordering:'asc'}}}}});
 if(!p||p.currentPublishedVersion?.status!=='PUBLISHED')return fail(res,'NOT_FOUND','Published project not found.',404);
 const progress=req.userId?await prisma.userProjectProgress.findUnique({where:{userId_projectId:{userId:req.userId,projectId:p.id}}}):null;
 const levelProgress=req.userId?await prisma.userLevelProgress.findMany({where:{userId:req.userId,level:{projectVersionId:p.currentPublishedVersion?.id}},orderBy:{levelId:'asc'}}):[];
 res.json({project:p,progress,levelProgress});
});
app.post('/v1/projects/:projectId/start',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,true);
 if(!identity)return fail(res,'SESSION_ERROR','Unable to establish a learner session.',500);
 const p=await prisma.project.findUnique({where:{id:req.params.projectId,status:'PUBLISHED'},include:{currentPublishedVersion:true}});
 if(!p?.currentPublishedVersion||p.currentPublishedVersion.status!=='PUBLISHED')return fail(res,'NOT_FOUND','Published project not found.',404);
 if(identity.anonymous&&!p.anonymousAccess)return fail(res,'AUTH_REQUIRED','Sign in to start this mission.',401);
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
    if(!u||u.xp<20||u.coins<15)throw new Error('INSUFFICIENT_FUNDS');
    const stamp=crypto.randomUUID();
    await tx.user.update({where:{id:identity.userId!},data:{xp:{decrement:20},coins:{decrement:15},lastActivityAt:new Date()}});
    await tx.rewardLedger.create({data:{userId:identity.userId!,sourceId:p.id,rewardType:RewardType.XP,amount:-20,reasonCode:'MISSION_REVIEW',idempotencyKey:'mission-review:'+p.id+':'+stamp+':xp'}});
    await tx.rewardLedger.create({data:{userId:identity.userId!,sourceId:p.id,rewardType:RewardType.COINS,amount:-15,reasonCode:'MISSION_REVIEW',idempotencyKey:'mission-review:'+p.id+':'+stamp+':coins'}});
   }
   const created=await tx.investigation.create({data:{projectId:p.id,projectVersionId:p.currentPublishedVersion!.id,userId:identity.userId??undefined,anonymousSessionId:identity.anonymousSessionId??undefined,currentLevelId:firstLevel.id,currentQuestionId:firstLevel.questions[0].id,status:'IN_PROGRESS'}});
   if(identity.userId)await tx.userProjectProgress.upsert({where:{userId_projectId:{userId:identity.userId,projectId:p.id}},update:{status:'IN_PROGRESS',currentLevelId:firstLevel.id,currentQuestionId:firstLevel.questions[0].id,progressPercent:0,completedAt:null,lastActivityAt:new Date()},create:{userId:identity.userId,projectId:p.id,status:'IN_PROGRESS',currentLevelId:firstLevel.id,currentQuestionId:firstLevel.questions[0].id,progressPercent:0,lastActivityAt:new Date()}});
   return created;
  });
  res.status(201).json({investigationId:inv.id,replayed,anonymous:identity.anonymous});
 }catch(e:any){
  if(e?.message==='INSUFFICIENT_FUNDS')return fail(res,'INSUFFICIENT_FUNDS','Reviewing a completed mission costs 20 KP and 15 coins.',409);
  return fail(res,'INTERNAL_ERROR','Unable to start mission.',500);
 }
});
app.get('/v1/investigations/:id',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);
 if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 const inv=await prisma.investigation.findFirst({where:{id:req.params.id,...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})},include:{project:true,projectVersion:{include:{levels:{orderBy:{levelNumber:'asc'},include:{questions:{orderBy:{ordering:'asc'},select:{id:true,questionNumber:true,questionType:true,prompt:true,inputSchema:true,options:{orderBy:{optionKey:'asc'}},hints:{orderBy:{level:'asc'}}}},simulation:{include:{assets:true,variables:{orderBy:{variableKey:'asc'},},consequences:{orderBy:{ordering:'asc'}}}}}},caseFiles:{orderBy:{ordering:'asc'}}}},answers:{orderBy:{submittedAt:'asc'},select:{id:true,questionId:true,attemptNumber:true,result:true,feedbackData:true,submittedAt:true}}}});
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 const user=identity.userId?await prisma.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}}):{xp:0,coins:0};
 res.json({investigation:inv,balances:user,anonymous:identity.anonymous});
});
app.post('/v1/investigations/:id/answers',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);
 if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 const inv=await prisma.investigation.findFirst({where:{id:req.params.id,...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})},include:{projectVersion:{include:{levels:{orderBy:{levelNumber:'asc'},include:{questions:{orderBy:{ordering:'asc'}}}}}}}});
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 if(inv.status!=='IN_PROGRESS')return fail(res,'INVESTIGATION_CLOSED','This investigation is already completed.',409);
 if(!req.body||req.body.answer===undefined)return fail(res,'VALIDATION_ERROR','An answer is required.');
 const q=await prisma.question.findFirst({where:{id:req.body.questionId,level:{projectVersionId:inv.projectVersionId}}});
 if(!q)return fail(res,'NOT_FOUND','Question not found for this investigation.',404);
 if(inv.currentQuestionId&&inv.currentQuestionId!==q.id)return fail(res,'TASK_NOT_AVAILABLE','Complete the current task before advancing.',409);
 const incoming=req.body.answer?.value??req.body.answer?.text??req.body.answer;
 if(incoming===undefined||incoming===null||String(incoming).trim()==='')return fail(res,'VALIDATION_ERROR','An answer is required.');
 const clientKey=requestIdempotencyKey(req);
 if(!clientKey)return fail(res,'IDEMPOTENCY_KEY_REQUIRED','An Idempotency-Key header is required for answer submission.',400);
 const scopedKey=hash((identity.userId||('anonymous:'+identity.anonymousSessionId))+':answer:'+clientKey);
 const existingAnswer=await prisma.investigationAnswer.findUnique({where:{idempotencyKey:scopedKey}});
 if(existingAnswer){
   const balances=identity.userId?await prisma.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}}):{xp:0,coins:0};
   return res.json({result:existingAnswer.result,answerId:existingAnswer.id,feedbackData:existingAnswer.feedbackData,replayed:true,levelCompleted:false,missionCompleted:false,reward:{xp:0,coins:0},penalty:{xp:0,coins:0},levelPenalty:{xp:0,coins:0},netChange:{xp:0,coins:0},balances:balances??{xp:0,coins:0},anonymous:identity.anonymous});
 }
 const evaluation=evaluateChallenge({type:q.questionType,value:incoming,definition:(q.evaluationDefinition||{}) as any});
 const attempts=await prisma.investigationAnswer.count({where:{investigationId:inv.id,questionId:q.id}})+1;
 let answer;
 try{
   answer=await prisma.investigationAnswer.create({data:{investigationId:inv.id,questionId:q.id,userId:identity.userId??undefined,attemptNumber:attempts,idempotencyKey:scopedKey,answerPayload:req.body.answer??{},normalizedAnswer:{value:evaluation.normalizedAnswer},result:evaluation.correct?'CORRECT':'INCORRECT',evaluatorVersion:evaluation.evaluatorVersion,feedbackData:evaluation.feedback}});
 }catch(e:any){
   if(e?.code==='P2002'){
     const replay=await prisma.investigationAnswer.findUnique({where:{idempotencyKey:scopedKey}});
     if(replay){const balances=identity.userId?await prisma.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}}):{xp:0,coins:0};return res.json({result:replay.result,answerId:replay.id,feedbackData:replay.feedbackData,replayed:true,levelCompleted:false,missionCompleted:false,reward:{xp:0,coins:0},penalty:{xp:0,coins:0},levelPenalty:{xp:0,coins:0},netChange:{xp:0,coins:0},balances:balances??{xp:0,coins:0},anonymous:identity.anonymous});}
   }
   throw e;
 }
 let levelCompleted=false,missionCompleted=false,reward={xp:0,coins:0},penalty={xp:0,coins:0},levelPenalty={xp:0,coins:0};
 if(!evaluation.correct&&identity.userId){
  try{await prisma.$transaction(async tx=>{
   const u=await tx.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}});
   if(!u)return;
   const xpPenalty=Math.min(MISSION_WRONG_ANSWER_PENALTY.xp,Math.max(0,u.xp));
   const coinPenalty=Math.min(MISSION_WRONG_ANSWER_PENALTY.coins,Math.max(0,u.coins));
   if(xpPenalty===0&&coinPenalty===0)return;
   await tx.user.update({where:{id:identity.userId!},data:{...(xpPenalty?{xp:{decrement:xpPenalty}}:{}),...(coinPenalty?{coins:{decrement:coinPenalty}}:{}),lastActivityAt:new Date()}});
   if(xpPenalty)await tx.rewardLedger.create({data:{userId:identity.userId!,investigationId:inv.id,sourceId:q.id,rewardType:RewardType.XP,amount:-xpPenalty,reasonCode:'MISSION_WRONG_ANSWER',idempotencyKey:'wrong:'+answer.id+':xp'}});
   if(coinPenalty)await tx.rewardLedger.create({data:{userId:identity.userId!,investigationId:inv.id,sourceId:q.id,rewardType:RewardType.COINS,amount:-coinPenalty,reasonCode:'MISSION_WRONG_ANSWER',idempotencyKey:'wrong:'+answer.id+':coins'}});
   penalty={xp:xpPenalty,coins:coinPenalty};
  });}catch(e){/* The answer remains recorded even if a non-critical penalty write fails. */}
 }
 if(evaluation.correct){
  const level=inv.projectVersion.levels.find((l:any)=>l.questions.some((x:any)=>x.id===q.id));
  if(level){
   const ids=level.questions.map((x:any)=>x.id);
   const rows=await prisma.investigationAnswer.findMany({where:{investigationId:inv.id,questionId:{in:ids}},orderBy:{submittedAt:'desc'}});
   const latest=new Map<string,any>();for(const row of rows)if(!latest.has(row.questionId))latest.set(row.questionId,row);
   levelCompleted=ids.length>0&&ids.every((id:string)=>latest.get(id)?.result==='CORRECT');
   const nextQuestion=level.questions.find((x:any)=>!latest.has(x.id)||latest.get(x.id)?.result!=='CORRECT');
   if(levelCompleted){
    const finalLevel=level.levelNumber===inv.projectVersion.levels.length;
    if(identity.userId){
     reward=await prisma.$transaction(async tx=>{
      const r=await rewardMissionLevel(tx,identity.userId!,inv.id,level.id,Number(level.rewardXp)||0,Number(level.rewardCoins)||0,finalLevel);
      await tx.userLevelProgress.upsert({where:{userId_levelId:{userId:identity.userId!,levelId:level.id}},update:{status:'COMPLETED',completedQuestions:ids.length,totalQuestions:ids.length,completedAt:new Date(),currentQuestionId:null},create:{userId:identity.userId!,levelId:level.id,status:'COMPLETED',completedQuestions:ids.length,totalQuestions:ids.length,completedAt:new Date(),currentQuestionId:null}});
      if(finalLevel){
       missionCompleted=true;
       await tx.userProjectProgress.upsert({where:{userId_projectId:{userId:identity.userId!,projectId:inv.projectId}},update:{status:'COMPLETED',progressPercent:100,completedAt:new Date(),currentLevelId:null,currentQuestionId:null,lastActivityAt:new Date()},create:{userId:identity.userId!,projectId:inv.projectId,status:'COMPLETED',progressPercent:100,completedAt:new Date(),lastActivityAt:new Date()}});
       await tx.investigation.update({where:{id:inv.id},data:{status:'COMPLETED',completedAt:new Date(),lastActivityAt:new Date(),currentLevelId:level.id,currentQuestionId:q.id}});
      }else{
       const next=inv.projectVersion.levels.find((l:any)=>l.levelNumber===level.levelNumber+1);
       await tx.userProjectProgress.upsert({where:{userId_projectId:{userId:identity.userId!,projectId:inv.projectId}},update:{status:'IN_PROGRESS',progressPercent:Math.round(level.levelNumber/inv.projectVersion.levels.length*100),currentLevelId:next?.id??null,currentQuestionId:next?.questions[0]?.id??null,lastActivityAt:new Date()},create:{userId:identity.userId!,projectId:inv.projectId,status:'IN_PROGRESS',progressPercent:Math.round(level.levelNumber/inv.projectVersion.levels.length*100),currentLevelId:next?.id??null,currentQuestionId:next?.questions[0]?.id??null,lastActivityAt:new Date()}});
       await tx.investigation.update({where:{id:inv.id},data:{currentLevelId:next?.id??null,currentQuestionId:next?.questions[0]?.id??null,lastActivityAt:new Date()}});
      }
      return r;
     });
    }else{
     const next=inv.projectVersion.levels.find((l:any)=>l.levelNumber===level.levelNumber+1);
     missionCompleted=finalLevel;
     await prisma.investigation.update({where:{id:inv.id},data:finalLevel?{status:'COMPLETED',completedAt:new Date(),currentLevelId:level.id,currentQuestionId:q.id,lastActivityAt:new Date()}:{currentLevelId:next?.id??null,currentQuestionId:next?.questions[0]?.id??null,lastActivityAt:new Date()}});
    }
    if(identity.userId){
     const levelPenaltyRows=await prisma.rewardLedger.findMany({where:{userId:identity.userId!,investigationId:inv.id,sourceId:{in:ids},reasonCode:'MISSION_WRONG_ANSWER'},select:{rewardType:true,amount:true}});
     levelPenalty={xp:Math.abs(levelPenaltyRows.filter((x:any)=>x.rewardType===RewardType.XP).reduce((sum:number,x:any)=>sum+Number(x.amount),0)),coins:Math.abs(levelPenaltyRows.filter((x:any)=>x.rewardType===RewardType.COINS).reduce((sum:number,x:any)=>sum+Number(x.amount),0))};
    }
   }else if(nextQuestion){
    const nextIndex=level.questions.findIndex((x:any)=>x.id===nextQuestion.id);
    await prisma.investigation.update({where:{id:inv.id},data:{currentLevelId:level.id,currentQuestionId:nextQuestion.id,lastActivityAt:new Date()}});
    if(identity.userId)await prisma.userLevelProgress.upsert({where:{userId_levelId:{userId:identity.userId!,levelId:level.id}},update:{status:'IN_PROGRESS',currentQuestionId:nextQuestion.id,completedQuestions:Math.max(0,nextIndex),totalQuestions:ids.length},create:{userId:identity.userId!,levelId:level.id,status:'IN_PROGRESS',currentQuestionId:nextQuestion.id,completedQuestions:Math.max(0,nextIndex),totalQuestions:ids.length}});
   }
  }
 }
 const user=identity.userId?await prisma.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}}):null;
 res.json({result:evaluation.correct?'CORRECT':'INCORRECT',answerId:answer.id,feedbackData:evaluation.feedback,levelCompleted,missionCompleted,reward,penalty,levelPenalty,netChange:{xp:reward.xp-levelPenalty.xp,coins:reward.coins-levelPenalty.coins},balances:user??{xp:0,coins:0},anonymous:identity.anonymous});
});
app.post('/v1/investigations/:id/hints',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 const inv=await prisma.investigation.findFirst({where:{id:req.params.id,...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})}});
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 const q=await prisma.question.findFirst({where:{id:req.body.questionId,level:{projectVersionId:inv.projectVersionId}},include:{hints:{orderBy:{level:'asc'}}}});
 if(!q)return fail(res,'NOT_FOUND','Question not found for this investigation.',404);
 const state:any=inv.state&&typeof inv.state==='object'?inv.state:{};
 const used=identity.userId?await prisma.rewardLedger.count({where:{userId:identity.userId!,investigationId:inv.id,sourceId:q.id,rewardType:RewardType.COINS,reasonCode:'MISSION_HINT'}}):Number(state.hints?.[q.id]||0);
 const next=q.hints.find((h:any)=>h.level===used+1);if(!next)return fail(res,'NO_MORE_HINTS','All hints for this question have already been revealed.',409);
 const costCoins=identity.userId?5:0;
 try{
  if(identity.userId){
   await prisma.$transaction(async tx=>{
    const updated=await tx.user.updateMany({where:{id:identity.userId!,coins:{gte:costCoins}},data:{coins:{decrement:costCoins},lastActivityAt:new Date()}});
    if(updated.count!==1)throw new Error('INSUFFICIENT_FUNDS');
    await tx.rewardLedger.create({data:{userId:identity.userId!,investigationId:inv.id,sourceId:q.id,rewardType:RewardType.COINS,amount:-costCoins,reasonCode:'MISSION_HINT',idempotencyKey:'hint:'+inv.id+':'+q.id+':'+next.level}});
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
app.post('/v1/investigations/:id/reveal-answer',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 const inv=await prisma.investigation.findFirst({where:{id:req.params.id,...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})}});
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 const q=await prisma.question.findFirst({where:{id:req.body.questionId,level:{projectVersionId:inv.projectVersionId}}});
 if(!q)return fail(res,'NOT_FOUND','Question not found for this investigation.',404);
 const def:any=q.evaluationDefinition||{},base='reveal:'+inv.id+':'+q.id,state:any=inv.state&&typeof inv.state==='object'?inv.state:{};
 if(!identity.userId){
  if(state.reveals?.[q.id])return res.json({answer:def.answer,explanation:q.explanation,cost:{xp:0,coins:0},alreadyCharged:true,balances:{xp:0,coins:0},anonymous:true});
  await prisma.investigation.update({where:{id:inv.id},data:{state:{...state,reveals:{...(state.reveals||{}),[q.id]:true}}}});
  return res.json({answer:def.answer,explanation:q.explanation,cost:{xp:0,coins:0},alreadyCharged:false,balances:{xp:0,coins:0},anonymous:true});
 }
 const already=await prisma.rewardLedger.findFirst({where:{idempotencyKey:base+':xp'}});
 if(already)return res.json({answer:def.answer,explanation:q.explanation,cost:{xp:0,coins:0},alreadyCharged:true,balances:await prisma.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}})});
 try{
  await prisma.$transaction(async tx=>{
   const updated=await tx.user.updateMany({where:{id:identity.userId!,xp:{gte:5},coins:{gte:2}},data:{xp:{decrement:5},coins:{decrement:2},lastActivityAt:new Date()}});
   if(updated.count!==1)throw new Error('INSUFFICIENT_FUNDS');
   await tx.rewardLedger.create({data:{userId:identity.userId!,investigationId:inv.id,sourceId:q.id,rewardType:RewardType.XP,amount:-5,reasonCode:'MISSION_REVEAL',idempotencyKey:base+':xp'}});
   await tx.rewardLedger.create({data:{userId:identity.userId!,investigationId:inv.id,sourceId:q.id,rewardType:RewardType.COINS,amount:-2,reasonCode:'MISSION_REVEAL',idempotencyKey:base+':coins'}});
  });
  res.json({answer:def.answer,explanation:q.explanation,cost:{xp:5,coins:2},balances:await prisma.user.findUnique({where:{id:identity.userId!},select:{xp:true,coins:true}})});
 }catch(e:any){
  if(e?.message==='INSUFFICIENT_FUNDS')return fail(res,'INSUFFICIENT_FUNDS','Revealing an answer costs 5 KP and 2 coins.',409);
  if(e?.code==='P2002')return fail(res,'REVEAL_ALREADY_USED','The answer has already been revealed for this question.',409);
  return fail(res,'INTERNAL_ERROR','Unable to reveal answer.',500);
 }
});
app.post('/v1/investigations/:id/complete',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 const inv=await prisma.investigation.findFirst({where:{id:req.params.id,...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})},include:{projectVersion:{include:{levels:{include:{questions:true}}}},project:true}});
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 if(inv.status!=='COMPLETED')return fail(res,'INCOMPLETE','Complete every level correctly before finishing the investigation.',409);
 if(identity.anonymous)return res.json({completed:true,report:null,anonymous:true});
 const totalXp=inv.projectVersion.levels.reduce((sum:number,l:any)=>sum+Math.max(0,Number(l.rewardXp)||0),0);
 const totalCoins=inv.projectVersion.levels.reduce((sum:number,l:any)=>sum+Math.max(0,Number(l.rewardCoins)||0),0);
 const report=await prisma.projectCompletionReport.upsert({where:{investigationId:inv.id},update:{},create:{userId:identity.userId!,projectId:inv.projectId,investigationId:inv.id,overallScore:100,xpEarned:totalXp,coinsEarned:totalCoins}});
 res.json({completed:true,report});
});
app.post('/v1/investigations/:id/simulation-state',optionalAuth,async(req:R,res)=>{
 const identity=await learner(req,res,false);if(!identity)return fail(res,'AUTH_REQUIRED','Authentication or a guest mission session is required.',401);
 const inv=await prisma.investigation.findFirst({where:{id:req.params.id,...(identity.userId?{userId:identity.userId}:{anonymousSessionId:identity.anonymousSessionId})}});
 if(!inv)return fail(res,'NOT_FOUND','Investigation not found.',404);
 const simulationId=String(req.body?.simulationId||'');
 if(!simulationId||!req.body?.state||typeof req.body.state!=='object'||Array.isArray(req.body.state))return fail(res,'VALIDATION_ERROR','simulationId and an object state are required.');
 const currentState:any=inv.state&&typeof inv.state==='object'?inv.state:{};
 const nextState={...currentState,simulations:{...(currentState.simulations||{}),[simulationId]:req.body.state}};
 await prisma.investigation.update({where:{id:inv.id},data:{state:nextState,lastActivityAt:new Date()}});
 res.json({saved:true,simulationId,state:req.body.state});
});
app.listen(port,()=>console.log('Nextess API listening on '+port));