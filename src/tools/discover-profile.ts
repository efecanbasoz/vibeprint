import { z } from "zod";
import { updateState } from "../state.js";
import { ok, err } from "../types.js";
import type { GitHubProfile, GitHubRepo, XProfile, UserProfile } from "../types.js";

// ─── GitHub ────────────────────────────────────────────────────────────────

async function fetchGitHubProfile(username: string): Promise<GitHubProfile> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "vibeprint/0.1",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
  if (!userRes.ok) throw new Error(`GitHub user not found: ${username} (${userRes.status})`);
  const user = (await userRes.json()) as {
    name: string | null;
    bio: string | null;
  };

  const repoRes = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=30&sort=updated`,
    { headers }
  );
  if (!repoRes.ok) throw new Error(`Failed to fetch repos for ${username}`);
  const rawRepos = (await repoRes.json()) as Array<{
    name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    html_url: string;
    topics: string[];
    fork: boolean;
  }>;

  const repos: GitHubRepo[] = rawRepos
    .filter((r) => !r.fork)
    .slice(0, 10)
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      url: r.html_url,
      topics: r.topics ?? [],
    }));

  const langCounts: Record<string, number> = {};
  for (const r of repos) {
    if (r.language) langCounts[r.language] = (langCounts[r.language] ?? 0) + 1;
  }
  const topLanguages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  return { username, name: user.name, bio: user.bio, repos, topLanguages };
}

// ─── X / Twitter ─────────────────────────────────────────────────────────

async function fetchXProfile(handle: string): Promise<XProfile> {
  const bearer = process.env.X_BEARER_TOKEN;

  if (bearer) {
    const cleanHandle = handle.replace("@", "");
    const res = await fetch(
      `https://api.twitter.com/2/users/by/username/${cleanHandle}?user.fields=description,public_metrics,name`,
      { headers: { Authorization: `Bearer ${bearer}` } }
    );
    if (res.ok) {
      const data = (await res.json()) as {
        data?: {
          name: string;
          username: string;
          description: string;
          public_metrics?: { followers_count: number };
        };
      };
      if (data.data) {
        return {
          handle: data.data.username,
          name: data.data.name,
          bio: data.data.description,
          followersCount: data.data.public_metrics?.followers_count ?? null,
          source: "api",
        };
      }
    }
  }

  // Fallback: return a stub that the LLM can work with
  // (X API requires OAuth — without a token we store what the user told us)
  return {
    handle: handle.replace("@", ""),
    name: handle.replace("@", ""),
    bio: "",
    followersCount: null,
    source: "manual",
  };
}

// ─── Tool definition ────────────────────────────────────────────────────

export const discoverProfileSchema = z.object({
  x_handle: z
    .string()
    .regex(/^@?[a-zA-Z0-9_]{1,15}$/, "Invalid X handle")
    .describe("Your X (Twitter) handle, e.g. efecanbasoz or @efecanbasoz"),
  github_username: z
    .string()
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/, "Invalid GitHub username")
    .optional()
    .describe("Your GitHub username, e.g. efecanbasoz (optional but recommended)"),
  x_bio_override: z
    .string()
    .optional()
    .describe(
      "If you don't have an X API token, paste your X bio here so vibeprint can use it"
    ),
});

export type DiscoverProfileInput = z.infer<typeof discoverProfileSchema>;

export async function discoverProfileTool(input: DiscoverProfileInput) {
  try {
    const xProfile = await fetchXProfile(input.x_handle);

    // Allow the user to override the bio manually (no token needed)
    if (input.x_bio_override) {
      xProfile.bio = input.x_bio_override;
      xProfile.source = "manual";
    }

    let githubProfile: GitHubProfile | null = null;
    if (input.github_username) {
      githubProfile = await fetchGitHubProfile(input.github_username);
    }

    const profile: UserProfile = {
      x: xProfile,
      github: githubProfile,
      discoveredAt: new Date().toISOString(),
    };

    updateState({ profile });

    const repoSummary = githubProfile
      ? `\n\n**GitHub** — @${githubProfile.username}\n` +
        `Top languages: ${githubProfile.topLanguages.join(", ")}\n` +
        `Repos found: ${githubProfile.repos.length}\n` +
        githubProfile.repos
          .map((r) => `  • ${r.name} (⭐${r.stars}) — ${r.description ?? "no description"}`)
          .join("\n")
      : "\n\nNo GitHub profile linked.";

    const xNote =
      xProfile.source === "manual"
        ? "\n\n> **Tip:** Set `X_BEARER_TOKEN` env var for automatic X profile fetching."
        : "";

    return ok(
      `✅ Profile discovered and saved.\n\n` +
        `**X** — @${xProfile.handle}\n` +
        `Bio: ${xProfile.bio || "(empty — use x_bio_override to add it)"}\n` +
        `Followers: ${xProfile.followersCount ?? "unknown"}` +
        repoSummary +
        xNote +
        `\n\n**Next step:** Run \`set_niche\` to define your niche and audience.`
    );
  } catch (e) {
    // SEC-008: Generic error to avoid leaking internal details
    console.error("discover_profile failed:", e);
    return err("Profile discovery failed. Check your network connection and API tokens.");
  }
}
