import React, { useState } from "react";
import { JournalEntry } from "../types";
import { playPowerUp, playClickSound, playCoinSound } from "../utils/audio";
import { 
  PenTool, Brain, AlertTriangle, Calendar, Heart, 
  Sparkles, Trash2, Edit2, Check, X, ShieldAlert, Coins, Flame 
} from "lucide-react";

interface JournalProps {
  journals: JournalEntry[];
  onAddJournal: (content: string, stressLevel: number) => Promise<void>;
  onDeleteJournal: (id: string) => Promise<void>;
  onEditJournal: (id: string, content: string, stressLevel: number) => Promise<void>;
}

export function StressJournal({ journals, onAddJournal, onDeleteJournal, onEditJournal }: JournalProps) {
  const [content, setContent] = useState("");
  const [stressLevel, setStressLevel] = useState(5);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Editing state variables
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editStress, setEditStress] = useState(5);
  const [savingEdit, setSavingEdit] = useState(false);

  // Active player streak simulation (calculated from journals count)
  const currentStreak = journals.length > 0 ? Math.min(journals.length, 7) : 0;
  // Coins reward total
  const goldCoins = journals.length * 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setErrorMsg("");
    setAnalyzing(true);
    playPowerUp();

    try {
      await onAddJournal(content.trim(), stressLevel);
      setContent("");
      setStressLevel(5);
      playCoinSound();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "COGNITIVE OVERLOAD: SECURE PORT EXCEEDED");
    } finally {
      setAnalyzing(false);
    }
  };

  const startEditing = (log: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling expansion
    playClickSound();
    setEditingId(log.id);
    setEditContent(log.content);
    setEditStress(log.stressLevel);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setEditingId(null);
  };

  const saveEdit = async (logId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editContent.trim()) return;

    setErrorMsg("");
    setSavingEdit(true);
    playPowerUp();

    try {
      await onEditJournal(logId, editContent.trim(), editStress);
      setEditingId(null);
      playCoinSound();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "EDIT REFUSED: SYSTEM CRITICAL CONSTRAINTS");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (logId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("🚨 PURGE RAW JOURNAL DIARY? THIS CRITICALLY ERASES DOCK ANALYSIS FOREVER.")) {
      playClickSound();
      try {
        await onDeleteJournal(logId);
        if (expandedId === logId) setExpandedId(null);
        if (editingId === logId) setEditingId(null);
      } catch (err: any) {
        alert(err.message || "DELETE ERROR OCCURRED");
      }
    }
  };

  const getStressBadgeColor = (level: number) => {
    if (level >= 8) return "bg-red-950/40 text-red-500 border-red-500";
    if (level >= 5) return "bg-yellow-950/40 text-yellow-500 border-yellow-500";
    return "bg-emerald-950/40 text-emerald-400 border-emerald-400";
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Arcade Rewards HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-4 border-dashed border-[#ff00ff]/30 p-4 bg-[#0a0f1d] rounded font-mono select-none">
        <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded border border-slate-800">
          <div className="w-10 h-10 rounded bg-[#ff00ff]/20 border-2 border-[#ff00ff] flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5 text-[#ff00ff] animate-bounce" />
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase">GOLD COINS EARNED</div>
            <div className="text-sm font-black text-white">{goldCoins} GC <span className="text-[9px] text-[#ff00ff]">(+15 GC/scan)</span></div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded border border-slate-800">
          <div className="w-10 h-10 rounded bg-[#00ffff]/20 border-2 border-[#00ffff] flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-[#00ffff] animate-pulse" />
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase">JOURNALING STREAK</div>
            <div className="text-sm font-black text-white">{currentStreak} DAYS <span className="text-[9px] text-emerald-400">🔥 ACTIVE</span></div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded border border-slate-800">
          <div className="w-10 h-10 rounded bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase">SYS_INTEGRITY STATUS</div>
            <div className="text-sm font-black text-white">LEVEL {currentStreak >= 5 ? "MAX" : "SYNCED"} <span className="text-[8px] text-slate-400">100XP / DIARY</span></div>
          </div>
        </div>
      </div>

      {/* Main Journal Core Grid */}
      <div className="border-4 border-[#ff00ff] bg-[#0f172a] rounded p-6 shadow-[6px_6px_0_0_#4a044e] grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* 1. Add Journal Form */}
        <div className="md:col-span-5 space-y-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-1.5 italic">
              <PenTool className="w-4 h-4 text-[#ff00ff]" />
              STRESS THERMAL SCANNER_
            </h3>
            <p className="text-[10px] text-slate-400 uppercase mt-0.5 font-mono">
              Vent academic blockers, backlog stress, or exam burden. We generate cognitive corrective recommendations with AI.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 border-2 border-rose-500 bg-rose-950/20 text-rose-400 text-xs font-mono font-bold uppercase rounded shadow-[2px_2px_0_0_#4a044e]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex justify-between select-none">
                <span>CUR_STRESS LEVEL INDICATOR_</span>
                <span className="text-[#00ffff] font-black bg-[#020617] px-1.5 rounded border border-slate-800">
                  {stressLevel} / 10
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={stressLevel}
                onChange={(e) => {
                  setStressLevel(parseInt(e.target.value));
                  playClickSound();
                }}
                className="accent-[#ff00ff] cursor-pointer h-1.5 bg-[#020617] rounded appearance-none"
              />
            </div>

            <div className="flex flex-col gap-1.5 bg-[#020617] p-3 border-2 border-[#ff00ff]/20 rounded focus-within:border-[#ff00ff] transition-colors">
              <textarea
                placeholder="e.g. Feeling incredibly overwhelmed with the advanced statistics backlog. Attendance has dropped down to 68% and there is an exam tomorrow morning..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-32 bg-transparent text-sm text-[#00ffff] focus:outline-none placeholder:text-slate-650 font-sans leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={analyzing || !content.trim()}
              className="w-full py-2.5 border-4 border-[#ff00ff] bg-[#ff00ff]/10 text-[#ff00ff] font-black tracking-widest text-xs rounded hover:bg-[#ff00ff] hover:text-black uppercase cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 duration-150 active:translate-y-0.5 shadow-[3px_3px_0_0_#4a044e]"
            >
              <Brain className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`} />
              {analyzing ? "CORES RUNNING CHIP-8 ANALYSIS..." : "SCAN DIARY VIA GEMINI"}
            </button>
          </form>
        </div>

        {/* 2. Journal Entries and Thermal summaries */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-black text-[#00ffff] uppercase tracking-tighter italic">
              HISTORIC JOURNAL DIAGNOSTICS ({journals.length})
            </h3>
            <p className="text-[10px] text-slate-400 uppercase mt-0.5 font-mono">
              Expand log indices below to retrieve customized digital morale boosts and corrective action plans.
            </p>
          </div>

          <div className="flex-1 max-h-[380px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {journals.length === 0 ? (
              <div className="text-center py-16 bg-[#020617] border-2 border-dashed border-slate-800 rounded">
                <span className="text-xs text-slate-500 uppercase font-bold font-mono block mb-2">
                  NO ACTIVE JOURNAL RECORD SCRIPTS LOCATED
                </span>
                <span className="text-[10px] text-slate-600 font-mono uppercase">
                  ENTER AN ACADEMIC SCANDAL LOG ON THE LEFT TO AWAKEN COGNITIVE ASSISTANCE.
                </span>
              </div>
            ) : (
              journals.map((log) => {
                const isExpanded = expandedId === log.id;
                const isEditing = editingId === log.id;

                return (
                  <div
                    key={log.id}
                    className="bg-[#020617] border-2 border-slate-800 rounded overflow-hidden font-mono transform hover:border-slate-700 transition-all duration-150"
                  >
                    {/* Header bar */}
                    <div
                      onClick={() => {
                        if (!isEditing) {
                          playClickSound();
                          setExpandedId(isExpanded ? null : log.id);
                        }
                      }}
                      className="p-3 select-none cursor-pointer flex items-center justify-between hover:bg-[#0f172a] transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase w-10/12">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 border text-[9px] rounded font-black ${getStressBadgeColor(log.stressLevel)}`}>
                          STRESS: {log.stressLevel}/10
                        </span>
                        {log.updatedAt && (
                          <span className="text-[8px] text-slate-500 border border-slate-800 px-1.5 py-0.2 rounded font-mono">
                            MODIFIED
                          </span>
                        )}
                      </div>

                      {/* Action buttons (Edit/Delete) */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {!isEditing && (
                          <>
                            <button
                              onClick={(e) => startEditing(log, e)}
                              className="p-1 text-slate-400 hover:text-[#00ffff] border border-transparent hover:border-slate-800 hover:bg-slate-900 rounded cursor-pointer"
                              title="Modify log draft"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(log.id, e)}
                              className="p-1 text-slate-450 hover:text-red-500 border border-transparent hover:border-slate-800 hover:bg-slate-900 rounded cursor-pointer"
                              title="Delete log draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {!isEditing && (
                          <span className="text-[9px] font-black tracking-widest text-[#ff00ff] bg-pink-950/10 px-1.5 py-0.5 rounded border border-[#ff00ff]/35 ml-1 select-none">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* EDIT MODE FORM BLOCK */}
                    {isEditing && (
                      <div className="p-4 border-t-2 border-[#00ffff] bg-slate-950/80 space-y-4">
                        <div className="text-[9px] text-[#00ffff] font-black uppercase tracking-wider">
                          MUTATING THERMAL SCAN VALUES_
                        </div>

                        <div className="space-y-3 font-mono">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black">
                              <span>RE-ARRANGE STRESS:</span>
                              <span className="text-yellow-400 font-black">{editStress}/10</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="1"
                              value={editStress}
                              onChange={(e) => {
                                setEditStress(parseInt(e.target.value));
                                playClickSound();
                              }}
                              className="accent-[#00ffff] h-1 bg-[#090f1e] rounded appearance-none"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5 bg-[#020617] p-2.5 border border-slate-800 rounded">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full h-24 bg-transparent text-xs text-white focus:outline-none font-sans leading-relaxed"
                              required
                            />
                          </div>
                          
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={(e) => cancelEditing(e)}
                              disabled={savingEdit}
                              className="px-3 py-1 bg-slate-900 text-slate-450 border border-slate-750 text-[10px] font-bold rounded uppercase hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              CANCEL
                            </button>
                            <button
                              onClick={(e) => saveEdit(log.id, e)}
                              disabled={savingEdit || !editContent.trim()}
                              className="px-3 py-1 bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff] text-[10px] font-black rounded uppercase hover:bg-[#00ffff] hover:text-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {savingEdit ? (
                                <Sparkles className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              SAVE CHANGES
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EXPANDED CONTENT DATA */}
                    {isExpanded && !isEditing && (
                      <div className="p-4 border-t-2 border-slate-900 bg-[#020617] space-y-4 text-xs font-mono">
                        {/* Original diary content */}
                        <div>
                          <div className="text-[9px] text-slate-500 font-extrabold uppercase mb-1">RAW THERMAL RECORD:</div>
                          <div className="text-slate-300 font-sans leading-relaxed p-2.5 bg-[#0f172a] rounded italic border border-slate-800">
                            "{log.content}"
                          </div>
                        </div>

                        {/* Coach custom boost */}
                        <div className="border border-[#00ffff] bg-[#00ffff]/5 p-3 rounded">
                          <div className="text-[9px] text-[#00ffff] font-extrabold uppercase flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 inline-block text-[#00ffff]" />
                            COACH CORE-DX MORALE BOOST:
                          </div>
                          <p className="text-white leading-relaxed font-sans font-medium text-xs">
                            {(log.analysis?.confidenceBoost || "Initialize system core check to construct morale boost.").replace(/Rebound AI|Rebound/gi, "ElevateU")}
                          </p>
                          <div className="text-[9px] text-[#ff00ff] uppercase font-black tracking-wider mt-2.5">
                            CALCULATED MOTIVATION INDEX: <span className="underline">{log.analysis?.motivationLevel || "MEDIUM"}</span>
                          </div>
                        </div>

                        {/* Actionable hacks */}
                        <div>
                          <div className="text-[9px] text-[#ff00ff] font-extrabold uppercase mb-2 flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-[#ff00ff]" />
                            QUICK POWER-UP ROADMAP DEPLOYMENTS:
                          </div>
                          <ul className="space-y-1.5">
                            {(log.analysis?.actionableTips || []).map((tip, idx) => (
                              <li key={idx} className="flex gap-2 text-slate-300 font-sans">
                                <span className="text-[#00ffff] font-bold select-none font-mono">[STAGE {idx + 1}]</span>
                                <span>{tip.replace(/Rebound AI|Rebound/gi, "ElevateU")}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
