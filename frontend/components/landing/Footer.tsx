import { Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} README Generator</p>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <Github className="w-3.5 h-3.5" />
          GitHub
        </a>
      </div>
    </footer>
  );
}
