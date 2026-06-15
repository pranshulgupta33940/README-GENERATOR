import simpleGit from "simple-git";

export const cloneRepo = async (
  repoUrl: string,
  destinationPath: string
): Promise<void> => {
  const git = simpleGit();
  await git.clone(repoUrl, destinationPath);
};
