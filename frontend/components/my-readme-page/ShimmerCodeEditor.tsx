"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={cn("w-6 h-6", className)}
  >
    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const CheckFilled = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn("w-6 h-6", className)}
  >
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
      clipRule="evenodd"
    />
  </svg>
);

const loadingStates = [
  { text: "Identifying project folder..." },
  { text: "Checking for README file..." },
  { text: "Generating README with AI..." },
  { text: "Formatting markdown..." },
  { text: "Preparing code editor..." },
];

export default function ShimmerCodeEditor() {
  const [loading] = useState(true);
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }

    const timeout = setTimeout(() => {
      setCurrentState((prevState) => prevState + 1);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [currentState, loading]);

  return (
    <div className="min-h-screen flex mt-14 justify-center px-4 text-gray-800">
      <div className="w-full max-w-xl ">
        {/* Heading */}
        <div className="text-center mb-">
          <motion.h1
            className="text-4xl font-bold text-slate-700"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            📄 Crafting Your README
          </motion.h1>

          <motion.p
            className="mt-3 text-base text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Generation might take 2-3 minutes — your README is being carefully
            crafted
          </motion.p>

          <motion.div
            className="mt-6 flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="flex space-x-1 justify-center">
              <motion.div
                className="w-1.5 h-1.5 bg-rose-200 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-1.5 h-1.5 bg-rose-300 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
              <motion.div
                className="w-1.5 h-1.5 bg-rose-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              />
            </div>
          </motion.div>
        </div>

        <div className="relative h-64 w-full max-w-md pl-28 mx-auto overflow-hidden">
          {(() => {
            const extendedSteps = [];
            const visibleStepCount = 6;

            for (let i = -1; i < visibleStepCount; i++) {
              const stepIndex = (currentState + i) % loadingStates.length;
              extendedSteps.push({
                ...loadingStates[stepIndex],
                displayIndex: currentState + i,
                originalIndex: stepIndex,
                position: i,
              });
            }

            return extendedSteps.map((step) => {
              const position = step.position;
              const opacity =
                position === -1
                  ? 0.4
                  : position === 0
                  ? 1
                  : Math.max(1 - position * 0.3, 0);
              const isVisible = position >= -1 && position <= 3;

              if (!isVisible) return null;

              return (
                <motion.div
                  key={step.displayIndex}
                  className="absolute w-full flex gap-3 items-center px-2 py-2"
                  initial={{ opacity: 0, y: 80 }}
                  animate={{
                    opacity: opacity,
                    y: position * 50 + 80,
                    scale: position === 0 ? 1.05 : 1,
                  }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <div className="flex-shrink-0">
                    {position === -1 || position === 0 ? (
                      <CheckFilled
                        className={cn(
                          position === -1 ? "text-rose-300" : "text-rose-500"
                        )}
                      />
                    ) : (
                      <CheckIcon className="text-slate-300" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm transition-all duration-300",
                      position === -1
                        ? "text-slate-400 font-normal opacity-60"
                        : position === 0
                        ? "text-rose-400 font-medium"
                        : "text-slate-400"
                    )}
                  >
                    {step.text}
                  </span>
                </motion.div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
