import { describe, it, expect } from "vitest";
import { z } from "zod";
import { buildRoadmapPrompt } from "../src/prompts.js";
import { stripFence, roadmapSchema, contentTopicSchema, calendarEntrySchema } from "../src/schemas.js";
import { ok, err } from "../src/types.js";

// ─── stripFence ──────────────────────────────────────────────────────────

describe("stripFence", () => {
  it("removes leading ```json fence", () => {
    expect(stripFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("removes leading ```json fence without trailing newline", () => {
    expect(stripFence('```json{"a":1}')).toBe('{"a":1}');
  });

  it("handles input without fence markers", () => {
    expect(stripFence('{"a":1}')).toBe('{"a":1}');
  });

  it("handles empty input", () => {
    expect(stripFence("")).toBe("");
  });

  it("handles whitespace-only input", () => {
    expect(stripFence("  \n  ")).toBe("");
  });

  it("removes trailing ``` fence", () => {
    expect(stripFence('{"a":1}\n```')).toBe('{"a":1}');
  });

  it("removes only first and last fence, preserving inner backticks", () => {
    expect(stripFence('```json\n{"code":"```"}\n```')).toBe('{"code":"```"}');
  });
});

// ─── prompt context ──────────────────────────────────────────────────────

describe("prompt context", () => {
  it("includes bounded public X source notes", () => {
    const prompt = buildRoadmapPrompt({
      profile: {
        x: {
          handle: "janedoe",
          name: "Jane Doe",
          bio: "Builds developer tools",
          followersCount: 2400,
          source: "manual",
          sourceNotes:
            "Collection window: last 30 days. Public post URLs show launch notes, issue triage, and reply themes around TypeScript tooling.",
        },
        github: null,
        discoveredAt: "2026-06-12T03:46:08.049Z",
      },
      niche: null,
      roadmap: null,
      topics: [],
      calendar: [],
    });

    expect(prompt).toContain("publicSourceNotes");
    expect(prompt).toContain("reply themes around TypeScript tooling");
  });
});

// ─── roadmapSchema ───────────────────────────────────────────────────────

describe("roadmapSchema", () => {
  const validRoadmap = {
    northStar: "Become the go-to voice for dev tooling",
    contentPillars: [
      { name: "Open Source", description: "OSS contributions", weeklyFrequency: 2, formats: ["thread", "single"] },
    ],
    phases: [
      { phase: 1, title: "Foundation", duration: "Weeks 1-4", focus: "Build base", milestones: ["100 followers"], channels: ["X"] },
    ],
    postingFrequency: { postsPerWeek: 4, threadsPerWeek: 1, repliesPerDay: 8, bestTimes: ["09:00"] },
  };

  it("accepts valid roadmap", () => {
    const result = roadmapSchema.safeParse(validRoadmap);
    expect(result.success).toBe(true);
  });

  it("rejects empty northStar", () => {
    const result = roadmapSchema.safeParse({ ...validRoadmap, northStar: "" });
    expect(result.success).toBe(false);
  });

  it("rejects northStar exceeding 500 chars", () => {
    const result = roadmapSchema.safeParse({ ...validRoadmap, northStar: "x".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("rejects empty contentPillars array", () => {
    const result = roadmapSchema.safeParse({ ...validRoadmap, contentPillars: [] });
    expect(result.success).toBe(false);
  });

  it("rejects missing postingFrequency", () => {
    const { postingFrequency, ...rest } = validRoadmap;
    const result = roadmapSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("accepts generatedAt as optional field", () => {
    const result = roadmapSchema.safeParse({ ...validRoadmap, generatedAt: "2025-01-01" });
    expect(result.success).toBe(true);
  });
});

// ─── contentTopicSchema ──────────────────────────────────────────────────

describe("contentTopicSchema", () => {
  const validTopic = {
    id: "topic_01",
    title: "My first topic",
    pillar: "Open Source",
    format: "thread" as const,
    rationale: "Because it matters",
    approved: true,
  };

  it("accepts valid topic", () => {
    const result = contentTopicSchema.safeParse(validTopic);
    expect(result.success).toBe(true);
  });

  it("accepts approved: null", () => {
    const result = contentTopicSchema.safeParse({ ...validTopic, approved: null });
    expect(result.success).toBe(true);
  });

  it("rejects invalid format", () => {
    const result = contentTopicSchema.safeParse({ ...validTopic, format: "video" });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = contentTopicSchema.safeParse({ ...validTopic, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    const { id, ...rest } = validTopic;
    const result = contentTopicSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ─── calendarEntrySchema ─────────────────────────────────────────────────

describe("calendarEntrySchema", () => {
  const validEntry = {
    id: "entry_001",
    topicId: "topic_01",
    date: "2025-01-06",
    time: "09:00",
    pillar: "Open Source",
    format: "thread" as const,
    copy: {
      tweets: [{ number: 1, text: "Hello world" }],
      charCounts: [11],
      notes: "Post on Tuesday",
    },
  };

  it("accepts valid calendar entry", () => {
    const result = calendarEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("rejects empty tweets array", () => {
    const result = calendarEntrySchema.safeParse({
      ...validEntry,
      copy: { ...validEntry.copy, tweets: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects format: single as valid", () => {
    const result = calendarEntrySchema.safeParse({ ...validEntry, format: "single" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid format", () => {
    const result = calendarEntrySchema.safeParse({ ...validEntry, format: "story" });
    expect(result.success).toBe(false);
  });
});

// ─── response helpers ─────────────────────────────────────────────────────

describe("response helpers", () => {
  it("ok returns content array with text string", () => {
    const result = ok("Success message");
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe("Success message");
  });

  it("err returns content with error flag", () => {
    const result = err("Error message");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Error message");
  });

  it("err returns text prefixed with error indicator", () => {
    const result = err("Something failed");
    expect(result.content[0].text.startsWith("❌")).toBe(true);
  });
});

// ─── Zod format enum ──────────────────────────────────────────────────────

describe("tweetFormat enum", () => {
  const formatEnum = z.enum(["thread", "single", "quote_tweet", "media"]);

  it("accepts all valid formats", () => {
    for (const fmt of ["thread", "single", "quote_tweet", "media"]) {
      expect(formatEnum.safeParse(fmt).success).toBe(true);
    }
  });

  it("rejects invalid formats", () => {
    for (const fmt of ["story", "poll", "carousel", "video"]) {
      expect(formatEnum.safeParse(fmt).success).toBe(false);
    }
  });
});
