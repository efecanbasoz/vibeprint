import { z } from "zod";
import { loadState, resetState } from "../state.js";
import { ok } from "../types.js";

export const statusSchema = z.object({});

export async function statusTool(_input: Record<string, never>) {
  const state = loadState();
  const approved = state.topics.filter((t) => t.approved === true).length;
  const total = state.topics.length;

  const steps = [
    { label: "Profile discovered", done: !!state.profile },
    { label: "Niche set", done: !!state.niche },
    { label: "Roadmap generated", done: !!state.roadmap },
    { label: `Topics generated (${total} total, ${approved} approved)`, done: total > 0 },
    { label: "Calendar generated", done: state.calendar.length > 0 },
  ];

  const statusLines = steps.map((s) => `${s.done ? "✅" : "⬜"} ${s.label}`).join("\n");

  const nextStep = steps.find((s) => !s.done);
  const next = nextStep
    ? `\n**Next:** ${nextStepHint(nextStep.label)}`
    : "\n🎉 All steps complete. Run `export` to download your calendar.";

  const profileLine = state.profile
    ? `@${state.profile.x.handle}${state.profile.github ? ` · github.com/${state.profile.github.username}` : ""}`
    : "none";

  return ok(
    `## vibeprint status\n\n` +
      `**Profile:** ${profileLine}\n` +
      `**Niche:** ${state.niche?.niche ?? "not set"}\n\n` +
      statusLines +
      next
  );
}

function nextStepHint(label: string): string {
  if (label.includes("Profile")) return "Run `discover_profile`";
  if (label.includes("Niche")) return "Run `set_niche`";
  if (label.includes("Roadmap")) return "Run `generate_roadmap`";
  if (label.includes("Topics")) return "Run `generate_topics`, then `approve_topics`";
  if (label.includes("Calendar")) return "Run `generate_calendar`";
  return "Run `export`";
}

// ─── reset tool ──────────────────────────────────────────────────────────

export const resetSchema = z.object({
  confirm: z
    .boolean()
    .describe("Must be true to confirm reset. This deletes all saved state."),
});

export async function resetTool(input: { confirm: boolean }) {
  if (!input.confirm) {
    return ok("Reset cancelled. Pass `confirm: true` to proceed.");
  }
  resetState();
  return ok("🗑️  State reset. All data cleared. Run `discover_profile` to start fresh.");
}
