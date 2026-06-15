"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Copy,
  Download,
  RotateCcw,
  Eye,
  Code2,
  Check,
  Pencil,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";

type Tab = "preview" | "raw";

interface ReadmeOutputProps {
  content: string;
  isGenerating: boolean;
  onRegenerate: () => void;
}

export default function ReadmeOutput({
  content,
  isGenerating,
  onRegenerate,
}: ReadmeOutputProps) {
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [isEditable, setIsEditable] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [copied, setCopied] = useState(false);

  const currentContent = isEditable && editedContent ? editedContent : content;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [currentContent]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([currentContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded README.md");
  }, [currentContent]);

  const handleToggleEdit = useCallback(() => {
    if (!isEditable) {
      setEditedContent(content);
    }
    setIsEditable((prev) => !prev);
  }, [isEditable, content]);

  // Skeleton while generating
  if (isGenerating || !content) {
    return (
      <div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="h-4 w-20 rounded animate-shimmer" />
          <div className="h-4 w-24 rounded animate-shimmer" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="h-6 w-3/4 rounded animate-shimmer" />
          <div className="h-4 w-full rounded animate-shimmer" />
          <div className="h-4 w-5/6 rounded animate-shimmer" />
          <div className="h-4 w-2/3 rounded animate-shimmer" />
          <div className="h-20 w-full rounded animate-shimmer mt-4" />
          <div className="h-4 w-4/5 rounded animate-shimmer" />
          <div className="h-4 w-3/5 rounded animate-shimmer" />
          <div className="h-4 w-full rounded animate-shimmer" />
          <div className="h-4 w-2/3 rounded animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden">
      {/* Header with tabs and actions */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            id="tab-preview"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "preview"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            id="tab-raw"
            onClick={() => setActiveTab("raw")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "raw"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Raw Markdown
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {activeTab === "raw" && (
            <Button
              id="toggle-edit-btn"
              variant="ghost"
              size="sm"
              onClick={handleToggleEdit}
              className="h-7 text-xs gap-1.5"
            >
              {isEditable ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Lock
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </>
              )}
            </Button>
          )}
          <Button
            id="copy-btn"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </Button>
          <Button
            id="download-btn"
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-7 text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
          <Button
            id="regenerate-btn"
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            className="h-7 text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "preview" ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto p-6 terminal-scrollbar"
            >
              <div className="prose-readme max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {currentContent}
                </ReactMarkdown>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="raw"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={currentContent}
                onChange={(value) => {
                  if (isEditable && value !== undefined) {
                    setEditedContent(value);
                  }
                }}
                options={{
                  readOnly: !isEditable,
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineNumbers: "on",
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  padding: { top: 16 },
                  renderLineHighlight: "none",
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                  },
                }}
                theme="vs-dark"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
