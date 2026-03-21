import { z } from "zod";

// Validates LLM output before writing to state, and state on load.

const tweetFormatSchema = z.enum(["thread", "single", "quote_tweet", "media"]);

export const roadmapSchema = z.object({
  northStar: z.string().min(1).max(500),
  contentPillars: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500),
    weeklyFrequency: z.number().int().min(0).max(50),
    formats: z.array(z.string().max(50)),
  })).min(1).max(10),
  phases: z.array(z.object({
    phase: z.number().int().min(1),
    title: z.string().min(1).max(200),
    duration: z.string().max(100),
    focus: z.string().max(500),
    milestones: z.array(z.string().max(200)),
    channels: z.array(z.string().max(100)),
  })).min(1).max(10),
  postingFrequency: z.object({
    postsPerWeek: z.number().int().min(0).max(100),
    threadsPerWeek: z.number().int().min(0).max(50),
    repliesPerDay: z.number().int().min(0).max(100),
    bestTimes: z.array(z.string().max(50)),
  }),
  generatedAt: z.string().optional(),
});

export const contentTopicSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().min(1).max(300),
  pillar: z.string().min(1).max(100),
  format: tweetFormatSchema,
  rationale: z.string().max(500),
  approved: z.boolean().nullable(),
});

export const calendarEntrySchema = z.object({
  id: z.string().min(1).max(50),
  topicId: z.string().min(1).max(50),
  date: z.string().min(1).max(20),
  time: z.string().min(1).max(20),
  pillar: z.string().min(1).max(100),
  format: tweetFormatSchema,
  copy: z.object({
    tweets: z.array(z.object({
      number: z.number().int().min(0),
      text: z.string().min(1).max(2000),
    })).min(1).max(30),
    charCounts: z.array(z.number()),
    notes: z.string().max(1000),
  }),
});

export const vibeprintStateSchema = z.object({
  profile: z.unknown().nullable(),
  niche: z.unknown().nullable(),
  roadmap: roadmapSchema.nullable(),
  topics: z.array(contentTopicSchema),
  calendar: z.array(calendarEntrySchema),
}).passthrough();

export function stripFence(input: string): string {
  return input.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
}
