import React from "react";
import { StudentProfile } from "../types";
import { AlertTriangle, Flame, ShieldAlert, Heart, Trophy, Zap, Compass, CheckCircle, Award, Star, ShieldCheck, Crown, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StatsProps {
  profile: StudentProfile;
  completedQuests: number;
  totalQuests: number;
}

export function DashboardStats({ profile, completedQuests, totalQuests }: StatsProps) {
  // 1. Calculate Academic Risk Score (0 - 100)
  // Higher is riskier
  let cgpaPoints = Math.max(0, (10 - profile.cgpa) * 10); // low cgpa = up to 50 points
  let backlogPoints = Math.min(30, profile.backlogs * 10); // backlogs = up to 30 points
  let attendancePoints = profile.attendance < 75 ? (75 - profile.attendance) * 1.5 : 0; // poor attendance = up to 40 points
  let rawRisk = cgpaPoints + backlogPoints + attendancePoints;
  const academicRisk = Math.min(100, Math.max(5, Math.round(rawRisk)));

  // 2. Calculate Burnout Risk (0 - 100)
  // High study hours + low confidence + backlog load = high burnout
  let studyLoad = Math.max(0, (profile.studyHours - 20) * 1.2); 
  let stressOffset = (10 - profile.confidenceLevel) * 6; // low confidence raises burnout
  let activeOverload = profile.backlogs * 5;
  let rawBurnout = studyLoad + stressOffset + activeOverload;
  const burnoutRisk = Math.min(100, Math.max(5, Math.round(rawBurnout)));

  // 3. Calculate Recovery Potential Score (0 - 100)
  // High confidence + high attendance offsets backlogs
  let confidenceAdvantage = profile.confidenceLevel * 5; // up to 50 points
  let attendanceStability = (profile.attendance / 100) * 35; // up to 35 points
  let backlogWeight = Math.max(0, 15 - profile.backlogs * 3); // offsets penalty
  let rawPotential = confidenceAdvantage + attendanceStability + backlogWeight;
  const recoveryPotential = Math.min(100, Math.max(10, Math.round(rawPotential)));

  const historyLogs = profile.cgpaHistory || [];
  const activeLogs = historyLogs.filter(h => h.semester.toLowerCase() !== "joined");

  // 4. Target & Career Intelligence math
  const completedTerms = activeLogs.length;
  const remainingTerms = Math.max(0, 8 - completedTerms);
  const currentCgpa = profile.cgpa;
  const targetCgpaVal = profile.targetCgpa || 8.5;
  const careerGoalVal = profile.careerGoal || "Software Engineer";

  let reqGPAStr = "N/A";
  let statusTextColor = "text-white";
  let statusTextDesc = "";

  if (remainingTerms > 0) {
    const totalPointsCompleted = currentCgpa * (completedTerms || 1); // fallback if 0 sems
    const totalPointsTarget = targetCgpaVal * 8;
    const pointsNeeded = totalPointsTarget - totalPointsCompleted;
    const reqGpaFloat = pointsNeeded / remainingTerms;
    
    if (reqGpaFloat <= 0) {
      reqGPAStr = "0.00";
      statusTextColor = "text-emerald-400";
      statusTextDesc = "AIM ASSURED: TARGET ALREADY SURPASSED WITH PREV LOGS.";
    } else if (reqGpaFloat > 10.0) {
      reqGPAStr = reqGpaFloat.toFixed(2);
      statusTextColor = "text-red-500 font-extrabold animate-pulse";
      statusTextDesc = "AIM REDZONE: EXCEEDS MAXIMUM MATRICES! ADJUST TARGET/REDUCE RISKS.";
    } else {
      reqGPAStr = reqGpaFloat.toFixed(2);
      if (reqGpaFloat > currentCgpa) {
        statusTextColor = "text-yellow-400 font-bold";
        statusTextDesc = `INCREASE SECTOR GAIN: YOU MUST OUTPERFORM HISTORIC AVERAGE BY ${(reqGpaFloat - currentCgpa).toFixed(2)} GRADIENT POINTS.`;
      } else {
        statusTextColor = "text-emerald-400 font-extrabold";
        statusTextDesc = "STABLE DEPLOYMENT: ON TRACK! MAINTAIN OUTPUTS TO ACQUIRE DIRECT AIM.";
      }
    }
  } else {
    reqGPAStr = "GRADUATED";
    statusTextColor = "text-[#ff00ff]";
    statusTextDesc = "8 SEMESTERS COMPLETED. ENTIRE CAMPAIGN ACHIEVED.";
  }

  // Progress percentage calculation
  const targetCgpaProgress = Math.min(100, Math.max(10, Math.round((currentCgpa / targetCgpaVal) * 100)));

  // Career action insights
  let insightsList: string[] = [];
  if (careerGoalVal === "AI Engineer") {
    insightsList = [
      "🔥 Core Skill Focus: Work with Neural Architectures and fine-tune Transformer modules.",
      "💡 Project Quest: Build a vector embeddings API proxy using @google/genai.",
      "📘 Grade Boost: Aim for premium grades in Probability Theory & Linear Algebra to pass academic screenings."
    ];
  } else if (careerGoalVal === "Data Scientist") {
    insightsList = [
      "🔥 Core Skill Focus: Advanced SQL, statistical modeling, and Pandas optimization.",
      "💡 Project Quest: Collect stress and habit data to train a linear classification model.",
      "📘 Grade Boost: Zero in on Machine Learning & Advanced Databases modules."
    ];
  } else if (careerGoalVal === "Software Engineer") {
    insightsList = [
      "🔥 Core Skill Focus: Data Structures, Algorithms, and System Design paradigms.",
      "💡 Project Quest: Implement concurrent server request handling or caching locks.",
      "📘 Grade Boost: Target stellar grades in Operating Systems and OOP."
    ];
  } else if (careerGoalVal === "Product Manager") {
    insightsList = [
      "🔥 Core Skill Focus: User discovery frameworks, product telemetry roadmap, and agile backlogs.",
      "💡 Project Quest: Draft a Product Requirement Document (PRD) for a stress-recovery synthesizer.",
      "📘 Grade Boost: Maintain >= 7.5 CGPA threshold to clean job filters."
    ];
  } else if (careerGoalVal === "Higher Studies") {
    insightsList = [
      "🔥 Core Skill Focus: Academic paper reviewing, research methodology, and GRE/GATE prep.",
      "💡 Project Quest: Publish a draft paper comparing retro gamification models.",
      "📘 Grade Boost: Max out your CGPA towards 9.0+ threshold for research grants."
    ];
  } else if (careerGoalVal === "Government Exams") {
    insightsList = [
      "🔥 Core Skill Focus: Quantitative aptitude, logical deduction, and general science modules.",
      "💡 Project Quest: Execute 3 full mock exams on General Aptitude syllabus.",
      "📘 Grade Boost: Maintain safe threshold and prioritize basic logic core."
    ];
  } else {
    insightsList = [
      "🔥 Core Skill Focus: General coding mastery, open-source contributions, and visual style.",
      "💡 Project Quest: Enhance the Academic RPG user interface with custom retro scanline layers.",
      "📘 Grade Boost: Keep continuous performance and attendance above safety zones."
    ];
  }

  // Map representation of all 8 semesters for multi-term tracking
  const semestersTracked = Array.from({ length: 8 }, (_, i) => ({
    num: i + 1,
    name: `Semester ${i + 1}`,
    cgpa: null as number | null,
    logged: false,
  }));

  activeLogs.forEach((log) => {
    const numMatch = log.semester.match(/[1-8]/);
    if (numMatch) {
      const parsedNum = parseInt(numMatch[0]);
      const targetSem = semestersTracked.find(s => s.num === parsedNum);
      if (targetSem && !targetSem.logged) {
        targetSem.cgpa = log.cgpa;
        targetSem.logged = true;
        return;
      }
    }
    const vacantSlot = semestersTracked.find(s => !s.logged);
    if (vacantSlot) {
      vacantSlot.cgpa = log.cgpa;
      vacantSlot.logged = true;
      vacantSlot.name = log.semester;
    }
  });

  const completedSemsCount = semestersTracked.filter(s => s.logged).length;

  const getRiskColor = (val: number) => {
    if (val >= 70) return "text-red-400 border-red-500 bg-red-950/20";
    if (val >= 40) return "text-yellow-400 border-yellow-500 bg-yellow-950/20";
    return "text-emerald-400 border-emerald-450 bg-emerald-950/20";
  };

  const getPotentialColor = (val: number) => {
    if (val >= 70) return "text-[#00ffff] border-[#00ffff] bg-cyan-950/20";
    if (val >= 40) return "text-cyan-400 border-cyan-450 bg-cyan-950/10";
    return "text-red-400 border-red-500 bg-red-950/20";
  };

  const renderPixelBar = (percentage: number, colorClass: string) => {
    const totalBlocks = 15;
    const activeBlocks = Math.round((percentage / 100) * totalBlocks);
    return (
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 font-mono text-lg select-none">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-0.5">
          {Array.from({ length: totalBlocks }).map((_, i) => (
            <span
              key={i}
              className={i < activeBlocks ? `${colorClass} font-bold animate-pulse` : "text-slate-800 font-bold"}
            >
              ■
            </span>
          ))}
        </div>
        <span className="text-xs font-black text-slate-400 shrink-0 ml-2 bg-slate-900 border border-slate-850 px-2.5 py-0.5 rounded select-none">
          {percentage}%
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Target & Career Intelligence Bento Row */}
      <div id="aim-career-intelligence" className="col-span-1 lg:col-span-3 border-4 border-yellow-500 bg-[#0f172a] rounded p-5 shadow-[6px_6px_0_0_#ca8a04] flex flex-col gap-5 font-mono select-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-black text-yellow-400 uppercase tracking-tight italic flex items-center gap-2">
              <Compass className="w-5 h-5 text-yellow-400 animate-spin" />
              AIM & CAREER GOAL TELEMETRY
            </h3>
            <p className="text-[10px] uppercase text-slate-400 mt-0.5">
              ACTIVE OBJECTIVE TRACKING AND GPA PATH FORECAST SEGMENT
            </p>
          </div>
          <div className="bg-slate-950 px-3 py-1 border border-slate-800 text-xs font-bold text-yellow-400 uppercase rounded">
            GOAL: {careerGoalVal}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Target CGPA Progress bar micro */}
          <div className="p-4 border-2 border-slate-800 rounded bg-slate-950 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase">TELEMETRY_A: CGPA TARGET DIFFERENTIAL</span>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-white">Current: <strong className="text-yellow-400">{currentCgpa.toFixed(2)}</strong></span>
                <span className="text-xs text-yellow-400">Aim: <strong>{targetCgpaVal.toFixed(2)}</strong></span>
              </div>
              <div className="text-xs font-bold text-slate-400 mt-2">AIM PROGRESS: {targetCgpaProgress}%</div>
            </div>
            <div className="w-full h-4 bg-slate-900 border border-slate-700 rounded overflow-hidden p-0.5 mt-2.5">
              <div
                className="h-full bg-yellow-400 rounded-sm transition-all duration-300"
                style={{ width: `${targetCgpaProgress}%` }}
              />
            </div>
          </div>

          {/* GPA Required forecast */}
          <div className="p-4 border-2 border-slate-800 rounded bg-slate-950">
            <span className="text-[10px] text-slate-500 uppercase">TELEMETRY_B: FUTURE GPA PROJECTION</span>
            <div className="text-xl font-extrabold text-white mt-1.5 flex justify-between items-center">
              <span>EST. REQUIRED:</span>
              <span className={`text-2xl font-black ${statusTextColor}`}>{reqGPAStr}</span>
            </div>
            <div className="text-[10px] uppercase text-slate-400 font-bold mt-2 leading-tight">
              {statusTextDesc}
            </div>
          </div>

          {/* Actionable insights list */}
          <div className="p-4 border-2 border-slate-800 rounded bg-slate-950 col-span-1 md:col-span-2 lg:col-span-1 flex flex-col justify-center">
            <span className="text-[10px] text-[#00ffff] uppercase font-bold tracking-wider mb-2">ACTIONABLE CAREER INSIGHTS</span>
            <ul className="text-[10px] text-slate-300 space-y-1.5 font-sans">
              {insightsList.map((ins, i) => (
                <li key={i} className="flex gap-1.5 items-start">
                  <span className="text-[#ff00ff]">&gt;</span>
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 1. Academic Risk Score Meter */}
      <div className="border-4 border-[#ff00ff] bg-[#0f172a] rounded p-5 flex flex-col justify-between shadow-[6px_6px_0_0_#4a044e] transform transition-transform hover:-translate-y-1">
        <div>
          <div className="flex justify-between items-center mb-3 font-mono">
            <span className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5 bg-red-950/30 px-2.5 py-1 border border-red-900/50 rounded animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-[#ff00ff]" /> CRITICAL CHECKPOINT
            </span>
            <span className="text-[10px] text-slate-500 uppercase">SYS_INDEX: r-01</span>
          </div>

          <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2 italic">
            ACADEMIC RISK SCORE
          </h3>
          <p className="text-[11px] text-slate-400 uppercase leading-relaxed mb-4 font-mono">
            Measures probability of module failures, missing attendance credits, and overall progression hazard.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-3 border-2 border-slate-800 rounded bg-slate-950">
            {renderPixelBar(academicRisk, "text-[#ff00ff]")}
          </div>

          <div className={`p-2.5 border border-dashed rounded text-[10px] uppercase font-bold flex items-center gap-2 font-mono ${getRiskColor(academicRisk)}`}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-bounce" />
            <div>
              {academicRisk >= 70 && "CRITICAL THREAT: IMMEDIATE RECOVERY plan required! Backlog & Attendance fail paths detected."}
              {academicRisk >= 40 && academicRisk < 70 && "WARNING: STABILITY DECREASING. Take preemptive revision study cycles."}
              {academicRisk < 40 && "STEADY STATE: ACADEMIC CORRIDORS ARE SAFE. Continue consistent daily checkouts."}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Burnout Risk Indicator */}
      <div className="border-4 border-[#00ffff] bg-[#0f172a] rounded p-5 flex flex-col justify-between shadow-[6px_6px_0_0_#1e293b] transform transition-transform hover:-translate-y-1">
        <div>
          <div className="flex justify-between items-center mb-3 font-mono">
            <span className="text-xs font-black text-yellow-500 uppercase tracking-widest flex items-center gap-1.5 bg-yellow-950/30 px-2.5 py-1 border border-yellow-900/50 rounded">
              <Flame className="w-3.5 h-3.5 text-[#00ffff]" /> OVERCLK MONITOR
            </span>
            <span className="text-[10px] text-slate-500 uppercase">SYS_INDEX: B-02</span>
          </div>

          <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2 italic">
            BURNOUT RISK INDICATOR
          </h3>
          <p className="text-[11px] text-slate-400 uppercase leading-relaxed mb-4 font-mono">
            Tracks physical & cognitive exhaustion index. Elevated values trigger rapid motivation depletion blocks.
          </p>
        </div>

        <div className="space-y-4 font-mono">
          <div className="p-3 border-2 border-slate-800 rounded bg-slate-950">
            {renderPixelBar(burnoutRisk, "text-yellow-400")}
          </div>

          <div className={`p-2.5 border border-dashed rounded text-[10px] uppercase font-bold flex items-center gap-2 ${getRiskColor(burnoutRisk)}`}>
            <Flame className="w-4 h-4 flex-shrink-0 animate-pulse text-yellow-400" />
            <div>
              {burnoutRisk >= 70 && "DANGER: HIGH CORE TEMPS! Cognitive exhaustion spike. Reduce weekly targets, schedule meditation."}
              {burnoutRisk >= 40 && burnoutRisk < 70 && "MODERATE LOAD: Pushing limits. Allocate appropriate leisure segments."}
              {burnoutRisk < 40 && "GREEN LOAD: Stable cognitive reserves. Ready to allocate increased comeback difficulty."}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recovery Potential Score */}
      <div className="border-4 border-emerald-400 bg-[#0f172a] rounded p-5 flex flex-col justify-between shadow-[6px_6px_0_0_#064e3b] transform transition-transform hover:-translate-y-1">
        <div>
          <div className="flex justify-between items-center mb-3 font-mono">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-950/30 px-2.5 py-1 border border-emerald-900/50 rounded">
              <Heart className="w-3.5 h-3.5 animate-pulse text-[#ff00ff]" /> ELEVATE PROTOCOL
            </span>
            <span className="text-[10px] text-slate-500 uppercase">SYS_INDEX: P-03</span>
          </div>

          <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2 italic">
            RECOVERY POTENTIAL
          </h3>
          <p className="text-[11px] text-slate-400 uppercase leading-relaxed mb-4 font-mono">
            Gauges adaptive bandwidth to erase backlogs, improve grade points, and complete academic comeback programs.
          </p>
        </div>

        <div className="space-y-4 font-mono">
          <div className="p-3 border-2 border-slate-800 rounded bg-slate-950">
            {renderPixelBar(recoveryPotential, "text-emerald-400")}
          </div>

          <div className={`p-2.5 border border-dashed rounded text-[10px] uppercase font-bold flex items-center gap-2 ${getPotentialColor(recoveryPotential)}`}>
            <Trophy className="w-4 h-4 flex-shrink-0 animate-bounce text-yellow-400" />
            <div>
              {recoveryPotential >= 70 && "MAXIMUM COMEBACK DRIVE: Student has high recovery capacity! Complete plan tasks immediately."}
              {recoveryPotential >= 40 && recoveryPotential < 70 && "VIABLE OPTION: Recovery is achievable. Upgrade subject logs for extra focus boost."}
              {recoveryPotential < 40 && "EXHAUSTED POTENTIAL: Critical backlog friction. Setup daily checkpoint logs with AI Coach."}
            </div>
          </div>
        </div>
      </div>

      {/* Simple Stats Grid Section underneath */}
      <div className="col-span-1 lg:col-span-3 border-4 border-dashed border-[#ff00ff]/30 p-4 rounded bg-[#0f172a] grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        
        <div className="text-center p-3 rounded bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold">CURRENT CGPA</div>
          <div className="text-xl font-extrabold text-[#ff00ff] mt-1">{profile.cgpa.toFixed(2)} / 10</div>
        </div>

        <div className="text-center p-3 rounded bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold">BACKLOG LOCKS</div>
          <div className="text-xl font-extrabold text-red-500 mt-1">{profile.backlogs} UNITS</div>
        </div>

        <div className="text-center p-3 rounded bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold">ATTENDANCE LEVEL</div>
          <div className="text-xl font-extrabold text-[#00ffff] mt-1">{profile.attendance}%</div>
        </div>

        <div className="text-center p-3 rounded bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold">QUEST LOG PROGRESS</div>
          <div className="text-xl font-extrabold text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            {completedQuests}/{totalQuests}
          </div>
        </div>

      </div>

      {/* Dynamic Player XP & Level Progression Monitor */}
      <div className="col-span-1 lg:col-span-3 border-4 border-[#ff00ff] bg-slate-950 p-5 rounded font-mono select-none shadow-[4px_4px_0_0_#4a044e] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-14 h-14 bg-[#ff00ff] border-4 border-white flex flex-col items-center justify-center shrink-0 shadow-[2px_2px_0_0_#ffffff]">
            <span className="text-[10px] font-bold text-black uppercase leading-none">LVL</span>
            <span className="text-xl font-black text-black leading-none">{Math.floor(profile.xp / 500) + 1}</span>
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Player Class: CGPA Sentinel</h4>
            <p className="text-[10px] text-slate-400 uppercase">EXPERIENCE SYSTEM EXPANDING DIRECT CHIP-8 CORE VALUES</p>
          </div>
        </div>

        {/* Progress Bar of XP */}
        <div className="w-full flex-1 max-w-md">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-1">
            <span>XP: {profile.xp} / {Math.floor(profile.xp / 500) * 500 + 500}</span>
            <span className="text-[#ff00ff]">{( (profile.xp % 500) / 500 * 100 ).toFixed(0)}% TO LEVEL UP</span>
          </div>
          <div className="w-full h-4 bg-slate-900 border-2 border-slate-705 rounded overflow-hidden p-0.5 animate-pulse">
            <div
              className="h-full bg-gradient-to-r from-[#ff00ff] to-[#00ffff] rounded shadow-[0_0_4px_rgba(255,0,255,0.4)] transition-all duration-300"
              style={{ width: `${((profile.xp % 500) / 500) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="col-span-1 lg:col-span-3 border-4 border-[#0ea5e9] bg-[#0f172a] rounded p-5 shadow-[6px_6px_0_0_#0c4a6e] space-y-4 font-mono">
        <div className="flex justify-between items-center border-b-2 border-slate-800 pb-3">
          <h3 className="text-sm font-black text-[#00ffff] uppercase tracking-tight italic flex items-center gap-2">
            <Award className="w-4 h-4 text-[#00ffff]" />
            ACHIEVEMENT BADGES
          </h3>
          <span className="bg-slate-950 px-2 py-1 border border-slate-800 text-[10px] text-slate-400 rounded uppercase">
            XP MILESTONES
          </span>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="p-3 border-2 border-slate-800 bg-slate-900 rounded flex flex-col items-center justify-center min-w-[130px] shadow-[4px_4px_0_0_#1e293b] select-none">
            <Compass className="w-8 h-8 text-neutral-400 mb-2" />
            <span className="text-[10px] font-black text-slate-300 text-center uppercase tracking-wider">Newbie Guide</span>
            <span className="text-[8px] text-slate-500 text-center uppercase mt-1">Profile Created</span>
          </div>

          {/* 1. CGPA Champion (CGPA >= 9.0) */}
          {profile.cgpa >= 9.0 ? (
            <div className="p-3 border-2 border-yellow-400 bg-yellow-950/40 rounded flex flex-col items-center justify-center min-w-[130px] shadow-[4px_4px_0_0_#ca8a04] transform hover:-translate-y-1 transition-all duration-150 select-none">
              <Award className="w-8 h-8 text-yellow-400 mb-2 animate-bounce" />
              <span className="text-[10px] font-black text-yellow-400 text-center uppercase tracking-wider">CGPA Champion</span>
              <span className="text-[8px] text-yellow-500 text-center uppercase mt-1 font-bold">CGPA &gt;= 9.0 UNLOCKED!</span>
            </div>
          ) : (
            <div className="p-3 border-2 border-slate-800 bg-slate-950/20 rounded flex flex-col items-center justify-center min-w-[130px] opacity-40 select-none" title="Requires CGPA >= 9.0">
              <Award className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-[10px] font-bold text-slate-600 text-center uppercase tracking-wider">CGPA Champion</span>
              <span className="text-[8px] text-slate-600 text-center uppercase mt-1">CGPA &gt;= 9.0 Locked</span>
            </div>
          )}

          {/* 2. Attendance Guard (Attendance >= 85%) */}
          {profile.attendance >= 85 ? (
            <div className="p-3 border-2 border-[#00ffff] bg-cyan-950/40 rounded flex flex-col items-center justify-center min-w-[130px] shadow-[4px_4px_0_0_#0284c7] transform hover:-translate-y-1 transition-all duration-150 select-none">
              <ShieldCheck className="w-8 h-8 text-[#00ffff] mb-2 animate-pulse" />
              <span className="text-[10px] font-black text-[#00ffff] text-center uppercase tracking-wider">Attendance Guard</span>
              <span className="text-[8px] text-cyan-400 text-center uppercase mt-1 font-bold">Attn &gt;= 85% UNLOCKED!</span>
            </div>
          ) : (
            <div className="p-3 border-2 border-slate-800 bg-slate-950/20 rounded flex flex-col items-center justify-center min-w-[130px] opacity-40 select-none" title="Requires Attendance >= 85%">
              <ShieldCheck className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-[10px] font-bold text-slate-600 text-center uppercase tracking-wider">Attendance Status</span>
              <span className="text-[8px] text-slate-600 text-center uppercase mt-1">Attn &gt;= 85% Locked</span>
            </div>
          )}

          {/* 3. Study Sentinel (Study hours >= 35/week) */}
          {profile.studyHours >= 35 ? (
            <div className="p-3 border-2 border-amber-500 bg-amber-950/40 rounded flex flex-col items-center justify-center min-w-[130px] shadow-[4px_4px_0_0_#b45309] transform hover:-translate-y-1 transition-all duration-150 select-none">
              <Zap className="w-8 h-8 text-amber-400 mb-2" />
              <span className="text-[10px] font-black text-amber-400 text-center uppercase tracking-wider">Study Sentinel</span>
              <span className="text-[8px] text-amber-500 text-center uppercase mt-1 font-bold">Hours &gt;= 35 UNLOCKED!</span>
            </div>
          ) : (
            <div className="p-3 border-2 border-slate-800 bg-slate-950/20 rounded flex flex-col items-center justify-center min-w-[130px] opacity-40 select-none" title="Requires study hours >= 35/week">
              <Zap className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-[10px] font-bold text-slate-600 text-center uppercase tracking-wider">Study Sentinel</span>
              <span className="text-[8px] text-slate-600 text-center uppercase mt-1">&gt;= 35 Hrs Locked</span>
            </div>
          )}

          {/* 4. Consistent Climber (logged semesters >= 3) */}
          {activeLogs.length >= 3 ? (
            <div className="p-3 border-2 border-[#ff00ff] bg-fuchsia-950/40 rounded flex flex-col items-center justify-center min-w-[130px] shadow-[4px_4px_0_0_#a21caf] transform hover:-translate-y-1 transition-all duration-150 select-none">
              <TrendingUp className="w-8 h-8 text-[#ff00ff] mb-2 animate-pulse" />
              <span className="text-[10px] font-black text-[#ff00ff] text-center uppercase tracking-wider">Consistent Climber</span>
              <span className="text-[8px] text-fuchsia-400 text-center uppercase mt-1 font-bold">Log &gt;= 3 Terms UNLOCKED!</span>
            </div>
          ) : (
            <div className="p-3 border-2 border-slate-800 bg-slate-950/20 rounded flex flex-col items-center justify-center min-w-[130px] opacity-40 select-none" title="Requires at least 3 logged semester records">
              <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-[10px] font-bold text-slate-600 text-center uppercase tracking-wider">Sem Climber</span>
              <span className="text-[8px] text-slate-600 text-center uppercase mt-1">Log &gt;= 3 Terms Locked</span>
            </div>
          )}

          {/* 5. Comeback King (Risk <= 20 with backlogs cleared) */}
          {(academicRisk <= 20 && profile.backlogs === 0) ? (
            <div className="p-3 border-2 border-emerald-400 bg-emerald-950/40 rounded flex flex-col items-center justify-center min-w-[130px] shadow-[4px_4px_0_0_#047857] transform hover:-translate-y-1 transition-all duration-150 select-none">
              <Crown className="w-8 h-8 text-emerald-400 mb-2 animate-bounce" />
              <span className="text-[10px] font-black text-emerald-400 text-center uppercase tracking-wider">Comeback King</span>
              <span className="text-[8px] text-emerald-500 text-center uppercase mt-1 font-bold">COMERACK COMPLETE!</span>
            </div>
          ) : (
            <div className="p-3 border-2 border-slate-800 bg-slate-950/20 rounded flex flex-col items-center justify-center min-w-[130px] opacity-40 select-none" title="Requires Academic Risk <= 20 and 0 backlogs">
              <Crown className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-[10px] font-bold text-slate-600 text-center uppercase tracking-wider">Comeback King</span>
              <span className="text-[8px] text-slate-600 text-center uppercase mt-1">Risk &lt;= 20 + 0 Backlog Locked</span>
            </div>
          )}
        </div>
      </div>

      {/* CGPA History & Trend Section */}
      <div id="cgpa-historical-telemetry" className="col-span-1 lg:col-span-3 border-4 border-[#00ffff] bg-[#0f172a] rounded p-5 shadow-[6px_6px_0_0_#1e293b] space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-800 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight italic flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#00ffff] rounded-full animate-ping" />
              CGPA PERFORMANCE & SEMESTER TREND RADAR
            </h3>
            <p className="text-[10px] uppercase text-slate-400 mt-0.5 font-mono">
              COMPREHENSIVE CGPA GRADUATION ANALYSIS AND GRADE RECOVERY HISTORIC TELEMETRY
            </p>
          </div>
          <div className="bg-slate-950 px-2.5 py-1 border border-slate-800 text-xs font-mono text-slate-400 rounded uppercase">
            STATUS: <span className="font-bold text-[#00ffff]">REAL-TIME_SYNC</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* History Metrics Panel */}
          <div className="space-y-4 font-mono">
            <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-450 uppercase font-bold">CURRENT CGPA</span>
                <span className="text-xs bg-[#ff00ff]/10 text-[#ff00ff] border border-[#ff00ff]/30 px-2 py-0.5 rounded font-black">
                  ACTIVE
                </span>
              </div>
              <div className="text-3xl font-black text-white tracking-widest flex items-baseline gap-1">
                {profile.cgpa.toFixed(2)}
                <span className="text-xs text-slate-500 font-bold">/ 10.00</span>
              </div>
            </div>

            <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-450 uppercase font-bold">PREVIOUS CGPA</span>
                <span className="text-xs bg-slate-900 border border-slate-700 px-2 py-0.5 rounded font-bold text-slate-400">
                  LAST SEM
                </span>
              </div>
              <div className="text-2xl font-black text-[#00ffff] tracking-widest flex items-baseline gap-1">
                {profile.prevCgpa !== undefined && profile.prevCgpa !== null ? (
                  <>
                    {profile.prevCgpa.toFixed(2)}
                    <span className="text-xs text-slate-500 font-bold">/ 10.00</span>
                  </>
                ) : (
                  <span className="text-slate-600 text-lg">FIRST RECORDED</span>
                )}
              </div>
            </div>

            {/* delta growth indicator if prev stats are clear */}
            {profile.prevCgpa !== undefined && profile.prevCgpa !== null && (
              <div className="p-3 border border-dashed rounded text-xs leading-relaxed uppercase border-slate-800">
                {(() => {
                  const diff = profile.cgpa - profile.prevCgpa;
                  if (diff > 0) {
                    return (
                      <div className="text-emerald-400 flex items-center gap-2">
                        <span className="text-lg">▲</span>
                        <span>GRADE RECOVERY BOOST: +{diff.toFixed(2)} CRITICAL GAINS ACQUIRED!</span>
                      </div>
                    );
                  } else if (diff < 0) {
                    return (
                      <div className="text-red-400 flex items-center gap-2">
                        <span className="text-lg">▼</span>
                        <span>ATTENUATED DRIFT: {diff.toFixed(2)} LEVEL DROPOUT. LAUNCH RECOVERY PLAN.</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-yellow-400 flex items-center gap-2">
                        <span className="text-lg">■</span>
                        <span>STEADY CORE STATE: CGPA REMAINS BALANCE-LOCKED. EXPAND DAILY STUDY STUDY.</span>
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </div>

          {/* Trend Chart Panel */}
          <div className="col-span-1 md:col-span-2">
            {profile.cgpaHistory && profile.cgpaHistory.length > 1 ? (
              <div className="h-60 w-full bg-slate-950 border border-slate-800 rounded p-4 relative font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={profile.cgpaHistory}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCgpa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ffff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00ffff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="semester"
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      className="font-mono text-[9px] stroke-slate-700"
                    />
                    <YAxis
                      domain={[0, 10]}
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      className="font-mono text-[9px] stroke-slate-700"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1e293b",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontFamily: "monospace",
                        color: "#fff"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cgpa"
                      name="CGPA"
                      stroke="#00ffff"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorCgpa)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-800 rounded bg-slate-950 p-6 text-center">
                <div className="w-10 h-10 border border-slate-700 text-slate-500 rounded bg-slate-900 flex items-center justify-center font-bold text-lg mb-3">
                  ?
                </div>
                <span className="text-[10px] text-slate-500 uppercase font-mono mb-2">SEMESTER TREND RADAR LOCKED</span>
                <p className="text-xs text-slate-400 font-sans max-w-sm font-semibold uppercase leading-normal">
                  You only have 1 data entry ({profile.cgpa.toFixed(2)}). Update CGPA after a semester or edit metrics under [F6] PROFILE & CGPA console to compute performance graphics!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. 8-Semester Graduation Core Tracker Grid */}
      <div id="graduation-core" className="col-span-1 lg:col-span-3 border-4 border-[#ff00ff] bg-[#0f172a] rounded p-5 shadow-[6px_6px_0_0_#4a044e] space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-800 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight italic flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#ff00ff] rounded-full animate-pulse" />
              GRADUATION CORE: 8-SEMESTER STATUS MODULE
            </h3>
            <p className="text-[10px] uppercase text-slate-400 mt-0.5 font-mono">
              COMPREHENSIVE MULTI-SEMESTER DEGREE TRACKING MATRIX
            </p>
          </div>
          <div className="bg-slate-950 px-2.5 py-1 border border-slate-800 text-xs font-mono text-slate-400 rounded uppercase">
            COMPLETED: <span className="font-bold text-[#ff00ff]">{completedSemsCount} / 8 SEMESTERS</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {semestersTracked.map((s) => (
            <div
              key={s.num}
              className={`p-3 border-2 rounded font-mono text-xs flex flex-col justify-between transition-all duration-150 ${
                s.logged
                  ? "bg-[#00ffff]/5 border-[#00ffff]/40 text-neutral-100 shadow-[0_0_8px_rgba(0,255,255,0.1)]"
                  : "bg-slate-950/40 border-slate-805 border-slate-800/80 text-slate-500"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[9px] uppercase font-bold tracking-wider ${s.logged ? "text-[#00ffff]" : "text-slate-600"}`}>
                  SLOT {s.num}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${s.logged ? "bg-[#00ffff] animate-ping" : "bg-slate-800"}`} />
              </div>
              
              <div className={`font-black uppercase tracking-tight text-[11px] truncate ${s.logged ? "text-white" : "text-slate-500"}`}>
                {s.name}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-900 flex justify-between items-baseline">
                <span className="text-[9px] uppercase text-slate-500">CGPA:</span>
                <span className={`text-base font-black ${s.logged ? "text-[#ff00ff]" : "text-slate-700 font-bold"}`}>
                  {s.logged ? s.cgpa?.toFixed(2) : "?.??"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
