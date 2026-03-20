import { z } from "zod";
import { loadState, updateState } from "../state.js";
import { ok, err } from "../types.js";
import type { Niche } from "../types.js";

export const setNicheSchema = z.object({
  niche: z
    .string()
    .describe(
      "Your niche in one clear sentence, e.g. 'AI tools for digital marketers' or 'open source dev tooling'"
    ),
  target_audience: z
    .string()
    .describe(
      "Who you want to reach, e.g. 'developers building AI products' or 'marketing agency owners'"
    ),
  goal: z
    .string()
    .describe(
      "Your primary X goal, e.g. 'get 1000 followers in 90 days' or 'become the go-to voice for AI marketing tools'"
    ),
  content_language: z
    .string()
    .default("English")
    .describe("Primary language for your content, e.g. English or Turkish"),
});

export type SetNicheInput = z.infer<typeof setNicheSchema>;

export async function setNicheTool(input: SetNicheInput) {
  try {
    const state = loadState();

    if (!state.profile) {
      return err("No profile found. Run `discover_profile` first.");
    }

    const niche: Niche = {
      niche: input.niche,
      targetAudience: input.target_audience,
      goal: input.goal,
      contentLanguage: input.content_language,
      setAt: new Date().toISOString(),
    };

    updateState({ niche });

    return ok(
      `✅ Niche saved.\n\n` +
        `**Niche:** ${niche.niche}\n` +
        `**Audience:** ${niche.targetAudience}\n` +
        `**Goal:** ${niche.goal}\n` +
        `**Language:** ${niche.contentLanguage}\n\n` +
        `**Next step:** Run \`generate_roadmap\` to build your 90-day strategy.`
    );
  } catch (e) {
    return err(String(e));
  }
}
