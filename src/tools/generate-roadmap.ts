import { z } from "zod";
import { loadState, updateState } from "../state.js";
import { buildRoadmapPrompt } from "../prompts.js";
import { ok, err } from "../types.js";
import type { Roadmap } from "../types.js";

export const generateRoadmapSchema = z.object({});

export async function generateRoadmapTool(_input: Record<string, never>) {
  try {
    const state = loadState();

    if (!state.profile) return err("No profile found. Run `discover_profile` first.");
    if (!state.niche) return err("No niche set. Run `set_niche` first.");

    const prompt = buildRoadmapPrompt(state);

    // Return the prompt for the host LLM to complete, then save
    // The MCP host (Claude Code / Gemini) will call generate_roadmap_save
    // with the LLM's JSON output.
    return ok(
      `📋 **Roadmap prompt ready.** Copy and send the following to your LLM, then call ` +
        `\`save_roadmap\` with the JSON response.\n\n` +
        `---\n\n${prompt}\n\n---\n\n` +
        `Once you have the JSON, call \`save_roadmap(json: "...")\`.`
    );
  } catch (e) {
    return err(String(e));
  }
}

// ─── save_roadmap ─────────────────────────────────────────────────────────

export const saveRoadmapSchema = z.object({
  json: z.string().min(2).max(500_000).describe("The roadmap JSON string returned by the LLM"),
});

export type SaveRoadmapInput = z.infer<typeof saveRoadmapSchema>;

export async function saveRoadmapTool(input: SaveRoadmapInput) {
  try {
    const raw = input.json.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const roadmap = JSON.parse(raw) as Roadmap;
    roadmap.generatedAt = new Date().toISOString();
    updateState({ roadmap });

    const pillars = roadmap.contentPillars
      .map((p) => `  • **${p.name}** (${p.weeklyFrequency}x/week) — ${p.description}`)
      .join("\n");

    const phases = roadmap.phases
      .map((p) => `  **Phase ${p.phase} — ${p.title}** (${p.duration})\n  ${p.focus}`)
      .join("\n\n");

    return ok(
      `✅ Roadmap saved.\n\n` +
        `**North Star:** ${roadmap.northStar}\n\n` +
        `**Content Pillars:**\n${pillars}\n\n` +
        `**Phases:**\n${phases}\n\n` +
        `**Posting cadence:** ${roadmap.postingFrequency.postsPerWeek} posts/week, ` +
        `${roadmap.postingFrequency.threadsPerWeek} threads/week, ` +
        `${roadmap.postingFrequency.repliesPerDay} replies/day\n\n` +
        `**Next step:** Run \`generate_topics\` to create content ideas.`
    );
  } catch (e) {
    return err(`Failed to parse roadmap JSON: ${String(e)}`);
  }
}
