import path from "path";
import fs from "fs";

// STEP: 1 -> get the location of the backend folder and create temp inside it
const tempDir = path.join(__dirname, "..", "..", "temp");
/**
 * __dirname is the current directory of this file (backend/src/utils)
 * Going up two levels (.., ..) gets us to the backend folder
 * Then we add 'temp' to create the temp folder inside backend
 */

// STEP: 2 -> Extract repo name from the link
const extractRepoName = (url: string): string => {
  const parts = url.split("/");
  return parts[parts.length - 1].replace(".git", "");
};

// STEP: 3 -> join both above results to form the final location to store cloned repo
export const prepareClonePath = (repoUrl: string): string => {
  // Ensure temp directory exists first
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const repoName = extractRepoName(repoUrl);

  // Use a timestamp to guarantee a fresh, unique folder for each generation run
  const uniqueSuffix = Date.now().toString();
  const repoPath = path.join(tempDir, `${repoName}-${uniqueSuffix}`);

  return repoPath;
};
