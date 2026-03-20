// ─── Core domain types ────────────────────────────────────────────────────────

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  topics: string[];
}

export interface XProfile {
  handle: string;
  name: string;
  bio: string;
  followersCount: number | null;
  source: "api" | "manual";
}

export interface GitHubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  repos: GitHubRepo[];
  topLanguages: string[];
}

export interface UserProfile {
  x: XProfile;
  github: GitHubProfile | null;
  discoveredAt: string;
}

export interface Niche {
  niche: string;
  targetAudience: string;
  goal: string;
  contentLanguage: string;
  setAt: string;
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  duration: string;
  focus: string;
  milestones: string[];
  channels: string[];
}

export interface Roadmap {
  northStar: string;
  contentPillars: ContentPillar[];
  phases: RoadmapPhase[];
  postingFrequency: PostingFrequency;
  generatedAt: string;
}

export interface ContentPillar {
  name: string;
  description: string;
  weeklyFrequency: number;
  formats: string[];
}

export interface PostingFrequency {
  postsPerWeek: number;
  threadsPerWeek: number;
  repliesPerDay: number;
  bestTimes: string[];
}

export type TweetFormat = "thread" | "single" | "quote_tweet" | "media";

export interface ContentTopic {
  id: string;
  title: string;
  pillar: string;
  format: TweetFormat;
  rationale: string;
  approved: boolean | null;
}

export interface CalendarEntry {
  id: string;
  topicId: string;
  date: string;
  time: string;
  pillar: string;
  format: TweetFormat;
  copy: TweetCopy;
}

export interface TweetCopy {
  tweets: TweetPart[];
  charCounts: number[];
  notes: string;
}

export interface TweetPart {
  number: number;
  text: string;
}

// ─── State shape ──────────────────────────────────────────────────────────────

export interface VibeprintState {
  profile: UserProfile | null;
  niche: Niche | null;
  roadmap: Roadmap | null;
  topics: ContentTopic[];
  calendar: CalendarEntry[];
}

// ─── Tool result helpers ──────────────────────────────────────────────────────

export function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

export function err(text: string) {
  return { content: [{ type: "text" as const, text: `❌ ${text}` }], isError: true };
}
