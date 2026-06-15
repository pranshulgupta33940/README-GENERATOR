import express, { Request, Response, NextFunction } from "express";
import { prepareClonePath } from "../utils/make-dir";
import { cloneRepo } from "../utils/clone-repo";
import path from "path";
import fs from "fs";
import { readFile } from "fs/promises";
import Repository from "../models/repository";
import mongoose from "mongoose";

const router = express.Router();
import { spawn } from "child_process";

// POST /api/generate-readme
router.post(
  "/generate-readme",
  async (req: Request, res: Response): Promise<void> => {
    let finalDestination = "";
    try {
      const { githubLink } = req.body;
      if (!githubLink) {
        res.status(400).json({ error: "Github link is required" });
        return;
      }

      // Save to MongoDB only if connected (skip in local dev without DB)
      if (mongoose.connection.readyState === 1) {
        try {
          const newRepository = new Repository({ url: githubLink });
          await newRepository.save();
        } catch (dbErr) {
          console.warn("⚠️ MongoDB save failed:", dbErr instanceof Error ? dbErr.message : dbErr);
        }
      }

      // ----- Begin streaming response immediately -----
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.flushHeaders();

      const emit = (msg: string) => {
        console.log(msg);
        res.write(`data: ${msg}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      };

      emit(`🌟 Starting README generation for: ${githubLink}`);

      // Prepare destination directory
      finalDestination = prepareClonePath(githubLink);

      emit(`📂 Cloning repository to: ${finalDestination}`);

      // Clone the repository (may take time)
      await cloneRepo(githubLink, finalDestination);

      emit(`✅ Repository cloned successfully.`);

      // Path to Python script
      const pythonScriptPath = path.resolve(
        __dirname,
        "..",
        "..",
        "python",
        "agents_groq.py"
      );

      const pythonCommand =
        process.env.NODE_ENV === "production"
          ? "python"
          : path.resolve(
              __dirname,
              "..",
              "..",
              "python",
              "venv",
              "bin",
              "python"
            );

      emit(`🐍 Running Python script: ${pythonScriptPath}`);

      const pythonProcess = spawn(
        pythonCommand,
        [pythonScriptPath, finalDestination],
        {
          cwd: path.dirname(pythonScriptPath),
          env: { ...process.env, PYTHONIOENCODING: "utf-8" },
        }
      );

      // Stream Python logs to client
      pythonProcess.stdout.on("data", (data) => {
        const message = data.toString();
        emit(`📝 ${message.trim()}`);
      });

      pythonProcess.stderr.on("data", (data) => {
        const error = data.toString();
        emit(`[ERROR] ${error}`);
      });

      pythonProcess.on("close", async (code) => {
        emit(`✅ Python process exited with code ${code}`);
        if (code === 0) {
          try {
            const readmePath = path.join(finalDestination, "readme.md");
            const readmeContent = await readFile(readmePath, "utf-8");
            emit(`[DONE] README generated successfully.`);

            // Send README content Base64-encoded so it survives SSE formatting
            const encoded = Buffer.from(readmeContent, "utf-8").toString(
              "base64"
            );
            res.write(`data: [README]${encoded}\n\n`);
            res.end();
          } catch (readErr) {
            console.error("Failed to read generated README:", readErr);
            res.write(`data: [ERROR] Failed to read README file.\n\n`);
            res.end();
          }
        } else {
          res.write(
            `data: [ERROR] Python process exited with code ${code}\n\n`
          );
          res.end();
        }
      });
    } catch (err) {
      console.error("❌ Error in README generation:", err);
      if (finalDestination && fs.existsSync(finalDestination)) {
        try {
          fs.rmSync(finalDestination, { recursive: true, force: true });
          console.log(`🧹 Cleaned up directory: ${finalDestination}`);
        } catch (cleanupErr) {
          console.error("Cleanup error:", cleanupErr);
        }
      }
      res.write(`data: [ERROR] README generation failed: ${err instanceof Error ? err.message : String(err)}\n\n`);
      res.end();
    }
  }
);

// GET /api/check-readme
router.get("/check-readme", (req: Request, res: Response): void => {
  const folder = req.query.folder as string;

  if (!folder) {
    console.log("❌ check-readme: Missing folder name");
    res.status(400).json({ error: "Missing folder name" });
    return;
  }

  const readmePath = path.join(
    __dirname,
    "..",
    "..",
    "temp",
    folder,
    "readme.md"
  );
  const exists = fs.existsSync(readmePath);

  console.log(
    `🔍 check-readme: folder=${folder}, path=${readmePath}, exists=${exists}`
  );
  res.json({ exists });
});

// GET /api/get-readme
router.get("/get-readme", (req: Request, res: Response): void => {
  const folder = req.query.folder as string;

  if (!folder) {
    console.log("❌ get-readme: Missing folder name");
    res.status(400).json({ error: "Missing folder name" });
    return;
  }

  const readmePath = path.join(
    __dirname,
    "..",
    "..",
    "temp",
    folder,
    "readme.md"
  );

  console.log(`📖 get-readme: attempting to read from ${readmePath}`);

  try {
    const content = fs.readFileSync(readmePath, "utf-8");
    console.log(
      `✅ get-readme: successfully read ${content.length} characters`
    );
    res.json({ content });
  } catch (err) {
    console.error(`❌ get-readme: failed to read file`, err);
    res.status(404).json({ error: err });
  }
});

// GET /api/get-readme/:folder
router.get(
  "/get-readme/:folder",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const folder = req.params.folder;
      const readmePath = path.join(
        __dirname,
        "..",
        "..",
        "temp",
        folder,
        "readme.md"
      );

      const content = await readFile(readmePath, "utf-8");

      res.json({ readme: content });
    } catch (error) {
      console.error("README not found:", error);
      res.status(404).json({ error: "README not found" });
    }
  }
);

export default router;
