import React, { useEffect, useState } from 'react';
import { ThemeMode, UserStats } from '../types';
import { api } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  stats: UserStats;
  onSave: (data: any) => void;
}

export const EditProfileModal: React.FC<Props> = ({ isOpen, onClose, theme, stats, onSave }) => {
  const dark = theme === 'dark';
  const [name, setName] = useState('');
  const [profileType, setProfileType] = useState<'STUDENT' | 'WORKING_PROFESSIONAL' | 'OTHER'>('STUDENT');
  const [educationStage, setEducationStage] = useState<'SCHOOL' | 'COLLEGE'>('SCHOOL');
  const [schoolClass, setSchoolClass] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [profession, setProfession] = useState('');
  const [profileImageData, setProfileImageData] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(stats.name || '');
    setProfileType(stats.profileType || 'STUDENT');
    setEducationStage(stats.userClass ? 'SCHOOL' : 'COLLEGE');
    setSchoolClass(stats.userClass || '');
    setFieldOfStudy(stats.college || '');
    setProfession(stats.profession || '');
    setProfileImageData(stats.profileImageData || '');
    setError('');
  }, [isOpen, stats]);

  if (!isOpen) return null;

  const handleImage = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Profile image must be PNG, JPEG, or WebP.');
      return;
    }
    if (file.size > 300 * 1024) {
      setError('Choose a profile image smaller than 300 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfileImageData(String(reader.result || ''));
    reader.onerror = () => setError('The profile image could not be read.');
    reader.readAsDataURL(file);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const data: any = {
      name: name.trim(),
      profileType,
      profileImageData: profileImageData || null,
      profession: profileType === 'WORKING_PROFESSIONAL' ? profession.trim() || null : null,
      educationStage: profileType === 'STUDENT' ? educationStage : null,
      schoolClass: profileType === 'STUDENT' && educationStage === 'SCHOOL' ? schoolClass.trim() || null : null,
      fieldOfStudy: profileType === 'STUDENT' && educationStage === 'COLLEGE' ? fieldOfStudy.trim() || null : null,
    };
    try {
      await api.updateProfile(data);
      onSave(data);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Profile could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const input = `w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${dark ? 'bg-[#181926] border-violet-500/25 text-white' : 'bg-white border-slate-300 text-slate-900'}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 border shadow-2xl relative ${dark ? 'bg-[#12131b] border-violet-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100/10" aria-label="Close edit profile">✕</button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md"><span className="material-symbols-outlined text-[24px]">badge</span></div>
          <div><h3 className="text-lg font-bold">Edit Profile</h3><p className="text-xs text-slate-400">Update your learner profile and profile picture.</p></div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <div className="flex items-center gap-4 rounded-xl border border-violet-500/20 p-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-violet-500/10 border border-violet-400/20 flex items-center justify-center shrink-0">
              {profileImageData ? <img src={profileImageData} alt="Profile preview" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-[34px] text-violet-400">account_circle</span>}
            </div>
            <div className="min-w-0">
              <label className="font-mono text-[10px] text-violet-400 uppercase font-bold">Profile picture<input type="file" accept="image/png,image/jpeg,image/webp" className="block mt-1 text-xs max-w-full" onChange={e => handleImage(e.target.files?.[0])} /></label>
              {profileImageData && <button type="button" onClick={() => setProfileImageData('')} className="mt-2 text-[10px] text-rose-400 hover:underline">Remove picture</button>}
            </div>
          </div>

          <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Name<input className={`mt-1 ${input}`} required value={name} onChange={e => setName(e.target.value)} /></label>

          <label className="font-mono text-[10px] text-violet-400 uppercase font-bold">Profession type
            <select className={`mt-1 ${input}`} value={profileType} onChange={e => setProfileType(e.target.value as typeof profileType)}>
              <option value="STUDENT">Student</option><option value="WORKING_PROFESSIONAL">Working Professional</option><option value="OTHER">Other</option>
            </select>
          </label>

          {profileType === 'STUDENT' && <>
            <label className="font-mono text-[10px] text-violet-400 uppercase font-bold">Education stage
              <select className={`mt-1 ${input}`} value={educationStage} onChange={e => setEducationStage(e.target.value as typeof educationStage)}>
                <option value="SCHOOL">School</option><option value="COLLEGE">College / University</option>
              </select>
            </label>
            {educationStage === 'SCHOOL'
              ? <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Class<select className={`mt-1 ${input}`} value={schoolClass} onChange={e => setSchoolClass(e.target.value)} required><option value="">Select class</option><option value="9">Class 9</option><option value="10">Class 10</option><option value="11">Class 11</option><option value="12">Class 12</option></select></label>
              : <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Field of study<input className={`mt-1 ${input}`} value={fieldOfStudy} onChange={e => setFieldOfStudy(e.target.value)} placeholder="Engineering, Medical, Commerce..." /></label>}
          </>}

          {profileType === 'WORKING_PROFESSIONAL' && <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">Profession<input className={`mt-1 ${input}`} required value={profession} onChange={e => setProfession(e.target.value)} placeholder="Your profession" /></label>}

          {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-300">{error}</div>}
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md disabled:opacity-50">{saving ? 'Saving…' : 'Save Profile'}</button>
        </form>
      </div>
    </div>
  );
};
