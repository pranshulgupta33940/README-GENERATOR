"use client";

import { motion } from "motion/react";
import { GitBranch, Cpu, FileDown } from "lucide-react";

const steps = [
  {
    icon: GitBranch,
    title: "Paste your repo link",
    description:
      "Drop in any public GitHub repository URL. We clone it and scan the full codebase.",
  },
  {
    icon: Cpu,
    title: "AI analyzes your code",
    description:
      "Our LangGraph pipeline identifies key files, understands architecture, and extracts intent.",
  },
  {
    icon: FileDown,
    title: "Edit & download",
    description:
      "Review the generated README in a live preview, make edits, then copy or download it.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4 }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            How it works
          </h2>
          <p className="text-muted-foreground text-sm">
            Three steps. Zero effort.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative flex flex-col items-start p-6 rounded-xl border border-border bg-card/50"
            >
              {/* Step number */}
              <span className="absolute top-4 right-4 text-xs font-mono text-muted-foreground/40">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary mb-4">
                <step.icon className="w-5 h-5 text-foreground" />
              </div>

              <h3 className="text-sm font-semibold mb-1.5">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
