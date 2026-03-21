# Security & Code Quality Review Findings

**Date**: 2026-03-21
**Reviewers**: Codex CLI (GPT-5.4, read-only sandbox) + Claude Opus 4.6
**Scope**: Full codebase (src/, 11 files, ~1,135 LOC)

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| HIGH | 5 | 5 |
| MEDIUM | 10 | 8 |
| LOW | 2 | 1 |
| INFO | 2 | 0 |
| **Total** | **19** | **14** |

## Fixed (Round 1)

- **SEC-001 (HIGH)**: Export path confined to ~/.vibeprint/
- **SEC-004 (MEDIUM)**: CSV formula injection protection
- **SEC-005 (MEDIUM)**: State directory 0o700, state file 0o600
- **SEC-008 (LOW)**: Generic error messages, server-side logging
- **QA-008 (MEDIUM)**: Input size limits (500k max)
- **QA-009 (MEDIUM)**: CSV fields use csvSafe() escaping

## Fixed (Round 2 — Deferred)

- **SEC-002 (HIGH)**: All save_* tools now validate LLM JSON with Zod schemas before
  persisting. Added roadmapSchema, contentTopicSchema, calendarEntrySchema with field
  type checks, size limits, and enum validation. Invalid LLM output is rejected.
- **SEC-003 (MEDIUM)**: Profile data serialized as JSON with sanitized fields and
  labeled as untrusted in prompts to mitigate indirect prompt injection.
- **SEC-006 (MEDIUM)**: State loaded with vibeprintStateSchema.safeParse(). Corrupted
  state quarantined to state.json.corrupt instead of silently resetting.
- **QA-001/003 (HIGH)**: All type safety issues resolved via Zod validation on both
  load and save paths. No more blind `as` casts on LLM output.

## Remaining

- **SEC-007 (MEDIUM)**: MCP tool annotations (registerTool API migration)
- **QA-004-006, QA-010-011**: Error handling, performance, testing

## Positive Findings

- No SSRF — GitHub/X hostnames fixed, usernames regex-validated
- Credentials never persisted to state file
- No subprocess execution
- Dependencies up-to-date, no active CVEs
