"use client";

import Image from "next/image";
import { motion } from "motion/react";

export default function StarArrowHint() {
  return (
    <div className="hidden md:flex flex-col items-center justify-start space-y-4 pointer-events-none -mt-16">
      {/* Animated arrow - moved up */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
      >
        <Image
          src="/arrow.png"
          alt="Stylish arrow pointing to GitHub star button"
          width={200}
          height={200}
          className="w-48 mb-7 h-auto -rotate-[30deg] drop-shadow-lg"
          priority
        />
      </motion.div>

      {/* Star message */}
      <div className="bg-white/90 text-gray-800 px-4 py-2 rounded-lg font-semibold text-sm shadow-lg backdrop-blur-sm max-w-xs text-center border border-rose-200">
        While your README is cooking, ⭐ star our repo!
      </div>

      {/* Waiting animation dots */}
      <div className="flex items-center space-x-1 mt-4">
        <span className="text-gray-600 text-sm">
          Generating README might take a while
        </span>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-rose-500 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
