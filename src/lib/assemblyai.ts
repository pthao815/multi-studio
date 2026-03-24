const ASSEMBLYAI_BASE = "https://api.assemblyai.com/v2";

const headers = {
  authorization: process.env.ASSEMBLYAI_API_KEY!,
  "content-type": "application/json",
};

/**
 * Submit a publicly accessible audio URL for transcription.
 * Returns the transcript ID.
 */
export async function submitTranscription(audioUrl: string): Promise<string> {
  const res = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
    method: "POST",
    headers,
    body: JSON.stringify({ audio_url: audioUrl }),
  });

  if (!res.ok) {
    throw new Error(`AssemblyAI submit failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.id as string;
}

/**
 * Poll AssemblyAI for transcript status.
 * Returns the transcript text when complete, or throws on error.
 */
export async function pollTranscription(transcriptId: string): Promise<string> {
  const maxAttempts = 60; // up to ~5 minutes
  const delay = 5000; // 5s between polls

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${ASSEMBLYAI_BASE}/transcript/${transcriptId}`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`AssemblyAI poll failed: ${res.status}`);
    }

    const data = await res.json();

    if (data.status === "completed") {
      return data.text as string;
    }

    if (data.status === "error") {
      throw new Error(`AssemblyAI transcription error: ${data.error}`);
    }

    // Still processing — wait before next poll
    await new Promise((r) => setTimeout(r, delay));
  }

  throw new Error("AssemblyAI transcription timed out");
}
