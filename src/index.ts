#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { discoverProfileSchema, discoverProfileTool } from "./tools/discover-profile.js";
import { setNicheSchema, setNicheTool } from "./tools/set-niche.js";
import {
  generateRoadmapSchema,
  generateRoadmapTool,
  saveRoadmapSchema,
  saveRoadmapTool,
} from "./tools/generate-roadmap.js";
import {
  generateTopicsSchema,
  generateTopicsTool,
  saveTopicsSchema,
  saveTopicsTool,
  approveTopicsSchema,
  approveTopicsTool,
} from "./tools/topics.js";
import {
  generateCalendarSchema,
  generateCalendarTool,
  saveCalendarSchema,
  saveCalendarTool,
} from "./tools/generate-calendar.js";
import { exportSchema, exportTool } from "./tools/export.js";
import { statusSchema, statusTool, resetSchema, resetTool } from "./tools/status.js";

// ─── Server ───────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "vibeprint",
  version: "0.1.0",
});

// ─── Tool registrations ────────────────────────────────────────────────────

server.tool(
  "discover_profile",
  "Fetch your X (Twitter) profile and GitHub repos to bootstrap your vibeprint session. Run this first.",
  discoverProfileSchema.shape,
  discoverProfileTool
);

server.tool(
  "set_niche",
  "Define your niche, target audience, and primary goal. Run after discover_profile.",
  setNicheSchema.shape,
  setNicheTool
);

server.tool(
  "generate_roadmap",
  "Generate a 90-day personal brand roadmap prompt based on your profile and niche. Returns a prompt for you to send to an LLM.",
  generateRoadmapSchema.shape,
  generateRoadmapTool
);

server.tool(
  "save_roadmap",
  "Save the roadmap JSON returned by the LLM after running generate_roadmap.",
  saveRoadmapSchema.shape,
  saveRoadmapTool
);

server.tool(
  "generate_topics",
  "Generate a content topics prompt based on your roadmap. Returns a prompt for the LLM.",
  generateTopicsSchema.shape,
  generateTopicsTool
);

server.tool(
  "save_topics",
  "Save the topics JSON array returned by the LLM after running generate_topics.",
  saveTopicsSchema.shape,
  saveTopicsTool
);

server.tool(
  "approve_topics",
  "Mark specific topics as approved for calendar generation. Pass an array of topic IDs.",
  approveTopicsSchema.shape,
  approveTopicsTool
);

server.tool(
  "generate_calendar",
  "Generate a tweet copy calendar prompt for approved topics. Returns a prompt for the LLM.",
  generateCalendarSchema.shape,
  generateCalendarTool
);

server.tool(
  "save_calendar",
  "Save the calendar JSON array returned by the LLM after running generate_calendar.",
  saveCalendarSchema.shape,
  saveCalendarTool
);

server.tool(
  "export",
  "Export the content calendar to a file. Formats: md (markdown), json, csv.",
  exportSchema.shape,
  exportTool
);

server.tool(
  "status",
  "Show current vibeprint session status — which steps are complete and what to do next.",
  statusSchema.shape,
  statusTool
);

server.tool(
  "reset",
  "Reset all vibeprint state. Requires confirm: true.",
  resetSchema.shape,
  resetTool
);

// ─── Start ────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr so it doesn't pollute MCP stdio
  process.stderr.write("vibeprint MCP server running\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
