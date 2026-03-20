import type { VibeprintState } from "./types.js";

// ─── Profile context block ─────────────────────────────────────────────────

export function buildProfileContext(state: VibeprintState): string {
  const parts: string[] = [];

  if (state.profile) {
    const { x, github } = state.profile;
    parts.push(`## X (Twitter) Profile
Handle: @${x.handle}
Name: ${x.name}
Bio: ${x.bio}
Followers: ${x.followersCount ?? "unknown"}`);

    if (github) {
      parts.push(`\n## GitHub Profile
Username: ${github.username}
Bio: ${github.bio ?? "none"}
Top languages: ${github.topLanguages.join(", ")}

### Repositories
${github.repos
  .map(
    (r) =>
      `- **${r.name}** (${r.language ?? "unknown"}, ⭐${r.stars}): ${r.description ?? "no description"}`
  )
  .join("\n")}`);
    }
  }

  if (state.niche) {
    parts.push(`\n## Niche & Goals
Niche: ${state.niche.niche}
Target audience: ${state.niche.targetAudience}
Primary goal: ${state.niche.goal}
Content language: ${state.niche.contentLanguage}`);
  }

  return parts.join("\n");
}

// ─── Roadmap prompt ────────────────────────────────────────────────────────

export function buildRoadmapPrompt(state: VibeprintState): string {
  return `You are a personal brand strategist for developers and tech founders.

${buildProfileContext(state)}

Generate a detailed 90-day personal brand roadmap for this person on X (Twitter).

Return ONLY valid JSON with this exact structure:
{
  "northStar": "one sentence defining their brand goal",
  "contentPillars": [
    {
      "name": "pillar name",
      "description": "what this pillar covers",
      "weeklyFrequency": 2,
      "formats": ["thread", "single"]
    }
  ],
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration": "Weeks 1-4",
      "focus": "what to focus on",
      "milestones": ["milestone 1", "milestone 2"],
      "channels": ["X", "GitHub"]
    }
  ],
  "postingFrequency": {
    "postsPerWeek": 4,
    "threadsPerWeek": 1,
    "repliesPerDay": 8,
    "bestTimes": ["09:00", "20:00"]
  }
}

Rules:
- 3-4 content pillars based on their actual profile and repos
- 3 phases: Foundation (weeks 1-4), Momentum (weeks 5-8), Authority (weeks 9-12)
- Posting frequency must be sustainable for someone with a full-time job
- All milestones must be concrete and measurable
- Best times should be in their local timezone context`;
}

// ─── Topics prompt ────────────────────────────────────────────────────────

export function buildTopicsPrompt(state: VibeprintState): string {
  const pillarNames =
    state.roadmap?.contentPillars.map((p) => p.name).join(", ") ?? "general";

  return `You are a content strategist for tech founders and developer personal brands.

${buildProfileContext(state)}

Content pillars: ${pillarNames}

Generate 15 high-quality content topic ideas for their X (Twitter) strategy.

Return ONLY valid JSON — an array of topic objects:
[
  {
    "id": "topic_01",
    "title": "Short topic title",
    "pillar": "pillar name",
    "format": "thread",
    "rationale": "Why this topic will resonate with their audience (1-2 sentences)"
  }
]

Format options: "thread", "single", "quote_tweet", "media"

Rules:
- Base topics on their ACTUAL repos and real work — no generic ideas
- Mix formats: ~5 threads, ~6 single tweets, ~2 quote_tweets, ~2 media posts
- Cover all content pillars evenly
- Each topic title must be specific enough that the person knows exactly what to write
- Topics should leverage their unique combination of agency experience + OSS projects
- At least 2 topics should reference specific repos by name`;
}

// ─── Calendar prompt ──────────────────────────────────────────────────────

export function buildCalendarPrompt(
  state: VibeprintState,
  weekCount: number
): string {
  const approved = state.topics.filter((t) => t.approved === true);
  const freq = state.roadmap?.postingFrequency;

  return `You are a copywriter specializing in developer personal brands on X (Twitter).

${buildProfileContext(state)}

Approved content topics:
${approved.map((t, i) => `${i + 1}. [${t.format}] ${t.title} (pillar: ${t.pillar})`).join("\n")}

Posting frequency: ${freq?.postsPerWeek ?? 4} posts/week
Best posting times: ${freq?.bestTimes?.join(", ") ?? "09:00, 20:00"}
Calendar duration: ${weekCount} weeks
Content language: ${state.niche?.contentLanguage ?? "English"}

Write the full tweet copy for each topic and assign it to a specific date and time slot.

Start from next Monday. Distribute posts evenly across the week (Mon, Wed, Thu, Fri preferred).

Return ONLY valid JSON — an array:
[
  {
    "id": "entry_001",
    "topicId": "topic_01",
    "date": "2025-01-06",
    "time": "09:00",
    "pillar": "pillar name",
    "format": "thread",
    "copy": {
      "tweets": [
        { "number": 1, "text": "full tweet text here" },
        { "number": 2, "text": "second tweet text" }
      ],
      "charCounts": [220, 180],
      "notes": "Post this on a Tuesday morning for max tech audience overlap"
    }
  }
]

Rules:
- Single tweets: exactly 1 tweet part, under 280 chars
- Threads: 5-10 tweet parts, first tweet is the hook
- Quote tweets: 1 tweet part, under 220 chars (leaves room for quoted post)
- Media posts: 1 tweet part + note describing the visual to create
- Voice: authentic, direct, no corporate speak — sounds like a real developer founder
- First tweet of every thread must hook in the first line with no preamble
- Use the person's real repo names, real agency name (Sirkhet), real project names (Kong Metrics)
- char_counts array must match the number of tweet parts`;
}
