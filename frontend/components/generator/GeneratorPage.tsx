"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/config";
import TerminalLog from "./TerminalLog";
import ReadmeOutput from "./ReadmeOutput";
import toast from "react-hot-toast";

type Status = "idle" | "generating" | "completed" | "error";

export default function GeneratorPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);
  const [readmeContent, setReadmeContent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const hasStarted = useRef(false);

  const startGeneration = useCallback(
    async (githubLink: string) => {
      setStatus("generating");
      setLogs([]);
      setReadmeContent("");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`${API_BASE_URL}/api/generate-readme`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubLink }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body received");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          parts.forEach((chunk) => {
            const data = chunk.replace(/^data:\s*/, "").trim();
            if (!data) return;

            if (data.startsWith("[README]")) {
              const base64 = data.replace("[README]", "");
              try {
                const binary = window.atob(base64);
                const bytes = Uint8Array.from(binary, (c) =>
                  c.charCodeAt(0)
                );
                const decoded = new TextDecoder("utf-8").decode(bytes);
                setReadmeContent(decoded);
              } catch {
                setLogs((prev) => [
                  ...prev,
                  "❌ Failed to decode README content",
                ]);
                toast.error("Failed to decode README content");
              }
            } else if (data.startsWith("[ERROR]")) {
              const errorMsg = data.replace("[ERROR]", "").trim();
              setLogs((prev) => [...prev, `❌ ${errorMsg}`]);
              toast.error(errorMsg || "An error occurred during generation");
            } else if (data.startsWith("[DONE]")) {
              setStatus("completed");
              setLogs((prev) => [...prev, "✅ README generation complete"]);
            } else {
              setLogs((prev) => [...prev, data]);
            }
          });
        }

        // If stream ended without explicit [DONE], check if we actually got content
        setStatus((prev) => {
          if (prev === "generating") {
            // Stream ended while still generating — likely backend crashed
            setReadmeContent((content) => {
              if (!content) {
                setLogs((prevLogs) => [
                  ...prevLogs,
                  "❌ Connection lost — the server may have run out of memory. Try a smaller repository.",
                ]);
                toast.error(
                  "Connection lost. The repository may be too large for the server."
                );
                return content;
              }
              return content;
            });
            return "error";
          }
          return prev;
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;

        const message =
          err instanceof Error ? err.message : "Connection failed";
        setLogs((prev) => [...prev, `❌ ${message}`]);
        setStatus("error");
        toast.error(message);
      }
    },
    []
  );

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const githubLink = localStorage.getItem("githubLink");
    if (!githubLink) {
      toast.error("No repository URL found");
      router.push("/");
      return;
    }

    startGeneration(githubLink);

    return () => {
      hasStarted.current = false;
      abortRef.current?.abort();
    };
  }, [startGeneration, router]);

  const handleRegenerate = useCallback(() => {
    abortRef.current?.abort();
    localStorage.removeItem("githubLink");
    router.push("/");
  }, [router]);

  const repoUrl = typeof window !== "undefined"
    ? localStorage.getItem("githubLink")
    : null;
  const repoName = repoUrl
    ? repoUrl.replace("https://github.com/", "")
    : "repository";

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0"
      >
        <div className="flex items-center gap-3">
          <Button
            id="back-btn"
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            className="h-8 text-xs gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <span className="hidden sm:block text-xs text-muted-foreground font-mono truncate max-w-[300px]">
            {repoName}
          </span>
        </div>

        {status === "generating" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
            Generating...
          </div>
        )}
        {status === "completed" && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Complete
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Error
          </div>
        )}
      </motion.div>

      {/* Main split panes */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left panel — terminal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:w-1/2 h-[45vh] lg:h-full p-3 lg:p-4 shrink-0"
        >
          <TerminalLog
            logs={logs}
            isGenerating={status === "generating"}
          />
        </motion.div>

        {/* Right panel — readme output */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="lg:w-1/2 flex-1 lg:h-full p-3 lg:p-4 lg:pl-0"
        >
          <ReadmeOutput
            content={readmeContent}
            isGenerating={status === "generating"}
            onRegenerate={handleRegenerate}
          />
        </motion.div>
      </div>
    </div>
  );
}
