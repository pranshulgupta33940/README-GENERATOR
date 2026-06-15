"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Github, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const GITHUB_URL_REGEX =
  /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;

export default function Hero() {
  const [url, setUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();

  const isValid = GITHUB_URL_REGEX.test(url.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = url.trim().replace(/\/+$/, "");

    if (!GITHUB_URL_REGEX.test(trimmed)) {
      toast.error("Enter a valid GitHub repository URL");
      return;
    }

    setIsValidating(true);
    localStorage.setItem("githubLink", trimmed);

    // Small delay for perceived responsiveness
    setTimeout(() => {
      router.push("/generate");
    }, 150);
  };

  return (
    <section className="flex flex-col items-center justify-center px-6 pt-32 pb-20 md:pt-44 md:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center max-w-2xl"
      >
        {/* Badge */}
        <div className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-xs text-muted-foreground">
          <FileText className="w-3.5 h-3.5" />
          AI-Powered Documentation
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
          Your code deserves
          <br />
          <span className="text-muted-foreground">a better README.</span>
        </h1>

        {/* Subheading */}
        <p className="text-base md:text-lg text-muted-foreground max-w-md mb-10">
          Drop a GitHub link. Get a professional, comprehensive README
          generated in seconds — not hours.
        </p>

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="github-url-input"
              type="url"
              placeholder="https://github.com/username/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10 h-11 bg-secondary/30 border-border text-sm"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <Button
            id="generate-btn"
            type="submit"
            size="lg"
            disabled={!isValid || isValidating}
            className="h-11 px-6 font-medium"
          >
            {isValidating ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Starting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Generate
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>

        {/* Hint */}
        <p className="mt-4 text-xs text-muted-foreground/60">
          Works with any public GitHub repository
        </p>
      </motion.div>
    </section>
  );
}
