import { z } from "zod";
import { loadState, updateState } from "../state.js";
import { buildTopicsPrompt } from "../prompts.js";
import { ok, err } from "../types.js";
import type { ContentTopic } from "../types.js";

// ─── generate_topics ─────────────────────────────────────────────────────

export const generateTopicsSchema = z.object({});

export async function generateTopicsTool(_input: Record<string, never>) {
  try {
    const state = loadState();
    if (!state.roadmap) return err("No roadmap found. Run `generate_roadmap` first.");

    const prompt = buildTopicsPrompt(state);

    return ok(
      `📋 **Topics prompt ready.** Send the following to your LLM, then call ` +
        `\`save_topics\` with the JSON array it returns.\n\n---\n\n${prompt}\n\n---`
    );
  } catch (e) {
    return err(String(e));
  }
}

// ─── save_topics ─────────────────────────────────────────────────────────

export const saveTopicsSchema = z.object({
  json: z.string().describe("The topics JSON array returned by the LLM"),
});

export async function saveTopicsTool(input: { json: string }) {
  try {
    const raw = input.json.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const topics = JSON.parse(raw) as ContentTopic[];
    // All topics start as unapproved
    const withStatus = topics.map((t) => ({ ...t, approved: null }));
    updateState({ topics: withStatus });

    const list = withStatus
      .map(
        (t, i) =>
          `${i + 1}. **[${t.format}]** ${t.title}\n   _${t.pillar}_ — ${t.rationale}`
      )
      .join("\n\n");

    return ok(
      `✅ ${topics.length} topics saved.\n\n${list}\n\n` +
        `**Next step:** Run \`approve_topics\` with the IDs you want to keep, ` +
        `e.g. \`approve_topics(ids: ["topic_01","topic_03"])\`.`
    );
  } catch (e) {
    return err(`Failed to parse topics JSON: ${String(e)}`);
  }
}

// ─── approve_topics ──────────────────────────────────────────────────────

export const approveTopicsSchema = z.object({
  ids: z
    .array(z.string())
    .describe("Array of topic IDs to approve, e.g. ['topic_01', 'topic_03']"),
});

export type ApproveTopicsInput = z.infer<typeof approveTopicsSchema>;

export async function approveTopicsTool(input: ApproveTopicsInput) {
  try {
    const state = loadState();

    if (!state.topics.length) {
      return err("No topics found. Run `generate_topics` first.");
    }

    const approvedSet = new Set(input.ids);
    const updated = state.topics.map((t) => ({
      ...t,
      approved: approvedSet.has(t.id) ? true : false,
    }));

    updateState({ topics: updated });

    const approved = updated.filter((t) => t.approved);
    const rejected = updated.filter((t) => !t.approved);

    const approvedList = approved.map((t) => `  ✅ ${t.id}: ${t.title}`).join("\n");
    const rejectedList = rejected.map((t) => `  ✗ ${t.id}: ${t.title}`).join("\n");

    return ok(
      `✅ Topics approved.\n\n` +
        `**Approved (${approved.length}):**\n${approvedList}\n\n` +
        `**Skipped (${rejected.length}):**\n${rejectedList}\n\n` +
        `**Next step:** Run \`generate_calendar\` to write the full tweet copy.`
    );
  } catch (e) {
    return err(String(e));
  }
}
