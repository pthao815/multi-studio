const ASSEMBLYAI_BASE = "https://api.assemblyai.com/v2";

const headers = {
  authorization: process.env.ASSEMBLYAI_API_KEY!,
  "content-type": "application/json",
};

/**
 * Submit a signed audio URL to AssemblyAI for transcription.
 * Returns the transcript ID. Does NOT poll — polling is done by the client (DEC-02).
 */
export async function submitTranscriptionJob(signedUrl: string): Promise<string> {
  const res = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
    method: "POST",
    headers,
    body: JSON.stringify({ audio_url: signedUrl, speech_models: ["universal-2"] }),
  });

  if (!res.ok) {
    throw new Error(`AssemblyAI submit failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.id as string;
}

/**
 * Single status check for a transcript — called once per client poll (DEC-02).
 * Returns status and text (only present when completed).
 */
export async function getTranscriptionStatus(
  transcriptId: string
): Promise<{ status: string; text?: string }> {
  const res = await fetch(`${ASSEMBLYAI_BASE}/transcript/${transcriptId}`, { headers });

  if (!res.ok) {
    throw new Error(`AssemblyAI status check failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    status: data.status,
    ...(data.status === "completed" && { text: data.text as string }),
  };
}
