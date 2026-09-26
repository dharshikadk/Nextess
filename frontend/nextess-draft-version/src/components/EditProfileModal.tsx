import React, { useState } from 'react';
import { ThemeMode, UserStats } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  stats: UserStats;
  onSave: (name: string, handle: string, userClass: string, college: string, profession: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  theme,
  stats,
  onSave,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const [name, setName] = useState(stats.name || 'Alex Vektor');
  const [handle, setHandle] = useState(stats.handle || '@alex_vektor');

  // Detect initial category
  const initialIsStudent =
    (stats.profession && stats.profession.toLowerCase().includes('student')) ||
    (stats.userClass && stats.userClass.toLowerCase().includes('grade')) ||
    (stats.college && stats.college.toLowerCase().includes('school'));

  const [professionCategory, setProfessionCategory] = useState<'student' | 'working profession'>(
    initialIsStudent ? 'student' : 'working profession'
  );

  // Student specific: Institution type (school or college)
  const initialIsSchool =
    stats.userClass && (stats.userClass.includes('9') || stats.userClass.includes('10') || stats.userClass.includes('11') || stats.userClass.includes('12') || stats.userClass.toLowerCase().includes('grade'));

  const [studentInstitutionType, setStudentInstitutionType] = useState<'school' | 'college'>(
    initialIsSchool ? 'school' : 'college'
  );

  // School options (9-12)
  const [schoolGrade, setSchoolGrade] = useState<string>(() => {
    if (stats.userClass?.includes('9')) return 'Grade 9';
    if (stats.userClass?.includes('10')) return 'Grade 10';
    if (stats.userClass?.includes('12')) return 'Grade 12';
    return 'Grade 11';
  });
  const [schoolName, setSchoolName] = useState<string>(
    stats.college && stats.college.toLowerCase().includes('school')
      ? stats.college
      : 'Science & Technology High School'
  );

  // College options
  const [collegeInstitution, setCollegeInstitution] = useState<string>(
    stats.college && !stats.college.toLowerCase().includes('school')
      ? stats.college
      : 'Stanford University'
  );
  const [collegeYear, setCollegeYear] = useState<string>(
    stats.userClass && !stats.userClass.toLowerCase().includes('grade')
      ? stats.userClass
      : '3rd Year Undergraduate'
  );

  // Working profession options
  const [workingRole, setWorkingRole] = useState<string>(
    stats.profession && !stats.profession.toLowerCase().includes('student')
      ? stats.profession
      : 'Theoretical Physics Researcher'
  );
  const [workingInstitution, setWorkingInstitution] = useState<string>(
    stats.college && !stats.college.toLowerCase().includes('school')
      ? stats.college
      : 'National Aerospace & Space Lab'
  );
  const [workingSeniority, setWorkingSeniority] = useState<string>('Senior Staff Scientist');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let computedClass = '';
    let computedCollege = '';
    let computedProfession = '';

    if (professionCategory === 'student') {
      if (studentInstitutionType === 'school') {
        computedClass = schoolGrade;
        computedCollege = schoolName;
        computedProfession = 'High School Student';
      } else {
        computedClass = collegeYear;
        computedCollege = collegeInstitution;
        computedProfession = 'University Student';
      }
    } else {
      computedClass = workingSeniority;
      computedCollege = workingInstitution;
      computedProfession = workingRole;
    }

    onSave(name, handle, computedClass, computedCollege, computedProfession);
    onClose();
  };

  const selectClasses = `w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer appearance-none transition-all ${
    isDark
      ? 'bg-[#181926] border-violet-500/25 text-white hover:border-violet-400/50'
      : 'bg-white border-slate-300 text-slate-900 hover:border-violet-400'
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl transition-all relative max-h-[90vh] overflow-y-auto ${
          isDark
            ? 'bg-[#12131b] border-violet-500/30 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[24px]">badge</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-lg font-bold">Edit Profile</h3>
            <p className="text-xs text-slate-400">Configure academic track &amp; professional credentials</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Cadet Name */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                isDark ? 'bg-[#181926] border-violet-500/20 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Call Sign / Handle */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
              Call Sign / Handle
            </label>
            <input
              type="text"
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className={`p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                isDark ? 'bg-[#181926] border-violet-500/20 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* 1. Profession Category Dropdown Menu */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] text-violet-400 uppercase font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">work</span>
              Profession
            </label>
            <div className="relative">
              <select
                value={professionCategory}
                onChange={(e) => setProfessionCategory(e.target.value as 'student' | 'working profession')}
                className={selectClasses}
              >
                <option value="student">Student</option>
                <option value="working profession">Working Professional</option>
              </select>
              <span className="material-symbols-outlined text-slate-400 text-[18px] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                expand_more
              </span>
            </div>
          </div>

          {/* 2. IF STUDENT: Ask for Institution (school or college) */}
          {professionCategory === 'student' && (
            <>
              <div className="flex flex-col gap-1 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
                <label className="font-mono text-[10px] text-violet-400 uppercase font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">apartment</span>
                  Institution Type
                </label>
                <div className="relative">
                  <select
                    value={studentInstitutionType}
                    onChange={(e) => setStudentInstitutionType(e.target.value as 'school' | 'college')}
                    className={selectClasses}
                  >
                    <option value="school">School</option>
                    <option value="college">College / University</option>
                  </select>
                  <span className="material-symbols-outlined text-slate-400 text-[18px] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    expand_more
                  </span>
                </div>
              </div>

              {/* IF SCHOOL: Ask for Class / Grade (9-12) */}
              {studentInstitutionType === 'school' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">school</span>
                      Class / Grade (9 - 12)
                    </label>
                    <div className="relative">
                      <select
                        value={schoolGrade}
                        onChange={(e) => setSchoolGrade(e.target.value)}
                        className={selectClasses}
                      >
                        <option value="Grade 9">Grade 9 (Freshman)</option>
                        <option value="Grade 10">Grade 10 (Sophomore)</option>
                        <option value="Grade 11">Grade 11 (Junior)</option>
                        <option value="Grade 12">Grade 12 (Senior)</option>
                      </select>
                      <span className="material-symbols-outlined text-slate-400 text-[18px] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                      School / Institution
                    </label>
                    <div className="relative">
                      <select
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className={selectClasses}
                      >
                        <option value="Science & Technology High School">Science &amp; Technology High School</option>
                        <option value="National STEM Magnet Academy">National STEM Magnet Academy</option>
                        <option value="Oakridge International High School">Oakridge International High School</option>
                        <option value="St. Xavier's Senior Secondary School">St. Xavier's Senior Secondary School</option>
                        <option value="Delhi Public School (DPS R.K. Puram)">Delhi Public School (DPS)</option>
                        <option value="Brookside Academy of Sciences">Brookside Academy of Sciences</option>
                        <option value="Other High School / Secondary School">Other High School / Secondary School</option>
                      </select>
                      <span className="material-symbols-outlined text-slate-400 text-[18px] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        expand_more
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* IF COLLEGE: Ask for College / Institution & Year */}
              {studentInstitutionType === 'college' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">account_balance</span>
                      College / University Institution
                    </label>
                    <div className="relative">
                      <select
                        value={collegeInstitution}
                        onChange={(e) => setCollegeInstitution(e.target.value)}
                        className={selectClasses}
                      >
                        <option value="Stanford University">Stanford University</option>
                        <option value="Massachusetts Institute of Technology (MIT)">MIT</option>
                        <option value="UC Berkeley">UC Berkeley</option>
                        <option value="Harvard University">Harvard University</option>
                        <option value="Oxford University">Oxford University</option>
                        <option value="Cambridge University">Cambridge University</option>
                        <option value="California Institute of Technology (Caltech)">Caltech</option>
                        <option value="Indian Institute of Technology (IIT)">Indian Institute of Technology (IIT)</option>
                        <option value="National University of Singapore (NUS)">NUS</option>
                        <option value="ETH Zurich">ETH Zurich</option>
                        <option value="Other Regional College / University">Other College / University</option>
                      </select>
                      <span className="material-symbols-outlined text-slate-400 text-[18px] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                      Class / Academic Year
                    </label>
                    <div className="relative">
                      <select
                        value={collegeYear}
                        onChange={(e) => setCollegeYear(e.target.value)}
                        className={selectClasses}
                      >
                        <option value="1st Year Undergraduate">1st Year Undergraduate</option>
                        <option value="2nd Year Undergraduate">2nd Year Undergraduate</option>
                        <option value="3rd Year Undergraduate">3rd Year Undergraduate</option>
                        <option value="4th Year Undergraduate (Senior)">4th Year Undergraduate (Senior)</option>
                        <option value="Postgraduate / Master's Student">Postgraduate / Master's Student</option>
                        <option value="PhD Candidate / Doctoral Researcher">PhD Candidate / Doctoral Researcher</option>
                      </select>
                      <span className="material-symbols-outlined text-slate-400 text-[18px] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        expand_more
                      </span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* 3. IF WORKING PROFESSION: Ask for Working Profession / Role & Organization */}
          {professionCategory === 'working profession' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                  Working Profession / Role
                </label>
                <div className="relative">
                  <select
                    value={workingRole}
                    onChange={(e) => setWorkingRole(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="Theoretical Physics Researcher">Theoretical Physics Researcher</option>
                    <option value="Quantum Computing Engineer">Quantum Computing Engineer</option>
                    <option value="Aerospace Propulsion Engineer">Aerospace Propulsion Engineer</option>
                    <option value="Software Engineer / AI Architect">Software Engineer / AI Architect</option>
                    <option value="Data Scientist & Systems Modeler">Data Scientist &amp; Systems Modeler</option>
                    <option value="Mechanical / Robotics Engineer">Mechanical / Robotics Engineer</option>
                    <option value="Biomedical & Genetic Engineer">Biomedical &amp; Genetic Engineer</option>
                    <option value="Professor / STEM Educator">Professor / STEM Educator</option>
                    <option value="Quantitative Financial Analyst">Quantitative Financial Analyst</option>
                    <option value="Other STEM Professional">Other STEM Professional</option>
                  </select>
                  <span className="material-symbols-outlined text-slate-400 text-[18px] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                  Institution / Organization
                </label>
                <div className="relative">
                  <select
                    value={workingInstitution}
                    onChange={(e) => setWorkingInstitution(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="National Aerospace & Space Lab">National Aerospace &amp; Space Lab</option>
                    <option value="CERN / European Particle Physics Center">CERN Particle Physics Center</option>
                    <option value="Advanced AI & Quantum Research Labs">Advanced AI &amp; Quantum Research Labs</option>
                    <option value="University Research Faculty">University Research Faculty</option>
                    <option value="Global Tech & Engineering Enterprise">Global Tech &amp; Engineering Enterprise</option>
                    <option value="Biotech Research Foundation">Biotech Research Foundation</option>
                    <option value="Independent Research / Consultancy">Independent Research / Consultancy</option>
                  </select>
                  <span className="material-symbols-outlined text-slate-400 text-[18px] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                  Class / Seniority Level
                </label>
                <div className="relative">
                  <select
                    value={workingSeniority}
                    onChange={(e) => setWorkingSeniority(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="Associate Researcher">Associate Researcher</option>
                    <option value="Senior Staff Scientist">Senior Staff Scientist</option>
                    <option value="Lead Research Engineer">Lead Research Engineer</option>
                    <option value="Principal Investigator">Principal Investigator</option>
                    <option value="Research Director / Fellow">Research Director / Fellow</option>
                  </select>
                  <span className="material-symbols-outlined text-slate-400 text-[18px] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    expand_more
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-700/20">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md transition-all active:translate-y-0.5"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
