import React, { useState } from 'react';
import { ThemeMode } from '../types';
import { api } from '../api';
import { WindowPanel } from './WindowPanel';

interface Props { isOpen:boolean; onClose:()=>void; theme:ThemeMode; onSuccess:(result?:any)=>void|Promise<void>; }

export const CadetAuthModal:React.FC<Props> = ({ isOpen, onClose, theme, onSuccess }) => {
  const dark=theme==='dark';
  const [tab,setTab]=useState<'signin'|'signup'>('signin');
  const [name,setName]=useState('');
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [profileType,setProfileType]=useState<'STUDENT'|'WORKING_PROFESSIONAL'|'OTHER'>('STUDENT');
  const [educationStage,setEducationStage]=useState<'SCHOOL'|'COLLEGE'>('SCHOOL');
  const [schoolClass,setSchoolClass]=useState('');
  const [fieldOfStudy,setFieldOfStudy]=useState('');
  const [profession,setProfession]=useState('');
  const [profileStatus,setProfileStatus]=useState('');
  const [profileImageData,setProfileImageData]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState(false);

  if(!isOpen)return null;

  const closeAfterSuccess=()=>window.setTimeout(onClose,1200);

  const input=`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${dark?'bg-[#181926] border-violet-500/25 text-white':'bg-white border-slate-300 text-slate-900'}`;

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();setLoading(true);setError('');setSuccess(false);
    try{
      let authResult:any;
      if(tab==='signin'){
        authResult=await api.login(username,password);
      }else{
        authResult=await api.register({
          name:name.trim(),username,password,profileType,
          profession:profileType==='WORKING_PROFESSIONAL'?profession.trim():null,
          profileStatus:profileStatus.trim()||null,
          educationStage:profileType==='STUDENT'?educationStage:null,
          schoolClass:profileType==='STUDENT'&&educationStage==='SCHOOL'?schoolClass.trim():null,
          fieldOfStudy:profileType==='STUDENT'&&educationStage==='COLLEGE'?fieldOfStudy.trim():null,
        });
      }
      setSuccess(true);
      await onSuccess(authResult);
      closeAfterSuccess();
    }catch(err:any){setError(err?.message||'Authentication failed.');}
    finally{setLoading(false);}
  };

  return <WindowPanel open={isOpen} onClose={onClose} theme={theme} title="Cadet Access" ariaLabel="Cadet Access Station" maxWidth="max-w-md" zIndex="z-[70]">
    <div className="max-h-[78vh] overflow-y-auto">
      <div className="mb-5"><h2 className="text-xl font-bold mt-2">{tab==='signup'?'Create your learner profile':'Sign in to Nextess'}</h2><p className="text-xs text-slate-400 mt-1">{tab==='signup'?'Add your profile details now; you can edit them later.':'Continue with your saved progress.'}</p></div>
      <div role="tablist" aria-label="Authentication mode" className={`flex rounded-xl p-1 mb-4 border ${dark?'bg-[#07080c] border-violet-500/20':'bg-slate-100 border-slate-200'}`}>
        <button type="button" role="tab" aria-selected={tab==='signin'} onClick={()=>setTab('signin')} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${tab==='signin'?'bg-violet-600 text-white':'text-slate-400'}`}>Log In</button>
        <button type="button" role="tab" aria-selected={tab==='signup'} onClick={()=>setTab('signup')} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${tab==='signup'?'bg-violet-600 text-white':'text-slate-400'}`}>Sign Up</button>
      </div>
      {success&&<div role="status" aria-live="polite" className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-300 font-medium">Account synchronized with Nextess.</div>}
      <form onSubmit={submit} className="flex flex-col gap-3">
        {tab==='signup'&&<label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Name<input aria-label="Name" className={`mt-1 ${input}`} required value={name} onChange={e=>setName(e.target.value)}/></label>}
        <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Username<input aria-label="Username" className={`mt-1 ${input}`} required value={username} onChange={e=>setUsername(e.target.value)}/></label>
        <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Password<input aria-label="Password" className={`mt-1 ${input}`} type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label>

        {tab==='signup'&&<>
          <label className="font-mono text-[10px] text-violet-400 uppercase font-bold">Profession type<select className={`mt-1 ${input}`} value={profileType} onChange={e=>setProfileType(e.target.value as typeof profileType)}><option value="STUDENT">Student</option><option value="WORKING_PROFESSIONAL">Working Professional</option><option value="OTHER">Other</option></select></label>
          {profileType==='STUDENT'&&<>
            <label className="font-mono text-[10px] text-violet-400 uppercase font-bold">Education stage<select className={`mt-1 ${input}`} value={educationStage} onChange={e=>setEducationStage(e.target.value as typeof educationStage)}><option value="SCHOOL">School</option><option value="COLLEGE">College / University</option></select></label>
            {educationStage==='SCHOOL'?<label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Class<select className={`mt-1 ${input}`} value={schoolClass} onChange={e=>setSchoolClass(e.target.value)}><option value="">Select class</option><option value="9">Class 9</option><option value="10">Class 10</option><option value="11">Class 11</option><option value="12">Class 12</option></select></label>:<label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Field of study<input className={`mt-1 ${input}`} value={fieldOfStudy} onChange={e=>setFieldOfStudy(e.target.value)} placeholder="Engineering, Medical, Commerce..."/></label>}
          </>}
          <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Status<input className={`mt-1 ${input}`} value={profileStatus} onChange={e=>setProfileStatus(e.target.value)} placeholder="Student, learning, exploring..." maxLength={60}/></label>
           <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Profile image
             <input aria-label="Profile image" type="file" accept="image/png,image/jpeg,image/webp" className={`mt-1 ${input}`} onChange={e=>{
               const file=e.target.files?.[0]; if(!file)return;
               if(file.size>300*1024){setError('Profile image must be smaller than 300 KB.');e.currentTarget.value='';return;}
               const reader=new FileReader();
               reader.onload=()=>setProfileImageData(String(reader.result||''));
               reader.onerror=()=>setError('Profile image could not be read.');
               reader.readAsDataURL(file);
             }}/>
           </label>
          {profileType==='WORKING_PROFESSIONAL'&&<label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Profession<input className={`mt-1 ${input}`} required value={profession} onChange={e=>setProfession(e.target.value)} placeholder="Your profession"/></label>}
          <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs text-violet-300">New accounts receive 100 KP and 100 Coins once.</div>
        </>}
        {error&&<div role="alert" className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">{error}</div>}
        <button type="submit" disabled={loading} aria-label={tab==='signup'?'Create account':'Log in'} className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs disabled:opacity-50">{loading?'Working…':tab==='signin'?'Log In':'Create account'}</button>
      </form>
    </div>
  </WindowPanel>;
};
