import { z } from "zod";
import { loadState, updateState } from "../state.js";
import { buildCalendarPrompt } from "../prompts.js";
import { ok, err } from "../types.js";
import { calendarEntrySchema, stripFence } from "../schemas.js";

export const generateCalendarSchema = z.object({
  week_count: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(4)
    .describe("Number of weeks to generate content for (1–12, default 4)"),
});

export type GenerateCalendarInput = z.infer<typeof generateCalendarSchema>;

export async function generateCalendarTool(input: GenerateCalendarInput) {
  try {
    const state = await loadState();

    if (!state.roadmap) return err("No roadmap. Run `generate_roadmap` first.");

    const approved = state.topics.filter((t) => t.approved === true);
    if (!approved.length) {
      return err("No approved topics. Run `approve_topics` first.");
    }

    const prompt = buildCalendarPrompt(state, input.week_count);

    return ok(
      `📋 **Calendar prompt ready** for ${input.week_count} week(s) with ${approved.length} approved topics.\n\n` +
        `Send the following to your LLM, then call \`save_calendar\` with the JSON array.\n\n` +
        `---\n\n${prompt}\n\n---`
    );
  } catch (e) {
    return err(String(e));
  }
}

// ─── save_calendar ────────────────────────────────────────────────────────

export const saveCalendarSchema = z.object({
  json: z.string().min(2).max(500_000).describe("The calendar JSON array returned by the LLM"),
});

export async function saveCalendarTool(input: { json: string }) {
  try {
    const raw = stripFence(input.json);
    const parsed = JSON.parse(raw);
    // SEC-002: Validate LLM output with Zod before persisting
    const result = z.array(calendarEntrySchema).safeParse(parsed);
    if (!result.success) {
      return err(`Invalid calendar structure: ${result.error.issues.map(i => i.message).join(', ')}`);
    }
    const entries = result.data;
    await updateState({ calendar: entries });

    const preview = entries
      .slice(0, 5)
      .map(
        (e) =>
          `  • **${e.date} ${e.time}** [${e.format}] ${e.copy.tweets[0]?.text.slice(0, 60)}...`
      )
      .join("\n");

    return ok(
      `✅ Calendar saved with ${entries.length} entries.\n\n` +
        `**Preview (first 5):**\n${preview}\n\n` +
        `**Next step:** Run \`export\` to download as markdown, JSON, or CSV.`
    );
  } catch (e) {
    return err(`Failed to parse calendar JSON: ${String(e)}`);
  }
}
