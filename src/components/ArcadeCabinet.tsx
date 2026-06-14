import React, { useState } from "react";
import { isMuted, playCoinSound, playClickSound, toggleSound } from "../utils/audio";
import { Volume2, VolumeX, Shield, Gamepad2, Stars } from "lucide-react";

interface CabinetProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  displayName?: string;
  xp?: number;
  streak?: number;
  level?: number;
  goal?: string;
}

export function ArcadeCabinet({ children, user, onLogout, displayName, xp = 0, streak = 0, level = 1, goal = "Improve CGPA" }: CabinetProps) {
  const [muted, setMuted] = useState(isMuted());
  const [scanlines, setScanlines] = useState(true);

  const handleMuteToggle = () => {
    const isNowMuted = toggleSound();
    setMuted(isNowMuted);
    playClickSound();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-neutral-100 flex flex-col font-sans relative overflow-hidden selection:bg-[#ff00ff] selection:text-white border-8 border-[#1e293b]">
      {/* Background Pixel Space Stars */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#00ffff_0.5px,transparent_1.5px)] [background-size:32px_32px] opacity-15 pointer-events-none" />

      {/* Retro Header / Cabinet Marquee */}
      <header className="border-b-4 border-[#ff00ff] bg-[#0f172a] shadow-[0_4px_0_0_#4a044e] z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff00ff] border-2 border-white flex items-center justify-center shadow-[2px_2px_0_0_#ffffff] shrink-0">
              <span className="text-2xl font-black italic text-black">E</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] to-[#00ffff] uppercase italic filter">
                ElevateU
              </h1>
              <div className="text-[10px] text-slate-400 tracking-wider uppercase flex items-center gap-1 font-mono">
                <Shield className="w-3 h-3 text-[#00ffff]" /> PIXEL GUARDIANS v1.0
              </div>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          {user && (
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 bg-[#1e293b]/70 border-2 border-slate-700 px-4 py-2 rounded-lg text-xs">
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase text-[#00ffff] font-bold">MONIKER</span>
                <span className="font-extrabold text-white uppercase tracking-wider">{displayName || "PLAYER_01"}</span>
              </div>
              <div className="h-6 w-[2px] bg-slate-700/80 hidden sm:block" />
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase text-yellow-400 font-bold">LVL {level}</span>
                <span className="font-extrabold text-[#ff00ff] uppercase tracking-wider truncate max-w-[80px]">
                  {goal.split(" ")[0]}
                </span>
              </div>
              <div className="h-6 w-[2px] bg-slate-700/80 hidden sm:block" />
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase text-[#ff00ff] font-bold">TOTAL XP</span>
                <span className="font-black text-white flex items-center gap-1">
                  <Stars className="w-3 h-3 text-[#ff00ff] animate-spin" />
                  {xp}
                </span>
              </div>
              <div className="h-6 w-[2px] bg-slate-700/80 hidden sm:block" />
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase text-orange-400 font-bold">STREAK</span>
                <span className="font-black text-white flex items-center gap-1 animate-pulse">
                  🔥 {streak} DAYS
                </span>
              </div>
            </div>
          )}

          {/* Utility Box */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setScanlines(!scanlines);
                playClickSound();
              }}
              className={`px-3 py-1 text-[10px] font-black border-2 rounded transition-all duration-150 uppercase active:translate-y-0.5 ${
                scanlines 
                  ? "bg-cyan-950/40 text-[#00ffff] border-[#00ffff] shadow-[0_0_8px_rgba(0,255,255,0.3)]" 
                  : "bg-slate-900 text-slate-500 border-slate-700"
              }`}
            >
              CRT SCANLINE: {scanlines ? "ON" : "OFF"}
            </button>

            <button
              onClick={handleMuteToggle}
              className="p-1.5 border-2 border-slate-750 bg-[#1e293b] rounded text-slate-400 hover:text-white transition-colors duration-150 active:translate-y-0.5"
              title={muted ? "Unmute" : "Mute Sound FX"}
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {user && (
              <button
                onClick={() => {
                  playBuzzerSound();
                  onLogout();
                }}
                className="px-3 py-1 text-[10px] font-black border-2 border-[#ff00ff] bg-slate-900 text-[#ff00ff] rounded hover:bg-magenta-950/20 active:translate-y-0.5 transition-colors duration-150 uppercase"
              >
                QUIT GAME
              </button>
            )}
          </div>

        </div>
      </header>

      {/* CRT Display Panel Frame */}
      <main className="flex-1 flex flex-col relative z-10 p-4 max-w-7xl w-full mx-auto">
        <div className={`flex-1 flex flex-col rounded-xl border-4 border-slate-800 bg-[#020617] overflow-hidden relative ${
          scanlines ? "before:absolute before:inset-0 before:bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.18)_50%)] before:bg-[length:100%_4px] before:pointer-events-none before:z-50" : ""
        }`}>
          {children}
        </div>
      </main>

      {/* Footer Branding credits */}
      <footer className="py-4 text-center text-[10px] text-slate-500 border-t border-slate-900 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center px-6 gap-2">
          <p>© 2026 ELEVATEU UNIT // CHIP-8 VIRTUAL INTERACTIVE COMEBACK SUITE</p>
          <p className="text-[#00ffff] font-black uppercase tracking-wider animate-pulse">
            ENG: PIXEL GUARDIANS DEPLOYMENT CORE
          </p>
        </div>
      </footer>
    </div>
  );
}

// Quick Audio fail hook for Cabinet logout
function playBuzzerSound() {
  try {
    const ctx = typeof window !== "undefined" ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;
    if (ctx) {
      if (isMuted()) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch(e){}
}
