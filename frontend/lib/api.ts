import { API_BASE_URL } from "./config";

export const generateReadme = (
  githubLink: string,
  onMessage: (data: string) => void,
  onError: (error: string) => void
) => {
  const eventSource = new EventSource(`${API_BASE_URL}/api/generate-readme`);

  // Send POST body (fallback since EventSource doesn’t allow POST natively)
  fetch(`${API_BASE_URL}/api/generate-readme`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ githubLink }),
  }).catch((err) => {
    console.error("❌ Failed to initiate generation:", err);
    onError("Failed to start README generation.");
    eventSource.close();
  });

  eventSource.onmessage = (event) => {
    const message = event.data;
    console.log("📥 Server sent:", message);
    onMessage(message);
  };

  eventSource.onerror = (error) => {
    console.error("❌ SSE error:", error);
    onError("Connection to server lost.");
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
};

/**
 * Fetch generated README from backend
 */
export const getReadme = async (folder: string): Promise<string> => {
  const res = await fetch(
    `${API_BASE_URL}/api/get-readme?folder=${encodeURIComponent(folder)}`
  );
  if (!res.ok) throw new Error("Failed to fetch README");
  const data = await res.json();
  return data.content;
};
