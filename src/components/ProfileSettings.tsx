import React, { useState } from "react";
import { StudentProfile } from "../types";
import { playClickSound, playCoinSound, playLevelUpSound } from "../utils/audio";
import { User, Database, AlertCircle, Sparkles, Save, History, Plus, Layers, Edit2, Trash2, X, Check } from "lucide-react";

interface ProfileSettingsProps {
  profile: StudentProfile;
  onSave: (updatedProfile: StudentProfile) => Promise<void>;
  isGeneratingPlan: boolean;
}

export function ProfileSettings({ profile, onSave, isGeneratingPlan }: ProfileSettingsProps) {
  // 1. Edit Profile Form State
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [cgpa, setCgpa] = useState(String(profile.cgpa));
  const [targetCgpa, setTargetCgpa] = useState(String(profile.targetCgpa || "8.50"));
  const [careerGoal, setCareerGoal] = useState(profile.careerGoal || "Software Engineer");
  const [backlogs, setBacklogs] = useState(String(profile.backlogs));
  const [attendance, setAttendance] = useState(String(profile.attendance));
  const [studyHours, setStudyHours] = useState(String(profile.studyHours));
  const [confidenceLevel, setConfidenceLevel] = useState(profile.confidenceLevel || 5);
  const [subjects, setSubjects] = useState(profile.subjects || "");
  const [goal, setGoal] = useState(profile.goal || "Improve CGPA");
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // 2. New Semester Log State
  const [semesterLabel, setSemesterLabel] = useState("");
  const [semesterCgpa, setSemesterCgpa] = useState("");
  const [semesterCredits, setSemesterCredits] = useState("20");
  const [submittingSemester, setSubmittingSemester] = useState(false);
  const [semesterMsg, setSemesterMsg] = useState("");
  const [semesterSuccess, setSemesterSuccess] = useState("");

  // 3. Edit Semester Slot State
  const [editingSlotIdx, setEditingSlotIdx] = useState<number | null>(null);
  const [editSemesterLabel, setEditSemesterLabel] = useState("");
  const [editSemesterCgpa, setEditSemesterCgpa] = useState("");
  const [editSemesterCredits, setEditSemesterCredits] = useState("20");

  const computeWeightedCgpa = (history: { semester: string; cgpa: number; credits?: number }[]) => {
    if (!history || history.length === 0) return profile.cgpa;
    let totalPoints = 0;
    let totalCredits = 0;
    history.forEach((h) => {
      // Default to 20 if credits are missing for legacy records
      const c = h.credits !== undefined ? h.credits : 20;
      totalCredits += c;
      totalPoints += (h.cgpa * c);
    });
    return totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : profile.cgpa;
  };

  // 3. Handle General Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileSuccess("");

    if (!displayName.trim()) {
      setProfileMsg("MONIKER ERROR: NICKNAME CANNOT BE BLANK");
      return;
    }

    const nCgpa = parseFloat(cgpa);
    if (isNaN(nCgpa) || nCgpa < 0 || nCgpa > 10) {
      setProfileMsg("CGPA CORRUPUT: MUST BE BETWEEN 0.0 AND 10.0");
      return;
    }

    const nTargetCgpa = parseFloat(targetCgpa);
    if (isNaN(nTargetCgpa) || nTargetCgpa < 0 || nTargetCgpa > 10) {
      setProfileMsg("TARGET CGPA MUST BE BETWEEN 0.0 AND 10.0");
      return;
    }

    if (nTargetCgpa < nCgpa) {
      setProfileMsg("AIM CGPA MUST AT LEAST EQUAL CURRENT CGPA");
      return;
    }

    const nBacklogs = parseInt(backlogs);
    if (isNaN(nBacklogs) || nBacklogs < 0) {
      setProfileMsg("BACKLOGS MUST BE A NON-NEGATIVE INTEGER");
      return;
    }

    const nAttendance = parseFloat(attendance);
    if (isNaN(nAttendance) || nAttendance < 0 || nAttendance > 100) {
      setProfileMsg("ATTENDANCE MUST BE BETWEEN 0 AND 100%");
      return;
    }

    const nStudyHours = parseFloat(studyHours);
    if (isNaN(nStudyHours) || nStudyHours < 1 || nStudyHours > 168) {
      setProfileMsg("STUDY HOURS MUST BE BETWEEN 1 AND 168 HOURS WEEKLY");
      return;
    }

    setSubmittingProfile(true);
    playLevelUpSound();

    try {
      // Keep prevailing previous CGPA and trend history intact during a generic edit
      const updated: StudentProfile = {
        ...profile,
        displayName: displayName.trim(),
        cgpa: nCgpa,
        targetCgpa: nTargetCgpa,
        careerGoal: careerGoal,
        backlogs: nBacklogs,
        attendance: nAttendance,
        studyHours: nStudyHours,
        confidenceLevel,
        subjects: subjects.trim(),
        goal: goal,
        updatedAt: new Date(),
      };

      await onSave(updated);
      setProfileSuccess("CHARACTER RE-CONFIGURED SUCCESSFULLY. FRESH AI COMERACK ROADMAP GENERATED!");
    } catch (err: any) {
      setProfileMsg(`SYNC FAULT: ${err.message || err}`);
    } finally {
      setSubmittingProfile(false);
    }
  };

  // 4. Handle Logging Semester Outcomes (Updates CGPA, records Previous, maintains Trend list)
  const handleSemesterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSemesterMsg("");
    setSemesterSuccess("");

    if (!semesterLabel.trim()) {
      setSemesterMsg("SEMESTER IDENTIFIER DETECTED EMPTY");
      return;
    }

    const nSemCgpa = parseFloat(semesterCgpa);
    if (isNaN(nSemCgpa) || nSemCgpa < 0 || nSemCgpa > 10) {
      setSemesterMsg("SEMESTER CGPA ERROR: MUST BE NUMERIC BETWEEN 0.0 AND 10.0");
      return;
    }

    const nCred = parseInt(semesterCredits) || 20;

    setSubmittingSemester(true);
    playLevelUpSound();

    try {
      let newHistory = [...(profile.cgpaHistory || [])];
      
      if (newHistory.length === 0 && profile.cgpa > 0) {
        newHistory.push({
          semester: "Joined",
          cgpa: profile.cgpa,
          credits: 20
        });
      }

      newHistory.push({
        semester: semesterLabel.trim(),
        cgpa: nSemCgpa,
        credits: nCred
      });

      const newCurrentCgpa = computeWeightedCgpa(newHistory);

      const updated: StudentProfile = {
        ...profile,
        prevCgpa: profile.cgpa, 
        cgpaHistory: newHistory, 
        cgpa: newCurrentCgpa, 
        updatedAt: new Date(),
      };

      await onSave(updated);
      
      setCgpa(String(newCurrentCgpa));
      setSemesterLabel("");
      setSemesterCgpa("");
      setSemesterCredits("20");
      setSemesterSuccess(`SEMESTER '${semesterLabel}' REGISTERED! OVERALL CGPA UPDATED TO ${newCurrentCgpa}.`);
    } catch (err: any) {
      setSemesterMsg(`SEMESTER REGISTRATION FAILURE: ${err.message || err}`);
    } finally {
      setSubmittingSemester(false);
    }
  };

  const startEditSlot = (idx: number, label: string, c: number, cred?: number) => {
    setEditingSlotIdx(idx);
    setEditSemesterLabel(label);
    setEditSemesterCgpa(String(c));
    setEditSemesterCredits(String(cred !== undefined ? cred : 20));
    playClickSound();
  };

  const handleEditSlotSubmit = async (idx: number) => {
    if (!editSemesterLabel.trim()) return;
    const nCgpa = parseFloat(editSemesterCgpa);
    if (isNaN(nCgpa) || nCgpa < 0 || nCgpa > 10) return;
    const nCred = parseInt(editSemesterCredits) || 20;

    try {
      let newHistory = [...(profile.cgpaHistory || [])];
      newHistory[idx] = { semester: editSemesterLabel.trim(), cgpa: nCgpa, credits: nCred };
      
      const newCurrentCgpa = computeWeightedCgpa(newHistory);

      const updated: StudentProfile = {
        ...profile,
        cgpaHistory: newHistory,
        cgpa: newCurrentCgpa,
        updatedAt: new Date()
      };
      await onSave(updated);
      setCgpa(String(newCurrentCgpa));
      setEditingSlotIdx(null);
      playLevelUpSound();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSlot = async (idx: number) => {
    try {
      playClickSound();
      let newHistory = [...(profile.cgpaHistory || [])];
      newHistory.splice(idx, 1);
      
      const newCurrentCgpa = computeWeightedCgpa(newHistory);

      const updated: StudentProfile = {
        ...profile,
        cgpaHistory: newHistory,
        cgpa: newCurrentCgpa,
        updatedAt: new Date()
      };
      await onSave(updated);
      setCgpa(String(newCurrentCgpa));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex items-center gap-3">
        <div className="p-1 px-2 = py-0.5 bg-cyan-950/20 border-2 border-[#00ffff] text-[#00ffff] text-xs font-black uppercase rounded font-mono select-none">
          CN-F6
        </div>
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Character Core & CGPA Settings</h2>
          <p className="text-[10px] uppercase text-slate-400 font-mono">
            Tinker with physical student telemetry parameters, or register semester outcomes to track history.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL 1: CHARACTER CORE ADJUSTMENT */}
        <div id="character-adjustment-console" className="border-4 border-[#ff00ff] bg-[#0f172a] rounded p-6 shadow-[6px_6px_0_0_#4a044e] flex flex-col justify-between">
          <div className="space-y-4 font-mono">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-[#ff00ff] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> CORE RE-CONFIGURATION
              </span>
              <span className="text-[9px] text-slate-500">TABS // SYSTEM</span>
            </div>

            {profileMsg && (
              <div className="p-3 border-2 border-red-500 bg-red-950/20 text-red-400 text-xs font-bold uppercase flex items-center gap-2 rounded">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{profileMsg}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 border-2 border-emerald-500 bg-emerald-950/25 text-emerald-400 text-xs font-bold uppercase flex items-center gap-2 rounded">
                <Sparkles className="w-4 h-4 flex-shrink-0 animate-ping" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                  <label className="font-bold text-[#00ffff] uppercase">ARCADE MONIKER</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => { setDisplayName(e.target.value.substring(0, 30)); playCoinSound(); }}
                    className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-[#ff00ff] focus:border-[#ff00ff] focus:outline-none uppercase font-black"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#00ffff] uppercase">ACTIVE CGPA (CURRENT)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:border-[#ff00ff] focus:outline-none font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-yellow-500 uppercase">TARGET / AIM CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={targetCgpa}
                    onChange={(e) => setTargetCgpa(e.target.value)}
                    className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-yellow-500 focus:border-yellow-500 focus:outline-none font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                  <label className="font-bold text-[#00ffff] uppercase">CAREER TARGET GOAL</label>
                  <select
                    value={careerGoal}
                    onChange={(e) => {
                      setCareerGoal(e.target.value);
                      playCoinSound();
                    }}
                    className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-[#ff00ff] focus:border-[#ff00ff] focus:outline-none font-bold uppercase cursor-pointer"
                  >
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="AI Engineer">AI Engineer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Higher Studies">Higher Studies</option>
                    <option value="Government Exams">Government Exams</option>
                    <option value="Other">Other Role</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#00ffff] uppercase">PENDING BACKLOG COURSES</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={backlogs}
                    onChange={(e) => setBacklogs(e.target.value)}
                    className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:border-[#ff00ff] focus:outline-none font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#00ffff] uppercase">ATTENDANCE AVERAGE (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value)}
                    className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:border-[#ff00ff] focus:outline-none font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#00ffff] uppercase">WEEKLY TARGET STUDY HOURS</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:border-[#ff00ff] focus:outline-none font-bold"
                  />
                </div>

              </div>

              <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                <label className="font-bold text-[#00ffff] uppercase flex justify-between items-center">
                  <span>SUBJECTIVE CONFIDENCE SCALE</span>
                  <span className="text-[#ff00ff] font-bold bg-slate-950 px-2 border border-slate-800 rounded">
                    {confidenceLevel}/10
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={confidenceLevel}
                  onChange={(e) => { setConfidenceLevel(parseInt(e.target.value)); playClickSound(); }}
                  className="accent-[#ff00ff] cursor-pointer h-2 bg-slate-950 rounded appearance-none mt-2"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                <label className="font-bold text-[#00ffff] uppercase">DIFFICULT / STUCK SUBJECTS</label>
                <input
                  type="text"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:border-[#ff00ff] focus:outline-none font-sans font-bold"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                <label className="font-bold text-yellow-400 uppercase">ACADEMIC & CAREER GOAL</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-yellow-400 focus:border-yellow-500 focus:outline-none font-bold uppercase cursor-pointer"
                >
                  <option value="Improve CGPA">Improve CGPA (Core Academia)</option>
                  <option value="Placement">Corporate Placement (Job Tracker)</option>
                  <option value="GATE">GATE Exam Prep (Advanced Technical)</option>
                  <option value="Higher Studies">Higher Studies (Masters/GRE Route)</option>
                  <option value="Internship">Internship Selection (Summer Skills)</option>
                  <option value="Research">Research & Papers (Academic Pathway)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingProfile || isGeneratingPlan}
                className="w-full mt-4 py-2 bg-pink-950/20 text-[#ff00ff] border-2 border-[#ff00ff] font-black uppercase text-xs rounded hover:bg-[#ff00ff] hover:text-black flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0_0_#4a044e] transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {submittingProfile || isGeneratingPlan
                    ? "COMPUTING MATRIX ROADMAP..."
                    : "SAVE CHANGES & REGEN ROADMAP"}
                </span>
              </button>

            </form>
          </div>
        </div>

        {/* PANEL 2: SEMESTER OUTCOME LOGGING */}
        <div id="semester-outcome-logging" className="border-4 border-[#00ffff] bg-[#0f172a] rounded p-6 shadow-[6px_6px_0_0_#1e293b] flex flex-col justify-between">
          <div className="space-y-4 font-mono">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-[#00ffff] uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4" /> LOG COMPLETED SEMESTER
              </span>
              <span className="text-[9px] text-slate-500">GRADES // TELEMETRY</span>
            </div>

            <p className="text-[11px] text-slate-400 uppercase leading-relaxed font-sans font-medium">
              Update your cumulative CGPA after a semester finishes. The core engine will back up your preceding CGPA to track growth differences, and append the grade point to your semester trend log!
            </p>

            {semesterMsg && (
              <div className="p-3 border-2 border-red-500 bg-red-950/20 text-red-400 text-xs font-bold uppercase flex items-center gap-2 rounded">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{semesterMsg}</span>
              </div>
            )}

            {semesterSuccess && (
              <div className="p-3 border-2 border-emerald-500 bg-emerald-950/25 text-emerald-400 text-xs font-bold uppercase flex items-center gap-2 rounded">
                <Sparkles className="w-4 h-4 flex-shrink-0 animate-ping" />
                <span>{semesterSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSemesterSubmit} className="space-y-4 text-xs">
              
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#00ffff] uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Semester Identifier (Name / Term)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Semester 2 or Spring 2026"
                  value={semesterLabel}
                  onChange={(e) => { setSemesterLabel(e.target.value); playCoinSound(); }}
                  className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:border-[#00ffff] focus:outline-none font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#00ffff] uppercase flex items-center gap-1.5 text-[10px]">
                    <Database className="w-3 h-3" /> Semester CGPA (0.00 - 10.00)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 8.24"
                    value={semesterCgpa}
                    onChange={(e) => setSemesterCgpa(e.target.value)}
                    className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:border-[#00ffff] focus:outline-none font-bold placeholder:text-slate-600 w-full"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#00ffff] uppercase flex items-center gap-1.5 text-[10px]">
                    <Database className="w-3 h-3" /> Semester Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    placeholder="e.g. 20"
                    value={semesterCredits}
                    onChange={(e) => setSemesterCredits(e.target.value)}
                    className="bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:border-[#00ffff] focus:outline-none font-bold placeholder:text-slate-600 w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingSemester || isGeneratingPlan}
                className="w-full mt-4 py-2.5 bg-cyan-950/20 text-[#00ffff] border-2 border-[#00ffff] font-black uppercase text-xs rounded hover:bg-[#00ffff] hover:text-black flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0_0_#1e293b] transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {submittingSemester || isGeneratingPlan
                    ? "COMMITTING OUTCOME STATE..."
                    : "REGISTER SEMESTER OUTCOME CONTROLLER"}
                </span>
              </button>

            </form>

            {profile.cgpaHistory && profile.cgpaHistory.length > 0 && (
              <div className="mt-6 space-y-2 border-t border-slate-800 pt-4">
                <h3 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3">SEMESTER SLOTS</h3>
                {profile.cgpaHistory.map((hist, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-900 border border-slate-700 rounded text-xs transition-all hover:border-slate-500">
                    {editingSlotIdx === idx ? (
                      <div className="flex flex-col gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={editSemesterLabel}
                          onChange={(e) => setEditSemesterLabel(e.target.value)}
                          className="bg-slate-950 border border-[#00ffff] rounded px-2 py-1 focus:outline-none text-white uppercase font-bold"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={editSemesterCgpa}
                            onChange={(e) => setEditSemesterCgpa(e.target.value)}
                            className="bg-slate-950 border border-[#00ffff] rounded px-2 py-1 focus:outline-none text-white font-bold"
                            placeholder="CGPA"
                          />
                          <input
                            type="number"
                            min="1"
                            max="40"
                            value={editSemesterCredits}
                            onChange={(e) => setEditSemesterCredits(e.target.value)}
                            className="bg-slate-950 border border-[#00ffff] rounded px-2 py-1 focus:outline-none text-white font-bold"
                            placeholder="Credits"
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-1">
                          <button onClick={() => setEditingSlotIdx(null)} className="p-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"><X className="w-3 h-3" /></button>
                          <button onClick={() => handleEditSlotSubmit(idx)} className="p-1.5 bg-[#00ffff] text-black rounded hover:bg-cyan-400 transition-colors"><Check className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center group">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#00ffff] uppercase">{hist.semester}</span>
                          <span className="text-slate-400">CGPA: <span className="text-white font-black">{hist.cgpa.toFixed(2)}</span> <span className="text-[10px] ml-1">(Credits: {hist.credits ?? 20})</span></span>
                        </div>
                        <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditSlot(idx, hist.semester, hist.cgpa, hist.credits)} className="p-1.5 bg-slate-800 text-[#00ffff] rounded hover:bg-slate-700 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteSlot(idx)} className="p-1.5 bg-red-950/30 text-red-400 border border-red-900 rounded hover:bg-red-900 hover:text-white transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </div>

      </div>

    </div>
  );
}
