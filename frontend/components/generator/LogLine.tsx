"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface LogLineProps {
  message: string;
  index: number;
}

function getLogColor(message: string): string {
  const lower = message.toLowerCase();

  // Error patterns
  if (
    message.startsWith("[ERROR]") ||
    lower.includes("❌") ||
    lower.includes("error") ||
    lower.includes("failed")
  ) {
    return "text-red-400";
  }

  // Warning / retry patterns
  if (
    lower.includes("⚠") ||
    lower.includes("warning") ||
    lower.includes("retry") ||
    lower.includes("retrying") ||
    lower.includes("fallback")
  ) {
    return "text-yellow-400";
  }

  // Success patterns
  if (
    lower.includes("✅") ||
    lower.includes("success") ||
    lower.includes("completed") ||
    lower.includes("done") ||
    lower.includes("✓")
  ) {
    return "text-emerald-400";
  }

  return "text-zinc-400";
}

export default function LogLine({ message, index }: LogLineProps) {
  const color = getLogColor(message);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
      className="flex gap-2 py-0.5"
    >
      <span className="text-zinc-600 select-none shrink-0 w-6 text-right text-[11px] leading-5">
        {index + 1}
      </span>
      <span className={cn("text-[13px] leading-5 break-all", color)}>
        {message}
      </span>
    </motion.div>
  );
}
