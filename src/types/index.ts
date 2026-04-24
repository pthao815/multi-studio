// ─── Enums ────────────────────────────────────────────────────────────────────

export type SourceType = "url" | "text" | "audio";

export type GenerationStatus = "pending" | "processing" | "done" | "failed";

export type ChannelType =
  | "facebook"
  | "tiktok"
  | "instagram"
  | "linkedin"
  | "twitter";

export type BrandVoice = "energetic" | "educational" | "funny" | "calm";

export type ScheduleStatus = "scheduled" | "pending" | "sent" | "cancelled";

// ─── Appwrite Document Types ──────────────────────────────────────────────────

export interface Profile {
  $id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  brandVoice: BrandVoice;
  brandKeywords: string[];
  createdAt: string;
}

export interface Project {
  $id: string;
  userId: string;
  title: string;
  sourceType: SourceType;
  sourceContent: string;
  audioFileId?: string;
  transcription?: string;
  status: GenerationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Output {
  $id: string;
  projectId: string;
  userId: string;
  channel: ChannelType;
  content: string;
  imagePrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  $id: string;
  outputId: string;
  userId: string;
  platform: ChannelType;
  scheduledAt: string;
  status: ScheduleStatus;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  message: string;
}

export interface ScrapeResult {
  title: string;
  content: string;
}

export interface TranscribeResult {
  transcriptId: string;
  status: "queued" | "processing" | "completed" | "error";
  text?: string;
  error?: string;
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export interface ProjectWithOutputs extends Project {
  outputs: Output[];
}
