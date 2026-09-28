const base=process.env.NEXTESS_API_BASE||'http://localhost:4000';
const unique=Date.now().toString(36);
const cookieOf=(response)=>response.headers.get('set-cookie')?.split(';')[0]||'';
const request=async(path,init={})=>{
  const response=await fetch(base+path,init);
  const body=await response.json().catch(()=>({}));
  return {response,body};
};
const expect=(condition,message)=>{if(!condition)throw new Error(message);};

const subjects=await request('/v1/subjects');
expect(subjects.response.ok,'subjects endpoint failed');
expect(subjects.body.subjects?.some(s=>s.status==='ACTIVE'),'no active subject returned');
expect(subjects.body.subjects?.some(s=>s.status==='FUTURE'),'future subject catalogue is missing');

const physics=subjects.body.subjects.find(s=>s.key.toLowerCase()==='physics');
expect(physics,'Physics subject is missing');
const catalogue=await request('/v1/subjects/'+physics.id+'/projects');
expect(catalogue.response.ok,'subject mission catalogue failed');
expect(catalogue.body.projects?.length>0,'Physics has no seeded published missions');

const project=catalogue.body.projects[0];
const detail=await request('/v1/projects/'+project.id);
expect(detail.response.ok,'project detail failed');
expect(detail.body.project.currentPublishedVersion?.id===project.currentPublishedVersion?.id,'catalogue/detail published version mismatch');

const register=async(name)=>{
  const result=await request('/v1/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,username:name,password:'NextessSmoke123',profileType:'STUDENT'})});
  expect(result.response.ok,'smoke user registration failed');
  const cookie=cookieOf(result.response);
  expect(cookie,'registration did not establish a session cookie');
  return cookie;
};

const cookieA=await register('smoke-a-'+unique);
const start=await request('/v1/projects/'+project.id+'/start',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookieA}});
expect(start.response.ok,'mission start failed');
expect(start.body.investigationId,'mission start did not return an investigation');

const investigation=await request('/v1/investigations/'+start.body.investigationId,{headers:{Cookie:cookieA}});
expect(investigation.response.ok,'investigation retrieval failed');
const firstQuestion=investigation.body.investigation?.projectVersion?.levels?.[0]?.questions?.[0];
expect(firstQuestion,'published mission has no first question');
const answer=firstQuestion.questionType==='numerical'?0:(firstQuestion.options?.[0]?.optionText??'');
expect(String(answer).length>0,'first question has no testable input');

const idempotency='smoke-'+unique;
const submitInit={method:'POST',headers:{'Content-Type':'application/json','Cookie':cookieA,'Idempotency-Key':idempotency},body:JSON.stringify({questionId:firstQuestion.id,answer:{value:answer}})};
const firstSubmit=await request('/v1/investigations/'+start.body.investigationId+'/answers',submitInit);
expect(firstSubmit.response.ok,'first answer submission failed');
expect(['CORRECT','INCORRECT'].includes(firstSubmit.body.result),'answer evaluation result is invalid');
const replaySubmit=await request('/v1/investigations/'+start.body.investigationId+'/answers',submitInit);
expect(replaySubmit.response.ok,'replayed answer submission failed');
expect(replaySubmit.body.replayed===true,'replayed submission was not identified as a replay');
expect(replaySubmit.body.answerId===firstSubmit.body.answerId,'replayed submission returned a different answer record');

const cookieB=await register('smoke-b-'+unique);
const crossUser=await request('/v1/investigations/'+start.body.investigationId,{headers:{Cookie:cookieB}});
expect(crossUser.response.status===404,'cross-user investigation access was not rejected');

const invalidQuestion=await request('/v1/investigations/'+start.body.investigationId+'/answers',{method:'POST',headers:{'Content-Type':'application/json','Cookie':cookieA,'Idempotency-Key':'invalid-'+unique},body:JSON.stringify({questionId:'00000000-0000-0000-0000-000000000000',answer:{value:'x'}})});
expect(invalidQuestion.response.status===404,'invalid question ID was not rejected');

const quote=await request('/v1/quotes/daily');
expect(quote.response.ok&&quote.body.quote?.author&&quote.body.quote?.date,'daily quote contract failed');

console.log(JSON.stringify({ok:true,mission:project.slug,investigationId:start.body.investigationId,firstSubmission:firstSubmit.body.result,replay:true,crossUserRejected:true,invalidQuestionRejected:true}));
