import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { VibeprintState } from "./types.js";

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
    mkdirSync(STATE_DIR, { recursive: true });
  }
}

export function loadState(): VibeprintState {
  ensureDir();
  if (!existsSync(STATE_FILE)) return { ...EMPTY_STATE };
  try {
    const raw = readFileSync(STATE_FILE, "utf-8");
    return JSON.parse(raw) as VibeprintState;
  } catch {
    return { ...EMPTY_STATE };
  }
}

export function saveState(state: VibeprintState): void {
  ensureDir();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
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
