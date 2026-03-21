import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { VibeprintState } from "./types.js";
import { vibeprintStateSchema } from "./schemas.js";

const STATE_DIR = join(homedir(), ".vibeprint");
const STATE_FILE = join(STATE_DIR, "state.json");

const EMPTY_STATE: VibeprintState = {
  profile: null,
  niche: null,
  roadmap: null,
  topics: [],
  calendar: [],
};

function ensureDir(): void {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
  }
}

// SEC-006 + QA-001: Validate state on load with Zod schema
export function loadState(): VibeprintState {
  ensureDir();
  if (!existsSync(STATE_FILE)) return { ...EMPTY_STATE };
  try {
    const raw = readFileSync(STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const result = vibeprintStateSchema.safeParse(parsed);
    if (result.success) {
      return result.data as VibeprintState;
    }
    // QA-002: Quarantine corrupted state instead of silently resetting
    console.error(`State validation failed: ${result.error.message}`);
    const corruptPath = STATE_FILE + ".corrupt";
    try { renameSync(STATE_FILE, corruptPath); } catch { /* ignore rename failure */ }
    return { ...EMPTY_STATE };
  } catch (e) {
    console.error(`State load failed: ${e}`);
    return { ...EMPTY_STATE };
  }
}

export function saveState(state: VibeprintState): void {
  ensureDir();
  // SEC-005: Write with restrictive permissions
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), { encoding: "utf-8", mode: 0o600 });
}

export function updateState(patch: Partial<VibeprintState>): VibeprintState {
  const current = loadState();
  const next = { ...current, ...patch };
  saveState(next);
  return next;
}

export function resetState(): void {
  saveState({ ...EMPTY_STATE });
}

export { STATE_DIR };
