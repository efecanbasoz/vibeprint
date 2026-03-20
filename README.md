# vibeprint

> Your personal brand, engineered from your code.

**vibeprint** is an MCP (Model Context Protocol) server that discovers your developer profile on X and GitHub, then generates a personalized 90-day brand roadmap, content topic ideas, and ready-to-post tweet copy — all through Claude Code, Gemini CLI, or any MCP-compatible client.

---

## How it works

```
discover_profile → set_niche → generate_roadmap → generate_topics → approve_topics → generate_calendar → export
```

1. **`discover_profile`** — fetches your X bio + GitHub repos
2. **`set_niche`** — you define your niche, audience, and goal
3. **`generate_roadmap`** — builds your 90-day strategy
4. **`generate_topics`** — creates 15 content topic ideas from your real work
5. **`approve_topics`** — you pick which topics to keep
6. **`generate_calendar`** — writes full tweet copy for every approved topic
7. **`export`** — saves to `.md`, `.json`, or `.csv`

State is saved locally in `~/.vibeprint/` between sessions.

---

## Installation

```bash
# Clone
git clone https://github.com/efecanbasoz/vibeprint
cd vibeprint

# Install + build
npm install
npm run build

# Add to Claude Code's MCP config
```

Then add to your `~/.claude/claude_desktop_config.json` (or Claude Code config):

```json
{
  "mcpServers": {
    "vibeprint": {
      "command": "node",
      "args": ["/absolute/path/to/vibeprint/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "optional_for_higher_rate_limits",
        "X_BEARER_TOKEN": "optional_for_automatic_x_profile_fetch"
      }
    }
  }
}
```

---

## Usage in Claude Code

```
// Start a new session
discover_profile(x_handle: "efecanbasoz", github_username: "efecanbasoz")

// Define your niche
set_niche(
  niche: "AI tools for digital marketers",
  target_audience: "developers and agency owners building with AI",
  goal: "1000 followers in 90 days and 3 new Sirkhet clients",
  content_language: "English"
)

// Generate roadmap prompt → send to LLM → save result
generate_roadmap()
// ... copy prompt to LLM, get JSON back ...
save_roadmap(json: "{ ... }")

// Generate topics → review → approve
generate_topics()
save_topics(json: "[...]")
approve_topics(ids: ["topic_01", "topic_03", "topic_05"])

// Generate copy
generate_calendar(week_count: 4)
save_calendar(json: "[...]")

// Export
export(format: "md")
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Optional | Increases GitHub API rate limit from 60 to 5000 req/hr |
| `X_BEARER_TOKEN` | Optional | Enables automatic X profile fetching via Twitter API v2 |

Without these, vibeprint still works — GitHub public API is available unauthenticated, and X profile info can be provided manually via `x_bio_override`.

---

## Stack

- **TypeScript** + **Node.js 18+**
- **`@modelcontextprotocol/sdk`** — official MCP SDK by Anthropic
- **`zod`** — schema validation for all tool inputs
- State: flat JSON in `~/.vibeprint/` — no database

---

## Roadmap

- [ ] v0.1 — Core flow (this release)
- [ ] v0.2 — Direct X posting via API (schedule + publish)
- [ ] v0.3 — GitHub commit → tweet auto-suggestion
- [ ] v0.4 — Streak tracker + engagement analytics
- [ ] v0.5 — Standalone CLI mode (no MCP client required)

---

## Built by

[Efecan Başöz](https://x.com/efecanbasoz) · Founder [@Sirkhet](https://sirkhet.com) · [github.com/efecanbasoz](https://github.com/efecanbasoz)

---

## License

MIT
