import { z } from "zod";
import { writeFileSync } from "fs";
import { join, resolve } from "path";
import { loadState, STATE_DIR } from "../state.js";
import { ok, err } from "../types.js";
import type { CalendarEntry } from "../types.js";

export const exportSchema = z.object({
  format: z
    .enum(["md", "json", "csv"])
    .default("md")
    .describe("Export format: md (markdown), json, or csv"),
  output_path: z
    .string()
    .optional()
    .describe(
      "Custom output file path. Defaults to ~/.vibeprint/calendar.[format]"
    ),
});

export type ExportInput = z.infer<typeof exportSchema>;

function toMarkdown(entries: CalendarEntry[]): string {
  const lines: string[] = ["# vibeprint — Content Calendar\n"];

  let currentWeek = "";
  for (const e of entries) {
    const d = new Date(e.date);
    const weekLabel = `Week of ${d.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
    if (weekLabel !== currentWeek) {
      currentWeek = weekLabel;
      lines.push(`\n## ${weekLabel}\n`);
    }

    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    lines.push(`### ${dayName} ${e.date} · ${e.time}`);
    lines.push(`**Format:** ${e.format} | **Pillar:** ${e.pillar}\n`);

    for (const tweet of e.copy.tweets) {
      if (e.format === "thread") {
        lines.push(`**${tweet.number}/**`);
      }
      lines.push(tweet.text);
      lines.push("");
    }

    if (e.copy.notes) {
      lines.push(`> 💡 ${e.copy.notes}`);
    }

    lines.push("\n---\n");
  }

  return lines.join("\n");
}

// SEC-004: Sanitize CSV fields to prevent formula injection
function csvSafe(value: string): string {
  const escaped = value.replace(/"/g, '""');
  // Prefix formula-capable characters with a single quote
  const sanitized = /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped;
  return `"${sanitized}"`;
}

function toCsv(entries: CalendarEntry[]): string {
  const header = "date,time,day,format,pillar,tweet_number,char_count,text,notes";
  const rows: string[] = [header];

  for (const e of entries) {
    const day = new Date(e.date).toLocaleDateString("en-US", { weekday: "long" });
    for (let i = 0; i < e.copy.tweets.length; i++) {
      const tweet = e.copy.tweets[i];
      const charCount = e.copy.charCounts[i] ?? tweet.text.length;
      const text = csvSafe(tweet.text);
      const notes = i === 0 ? csvSafe(e.copy.notes ?? "") : '""';
      rows.push(
        [e.date, e.time, day, csvSafe(e.format), csvSafe(e.pillar), tweet.number, charCount, text, notes].join(",")
      );
    }
  }

  return rows.join("\n");
}

export async function exportTool(input: ExportInput) {
  try {
    const state = await loadState();

    if (!state.calendar.length) {
      return err("No calendar found. Run `generate_calendar` first.");
    }

    let content: string;
    switch (input.format) {
      case "json":
        content = JSON.stringify(state.calendar, null, 2);
        break;
      case "csv":
        content = toCsv(state.calendar);
        break;
      default:
        content = toMarkdown(state.calendar);
    }

    const filename = `calendar.${input.format}`;
    // SEC-001: Confine exports to STATE_DIR to prevent arbitrary file overwrites
    const defaultPath = join(STATE_DIR, filename);
    const outputPath = resolve(input.output_path ?? defaultPath);
    const realBase = resolve(STATE_DIR);
    if (!outputPath.startsWith(realBase + "/")) {
      return err("Export path must be within ~/.vibeprint/ directory.");
    }
    writeFileSync(outputPath, content, { encoding: "utf-8", mode: 0o600 });

    return ok(
      `✅ Calendar exported.\n\n` +
        `**Format:** ${input.format.toUpperCase()}\n` +
        `**Entries:** ${state.calendar.length}\n` +
        `**File:** ${outputPath}\n\n` +
        `${input.format === "md" ? "Open in any markdown viewer or paste into Notion." : ""}` +
        `${input.format === "csv" ? "Ready to import into Notion, Airtable, or Google Sheets." : ""}` +
        `${input.format === "json" ? "Machine-readable — use for integrations or scheduling tools." : ""}`
    );
  } catch (e) {
    console.error("export failed:", e);
    return err("Export failed. Check file permissions and path.");
  }
}
