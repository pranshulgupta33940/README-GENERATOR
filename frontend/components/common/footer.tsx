import { Github, Linkedin, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-rose-100 bg-white/80 backdrop-blur-sm py-6 mt-16 ">
      <div className="max-w-4xl mx-auto px-4 flex justify-between flex-col-reverse gap-4 md:flex-row-reverse items-center md:gap-2 ">
        <div className="flex gap-4 mb-1">
          <a
            href="https://github.com/LakshitAgarwal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-rose-400 transition-colors"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/lakshit-agarwal-6082b9216/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-rose-400 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
          </a>
          <a
            href="https://x.com/lakshitagarwal7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-rose-400 transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="h-5 w-5" />
          </a>
        </div>
        <div className="text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Readme.ai &mdash; All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
