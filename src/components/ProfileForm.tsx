import React, { useState } from "react";
import { StudentProfile } from "../types";
import { playLevelUpSound, playClickSound, playCoinSound } from "../utils/audio";
import { Gamepad2, Stars, User, Database, AlertCircle, Sparkles } from "lucide-react";

interface ProfileFormProps {
  userId: string;
  onSave: (profile: Omit<StudentProfile, "xp" | "streak">) => Promise<void>;
  initialProfile?: StudentProfile | null;
}

export function ProfileForm({ userId, onSave, initialProfile }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialProfile?.displayName || "");
  const [cgpa, setCgpa] = useState(initialProfile?.cgpa ? String(initialProfile.cgpa) : "");
  const [targetCgpa, setTargetCgpa] = useState(initialProfile?.targetCgpa ? String(initialProfile.targetCgpa) : "8.50");
  const [careerGoal, setCareerGoal] = useState(initialProfile?.careerGoal || "Software Engineer");
  const [backlogs, setBacklogs] = useState(initialProfile?.backlogs ? String(initialProfile.backlogs) : "0");
  const [attendance, setAttendance] = useState(initialProfile?.attendance ? String(initialProfile.attendance) : "75");
  const [studyHours, setStudyHours] = useState(initialProfile?.studyHours ? String(initialProfile.studyHours) : "25");
  const [confidenceLevel, setConfidenceLevel] = useState(initialProfile?.confidenceLevel || 5);
  const [subjects, setSubjects] = useState(initialProfile?.subjects || "Mathematics, Physics, Computer Science");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    if (!displayName.trim()) {
      setMsg("MONIKER DEVIATION DETECTED: PLEASE SPECIFY PLAYER NICKNAME");
      return;
    }

    const nCgpa = parseFloat(cgpa);
    if (isNaN(nCgpa) || nCgpa < 0 || nCgpa > 10) {
      setMsg("CGPA CORRUPT: MUST BE NUMERIC BETWEEN 0.0 AND 10.0");
      return;
    }

    const nTargetCgpa = parseFloat(targetCgpa);
    if (isNaN(nTargetCgpa) || nTargetCgpa < 0 || nTargetCgpa > 10) {
      setMsg("TARGET CGPA CORRUPT: MUST BE NUMERIC BETWEEN 0.0 AND 10.0");
      return;
    }

    if (nTargetCgpa < nCgpa) {
      setMsg("TARGET VALUE ERROR: AIM CGPA SHOULD AT LEAST EQUAL CURRENT CGPA");
      return;
    }

    const nBacklogs = parseInt(backlogs);
    if (isNaN(nBacklogs) || nBacklogs < 0) {
      setMsg("BACKLOG INTELLIGENCE FAULT: MUST BE NON-NEGATIVE COGNIZANCE");
      return;
    }

    const nAttendance = parseFloat(attendance);
    if (isNaN(nAttendance) || nAttendance < 0 || nAttendance > 100) {
      setMsg("ATTENDANCE DATA INTERRUPT: MUST BE PERCENTAGE VALUES BETWEEN 0 AND 100");
      return;
    }

    const nStudyHours = parseFloat(studyHours);
    if (isNaN(nStudyHours) || nStudyHours < 1 || nStudyHours > 168) {
      setMsg("HOURLY RADIAL FAULT: STUDY DISCIPLINE MUST RAMP 1 TO 168 HOURS");
      return;
    }

    setSubmitting(true);
    playLevelUpSound();

    try {
      await onSave({
        userId,
        displayName: displayName.trim(),
        cgpa: nCgpa,
        targetCgpa: nTargetCgpa,
        careerGoal: careerGoal,
        backlogs: nBacklogs,
        attendance: nAttendance,
        studyHours: nStudyHours,
        confidenceLevel,
        subjects: subjects.trim(),
      });
    } catch (err: any) {
      setMsg(`INITIALIZATION ERROR: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-6 bg-[#020617]">
      <div className="w-full max-w-2xl border-4 border-[#ff00ff] bg-[#0f172a] rounded shadow-[6px_6px_0_0_#4a044e] p-6 md:p-8">
        
        {/* Registration Title Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ff00ff]/10 border-2 border-[#ff00ff] text-[#ff00ff] text-xs font-black uppercase tracking-widest animate-pulse mb-3">
            <Sparkles className="w-3.5 h-3.5" /> SYSTEM BOOT SEGMENT: CHARACTER REGISTRY
          </div>
          <h2 className="text-2xl font-black text-white hover:text-[#00ffff] transition-colors uppercase select-none tracking-tighter italic">
            Configure Your Academic Core
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase">
            INPUT CRITICAL PARAMETERS FOR THERMAL ANALYSIS AND PERSONAL ROADMAP PRODUCTION
          </p>
        </div>

        {msg && (
          <div className="mb-4 p-3 border-2 border-red-500 bg-red-950/20 text-red-400 text-xs font-bold uppercase flex items-center gap-2 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Player Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#00ffff] uppercase flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> ARCADE MONIKER (NAME)
              </label>
              <input
                type="text"
                placeholder="e.g. CYBER_SAGE_7"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value.substring(0, 30));
                  playCoinSound();
                }}
                className="bg-slate-950 border-2 border-slate-700 rounded px-3 py-2 text-sm text-[#ff00ff] focus:border-[#ff00ff] focus:outline-none uppercase font-black"
              />
            </div>

            {/* Current CGPA */}
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-xs font-bold text-[#00ffff] uppercase flex items-center gap-1">
                <Database className="w-3.5 h-3.5" /> CURRENT CGPA (0.00 - 10.00)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 7.50"
                required
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                className="bg-slate-950 border-2 border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-[#ff00ff] focus:outline-none font-bold placeholder:text-slate-600"
              />
            </div>

            {/* Target CGPA */}
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-yellow-400" /> TARGET/AIM CGPA (0.00 - 10.00)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 8.50"
                required
                value={targetCgpa}
                onChange={(e) => setTargetCgpa(e.target.value)}
                className="bg-slate-950 border-2 border-slate-700 rounded px-3 py-2 text-sm text-yellow-400 focus:border-yellow-400 focus:outline-none font-bold placeholder:text-slate-600"
              />
            </div>

            {/* Career Goal */}
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-xs font-bold text-[#00ffff] uppercase">
                CAREER TARGET GOAL
              </label>
              <select
                value={careerGoal}
                onChange={(e) => {
                  setCareerGoal(e.target.value);
                  playCoinSound();
                }}
                className="bg-slate-950 border-2 border-slate-700 rounded px-3 py-2.5 text-sm text-white focus:border-[#ff00ff] focus:outline-none font-bold uppercase cursor-pointer"
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

            {/* Backlog counts */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#00ffff] uppercase">
                PENDING BACKLOGS / COURSES FAILED
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={backlogs}
                onChange={(e) => setBacklogs(e.target.value)}
                className="bg-slate-950 border-2 border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-[#ff00ff] focus:outline-none font-bold"
              />
            </div>

            {/* Current attendance */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#00ffff] uppercase">
                AVERAGE ATTENDANCE RATE (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
                className="bg-slate-950 border-2 border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-[#ff00ff] focus:outline-none font-bold"
              />
            </div>

            {/* Scheduled study Hours */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#00ffff] uppercase">
                WEEKLY TARGET STUDY LEVEL (HOURS)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                className="bg-slate-950 border-2 border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-[#ff00ff] focus:outline-none font-bold"
              />
            </div>

            {/* Morale and confidence index Slider */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#00ffff] uppercase flex justify-between items-center">
                <span>SUBJECTIVE CONFIDENCE LEVEL</span>
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
                onChange={(e) => {
                  setConfidenceLevel(parseInt(e.target.value));
                  playClickSound();
                }}
                className="accent-[#ff00ff] cursor-pointer h-2 bg-slate-950 rounded-lg appearance-none my-auto"
              />
            </div>

          </div>

          {/* Suffering Subjects classes tag list */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#00ffff] uppercase">
              SUFFERING / DIFFICULT SUBJECTS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              placeholder="e.g. Data structures, Probability, Embedded Systems"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              className="bg-slate-950 border-2 border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-[#ff00ff] focus:outline-none font-sans font-bold"
            />
          </div>

          {/* Submitting buttons trigger */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 py-3 border-4 border-[#ff00ff] bg-pink-950/20 text-[#ff00ff] font-black tracking-widest text-sm hover:bg-[#ff00ff] hover:text-black uppercase cursor-pointer rounded transition-all duration-150 active:translate-y-0.5 shadow-[4px_4px_0_0_#4a044e] disabled:opacity-50"
          >
            {submitting ? "BOOTSTRAPPING CORE COGNITION..." : "INITIALIZE PLAYER CORE STATE"}
          </button>

        </form>

      </div>
    </div>
  );
}
