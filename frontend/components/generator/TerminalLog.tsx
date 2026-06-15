"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import LogLine from "./LogLine";

interface TerminalLogProps {
  logs: string[];
  isGenerating: boolean;
}

export default function TerminalLog({ logs, isGenerating }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-[oklch(0.08_0_0)] overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-[oklch(0.1_0_0)]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex items-center gap-1.5 ml-3 text-xs text-muted-foreground">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-mono">build log</span>
        </div>

        {/* Pulsing indicator */}
        {isGenerating && (
          <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span className="font-mono">running</span>
          </div>
        )}
        {!isGenerating && logs.length > 0 && (
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="font-mono">done</span>
          </div>
        )}
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 font-mono terminal-scrollbar"
      >
        {logs.length === 0 && isGenerating && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-dot" />
            Connecting to server...
          </div>
        )}

        {logs.map((log, i) => (
          <LogLine key={`${i}-${log.slice(0, 20)}`} message={log} index={i} />
        ))}
      </div>
    </div>
  );
}
