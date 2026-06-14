import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, StudentProfile } from "../types";
import { playClickSound, playPowerUp } from "../utils/audio";
import { Send, Gamepad2, Stars, Bot, User, Cpu, Sparkles, RefreshCw } from "lucide-react";
import { Markdown } from "./Markdown";

interface ChatProps {
  profile: StudentProfile;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  loading?: boolean;
  onResetChat?: () => void;
}

export function AICoachChat({
  profile,
  messages,
  onSendMessage,
  loading = false,
  onResetChat,
}: ChatProps) {
  const [inputText, setInputText] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    if (!chatContainerRef.current) return;

    if (messages.length > prevMessagesLength.current) {
      // A new message arrived
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        // AI responded - scroll to the top of the AI's message
        // Find the last message element
        const chatContainer = chatContainerRef.current;
        const messageElements = chatContainer.children;
        // The last child in chatContainer is either the typing indicator or the last message
        // Wait, if not loading, the last child should be the actual message.
        // Let's scroll into view the latest coach message. 
        if (messageElements.length > 0) {
           const targetElement = chatContainer.querySelector(`#msg-${messages.length - 1}`);
           if (targetElement) {
              targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
           }
        }
      } else {
        // User just sent a message - scroll to bottom
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    } else if (loading) {
      // When loading starts, scroll to bottom to show the loading indicator
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    
    prevMessagesLength.current = messages.length;
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const textToSend = inputText.trim();
    setInputText("");
    playClickSound();

    try {
      await onSendMessage(textToSend);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="border-4 border-[#ff00ff] bg-[#0f172a] rounded p-6 shadow-[6px_6px_0_0_#4a044e] flex flex-col h-[520px]">
      
      {/* terminal Header bar with coach status */}
      <div className="flex justify-between items-center border-b-2 border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border-2 border-[#00ffff] bg-cyan-950/40 flex items-center justify-center animate-pulse">
            <Cpu className="w-4 h-4 text-[#00ffff]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 italic">
              COACH CORE-DX_
              <span className="text-[8px] bg-[#00ffff]/20 text-[#00ffff] px-1.5 py-0.5 rounded border border-[#00ffff]/30 font-bold animate-pulse">
                ONLINE
              </span>
            </h3>
            <p className="text-[9px] text-[#ff00ff] uppercase font-black font-mono">
              Pixel Guardians Recovery Unit
            </p>
          </div>
        </div>
 
        {onResetChat && (
          <button
            onClick={() => {
              playClickSound();
              onResetChat();
            }}
            className="px-2.5 py-1 text-[9px] font-bold border-2 border-[#ff00ff]/50 bg-[#020617] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black rounded uppercase transition-colors font-mono cursor-pointer"
            title="Reset Terminal context log"
          >
            Clear Dialogue Buffer
          </button>
        )}
      </div>

      {/* dialog message grid area */}
      <div
        ref={chatContainerRef}
        className="flex-1 bg-[#020617] rounded border-2 border-slate-800 p-4 overflow-y-auto space-y-4 font-mono text-xs overflow-x-hidden relative flex flex-col scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-6 text-slate-550">
            <div className="w-12 h-12 border border-dashed border-[#00ffff]/40 flex items-center justify-center mb-3 text-[#00ffff] rounded">
              <Bot className="w-6 h-6" />
            </div>
            <p className="text-xs uppercase font-black text-[#ff00ff] mb-1 leading-relaxed italic">
              [ INSERT COIN FOR COACHING SYSTEM ]
            </p>
            <p className="text-[9px] uppercase max-w-sm text-slate-400">
              I am Coach Core-DX. Ask me anything to assist your comeback: how to master tough backlogs, request attendance hacks, or boost daily study cycles!
            </p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              id={`msg-${idx}`}
              className={`flex gap-3 max-w-[90%] ${
                m.role === m.role && m.role === "user" ? "self-end flex-row-reverse" : "self-start"
              }`}
            >
              {/* Avatar unit */}
              <div
                className={`w-7 h-7 flex-shrink-0 border-2 rounded-full flex items-center justify-center ${
                  m.role === "user"
                    ? "bg-pink-950/20 border-[#ff00ff] text-[#ff00ff]"
                    : "bg-cyan-950/20 border-[#00ffff] text-[#00ffff]"
                }`}
              >
                {m.role === "user" ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Message speech bubble block */}
              <div
                className={`p-3 rounded border-2 ${
                  m.role === "user"
                    ? "bg-[#ff00ff]/5 border-[#ff00ff]/40 text-pink-100"
                    : "bg-[#0f172a] border-slate-800 text-slate-100"
                }`}
              >
                <div className="text-[8px] font-black uppercase text-slate-500 mb-1 flex items-center justify-between gap-4">
                  <span>{m.role === "user" ? "STUDENT_LOG" : "COACH_CORE_REASON"}</span>
                  <span>{m.timestamp}</span>
                </div>
                
                {/* Content text block with simple paragraphs support */}
                <div className="font-sans leading-relaxed text-xs">
                  <Markdown text={m.content.replace(/Rebound AI|Rebound/gi, "ElevateU")} />
                </div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="self-start flex gap-3 items-center max-w-[80%] font-mono">
            <div className="w-7 h-7 rounded-full border-2 border-[#00ffff] bg-cyan-950/40 flex items-center justify-center animate-spin">
              <RefreshCw className="w-3.5 h-3.5 text-[#00ffff]" />
            </div>
            <div className="bg-[#0f172a] border-2 border-slate-800 p-2 text-[10px] text-[#00ffff] font-extrabold uppercase animate-pulse rounded">
              COACH IS COMPUTING COMEBACK SEQUENCE...
            </div>
          </div>
        )}
      </div>

      {/* Input container */}
      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="SEND INSTRUCTIONS TO COACH COR-DX..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 bg-[#020617] border-2 border-slate-800 rounded px-3 py-2 text-xs text-[#00ffff] font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#00ffff] uppercase font-bold"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-4 bg-gradient-to-r from-[#ff00ff] to-[#01ffff] text-black font-black uppercase text-xs flex items-center justify-center gap-1.5 rounded disabled:opacity-50 shadow-[2px_2px_0_0_#ffffff] border border-white hover:scale-[1.02] active:translate-y-0.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>FIRE</span>
        </button>
      </form>

    </div>
  );
}
