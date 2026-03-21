import { readFile, writeFile, mkdir, rename, access } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import type { VibeprintState } from "./types.js";
import { vibeprintStateSchema } from "./schemas.js";

// QA-006: Fully async fs operations — no event loop blocking

const STATE_DIR = join(homedir(), ".vibeprint");
const STATE_FILE = join(STATE_DIR, "state.json");

const EMPTY_STATE: VibeprintState = {
  profile: null,
  niche: null,
  roadmap: null,
  topics: [],
  calendar: [],
};

async function ensureDir(): Promise<void> {
  try {
    await access(STATE_DIR);
  } catch {
    await mkdir(STATE_DIR, { recursive: true, mode: 0o700 });
  }
}

async function fileExists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

export async function loadState(): Promise<VibeprintState> {
  await ensureDir();
  if (!(await fileExists(STATE_FILE))) return { ...EMPTY_STATE };
  try {
    const raw = await readFile(STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const result = vibeprintStateSchema.safeParse(parsed);
    if (result.success) {
      return result.data as VibeprintState;
    }
    console.error(`State validation failed: ${result.error.message}`);
    const corruptPath = STATE_FILE + ".corrupt";
    try { await rename(STATE_FILE, corruptPath); } catch { /* ignore */ }
    return { ...EMPTY_STATE };
  } catch (e) {
    console.error(`State load failed: ${e}`);
    return { ...EMPTY_STATE };
  }
}

export async function saveState(state: VibeprintState): Promise<void> {
  await ensureDir();
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), { encoding: "utf-8", mode: 0o600 });
}

export async function updateState(patch: Partial<VibeprintState>): Promise<VibeprintState> {
  const current = await loadState();
  const next = { ...current, ...patch };
  await saveState(next);
  return next;
}

export async function resetState(): Promise<void> {
  await saveState({ ...EMPTY_STATE });
}

export { STATE_DIR };
