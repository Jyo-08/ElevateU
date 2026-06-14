import React, { useState } from "react";
import { AcademicTask, StudentProfile } from "../types";
import { playCoinSound, playPowerUp, playClickSound } from "../utils/audio";
import { CheckSquare, Square, Plus, Trash2, Calendar, BookOpen, Clock, Award, ShieldCheck, FlameKindling, RefreshCw } from "lucide-react";

interface QuestBoardProps {
  tasks: AcademicTask[];
  onToggleTask: (taskId: string, isChecked: boolean, xpReward: number) => Promise<void>;
  onAddTask: (title: string, category: AcademicTask["category"], xpReward: number) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onGenerateAIPlan: () => void;
  generatingPlan?: boolean;
  profile?: StudentProfile;
}

export function QuestBoard({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onGenerateAIPlan,
  generatingPlan = false,
  profile,
}: QuestBoardProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<AcademicTask["category"]>("habit");
  const [rewardIdx, setRewardIdx] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);

  const rewards = [50, 80, 100, 150];

  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    playCoinSound();
    await onAddTask(newTitle.trim(), newCategory, rewards[rewardIdx]);
    setNewTitle("");
    setIsAdding(false);
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const completedCount = safeTasks.filter((t) => t && t.done).length;
  const totalCount = safeTasks.length;
  const progressRatio = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getCategoryIcon = (cat: AcademicTask["category"]) => {
    switch (cat) {
      case "attendance":
        return <Calendar className="w-4 h-4 text-cyan-400" />;
      case "backlog":
        return <BookOpen className="w-4 h-4 text-red-400" />;
      case "exam":
        return <Award className="w-4 h-4 text-yellow-400" />;
      case "assignment":
        return <Clock className="w-4 h-4 text-pink-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="border-4 border-[#ff00ff] bg-[#0f172a] rounded p-6 shadow-[6px_6px_0_0_#4a044e] flex flex-col h-[520px]">
      
      {/* progress come-back meter */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2.5 font-mono">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <FlameKindling className="w-4 h-4 text-[#ff00ff] animate-pulse" />
            Active Comeback Progress Meter
          </h3>
          <span className="text-xs font-bold text-[#00ffff] bg-[#020617] px-2.5 py-0.5 border border-slate-800 rounded select-none">
            LEVEL COMPLETION: {progressRatio}% {profile && `| CGPA ${profile.cgpa.toFixed(2)}`}
          </span>
        </div>

        {/* Progress bar container */}
        <div className="w-full h-5 bg-[#020617] border-2 border-slate-700 rounded overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#ff00ff] via-purple-600 to-[#00ffff] rounded-sm shadow-[0_0_8px_rgba(255,0,255,0.5)] transition-all duration-300"
            style={{ width: `${progressRatio || 2}%` }}
          />
        </div>

        {/* Dynamic status badges under the bar and multipliers */}
        {profile && (
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mt-1.5 uppercase leading-none select-none">
            <span>Core Vector Status: <span className={profile.cgpa >= 8.0 ? 'text-[#00ffff] font-black' : profile.cgpa >= 6.5 ? 'text-yellow-400 font-bold' : 'text-red-500 font-extrabold animate-pulse'}>{profile.cgpa >= 8.0 ? "ALPHA_EXEC" : profile.cgpa >= 6.5 ? "STANDARD_RUN" : "RECOVERY_ALERT_LOW_CGPA"}</span></span>
            <span>Multiplier: <span className="text-[#ff00ff] font-bold">{((profile.cgpa / 10) * 1.5).toFixed(2)}x</span></span>
          </div>
        )}
      </div>

      {/* Header and trigger menu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-800 pb-4 mb-4">
        <div>
          <h2 className="text-base font-black text-white uppercase tracking-tighter italic">Active Quests Log</h2>
          <p className="text-[10px] text-slate-400 uppercase mt-0.5 font-mono">
            Complete daily habits, revise backlogs, or boost attendance criteria to earn high XP rewards.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              playClickSound();
              setIsAdding(!isAdding);
            }}
            className="px-3 py-1.5 border-2 border-[#00ffff] bg-[#020617] text-[#00ffff] text-xs font-bold uppercase rounded hover:bg-[#00ffff] hover:text-black hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 shadow-[2px_2px_0_0_#0ea5e9] cursor-pointer"
          >
            {isAdding ? "CANCEL" : "+ ADD CUSTOM QUEST"}
          </button>

          <button
            onClick={() => {
              playPowerUp();
              onGenerateAIPlan();
            }}
            disabled={generatingPlan}
            className="px-3 py-1.5 border-2 border-[#ff00ff] bg-[#020617] text-[#ff00ff] text-xs font-bold uppercase rounded hover:bg-[#ff00ff] hover:text-black hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center gap-1 transition-all duration-150 shadow-[2px_2px_0_0_#4a044e] cursor-pointer font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generatingPlan ? "animate-spin" : ""}`} />
            {generatingPlan ? "GENERATING..." : "RE-BOOT AI QUIESTS"}
          </button>
        </div>
      </div>

      {isAdding && (
         <form onSubmit={handleCreateQuest} className="mb-6 p-4 border-2 border-[#00ffff] bg-[#020617] rounded space-y-4 shadow-[4px_4px_0_0_#0ea5e9]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Title */}
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-[10px] font-bold text-slate-400 uppercase">QUEST OBJECTIVE</label>
              <input
                type="text"
                placeholder="e.g. Solve 3 Backlog tutorial sheets"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-[#0f172a] border border-[#ff00ff]/40 rounded px-2.5 py-1.5 text-xs text-[#00ffff] focus:outline-none focus:border-[#00ffff] uppercase font-mono font-bold placeholder-slate-650"
                required
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-[10px] font-bold text-slate-400 uppercase">SYSTEM CATEGORY</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as AcademicTask["category"])}
                className="bg-[#0f172a] border border-[#ff00ff]/40 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ffff] uppercase font-mono"
              >
                <option value="habit">DAILY HABIT (BOOST ROUTINE)</option>
                {(!profile || profile.backlogs > 0) && (
                  <option value="backlog">BACKLOG REVISE (CLEAR LEVEL)</option>
                )}
                <option value="attendance">ATTENDANCE BOOST (PARTICIPATE)</option>
                <option value="exam">EXAM REVISION (CRITICAL DUNGEON)</option>
                <option value="assignment">ASSIGNMENT (SUBMIT OBJECTIVE)</option>
              </select>
            </div>

            {/* XP reward selectors */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">XP REWARD DIFFICULTY</label>
              <div className="flex gap-2">
                {rewards.map((r, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRewardIdx(idx);
                      playClickSound();
                    }}
                    className={`flex-1 py-1.5 border text-xs font-extrabold rounded ${
                      rewardIdx === idx
                        ? "bg-cyan-500 border-cyan-400 text-black shadow-inner"
                        : "bg-neutral-900 border-neutral-700 text-neutral-400"
                    }`}
                  >
                    +{r}XP
                  </button>
                ))}
              </div>
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-[#ff00ff] to-[#01ffff] hover:scale-[1.01] text-black font-black text-xs uppercase rounded cursor-pointer transition-all duration-150 shadow-[2px_2px_0_0_#ffffff] border-2 border-white"
          >
            EXECUTE: DEPLOY NEW STAGE OBJECTIVE
          </button>
        </form>
      )}

      {/* Quest items list container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 mt-2">
        {safeTasks.length === 0 ? (
          <div className="text-center py-10 bg-[#020617] border-2 border-dashed border-[#ff00ff]/30 rounded">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
              QUEST LOG VOID. PLEASE TAP "RE-BOOT AI QUIESTS" TO LOAD AI COMEBACK TASKS.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {safeTasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 border-2 rounded flex items-center justify-between transition-all duration-150 font-mono ${
                  task.done
                    ? "bg-[#020617]/50 text-slate-500 border-slate-900"
                    : "bg-[#020617] text-white border-slate-800 hover:border-[#ff00ff]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!task.done) {
                        playCoinSound();
                      } else {
                        playClickSound();
                      }
                      onToggleTask(task.id, !task.done, task.xpReward);
                    }}
                    className="p-1 hover:text-white cursor-pointer active:scale-90"
                    title={task.done ? "Mark Uncompleted" : "Complete Quest!"}
                  >
                    {task.done ? (
                      <CheckSquare className="w-5 h-5 text-[#00ffff]" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500 hover:text-[#ff00ff]" />
                    )}
                  </button>

                  <div>
                    <div className={`text-xs uppercase font-extrabold flex items-center gap-1.5 ${task.done ? "line-through text-slate-655" : ""}`}>
                      {getCategoryIcon(task.category)}
                      <span>{task.title}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase mt-1 flex items-center gap-2">
                      <span className="bg-[#0f172a] px-1.5 py-0.5 border border-slate-800 rounded text-[8px]">
                        {task.category}
                      </span>
                      <span className="text-[#00ffff] font-extrabold bg-[#0f172a] px-1 py-0.5 rounded border border-[#ff00ff]/20">
                        +{task.xpReward} XP REWARD
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playClickSound();
                    onDeleteTask(task.id);
                  }}
                  className="text-slate-500 hover:text-rose-500 transition-colors duration-150 p-1 rounded hover:bg-slate-800"
                  title="Delete Quest"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
