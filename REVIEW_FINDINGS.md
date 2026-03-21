# Security & Code Quality Review Findings

**Date**: 2026-03-21
**Reviewers**: Codex CLI (GPT-5.4, read-only sandbox) + Claude Opus 4.6
**Scope**: Full codebase (src/, 11 files, ~1,135 LOC)

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| HIGH | 5 | 2 |
| MEDIUM | 10 | 5 |
| LOW | 2 | 1 |
| INFO | 2 | 0 |
| **Total** | **19** | **8** |

## Fixed

- **SEC-001 (HIGH)**: Export path now confined to ~/.vibeprint/ directory
- **SEC-004 (MEDIUM)**: CSV formula injection protection (prefix leading =+-@)
- **SEC-005 (MEDIUM)**: State directory 0o700, state file 0o600
- **SEC-008 (LOW)**: Generic error messages, server-side logging
- **QA-007 (MEDIUM)**: State dir/file restrictive permissions
- **QA-008 (MEDIUM)**: Input size limits on save_roadmap, save_topics, save_calendar (500k max)
- **QA-009 (MEDIUM)**: All CSV fields now use csvSafe() escaping

## Documented (require larger changes)

- **SEC-002 (HIGH)**: LLM JSON not validated with Zod before persistence
- **SEC-003 (MEDIUM)**: Prompt injection via untrusted profile data
- **SEC-006 (MEDIUM)**: State loaded without schema validation
- **SEC-007 (MEDIUM)**: MCP tool annotations missing
- **QA-001-006, QA-010-011**: Type safety, error handling, testing gaps

## Positive Findings

- No SSRF — GitHub/X hostnames fixed, usernames regex-validated
- Credentials never persisted to state file
- No subprocess execution
- Dependencies up-to-date, no active CVEs
