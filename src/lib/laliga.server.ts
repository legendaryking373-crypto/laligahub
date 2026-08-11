import type { NewsItem } from "./laliga-types";

const BASE = "https://v3.football.api-sports.io";

export const LEAGUE_ID = 140;

/**
 * API-Sports free plans only expose seasons 2022-2024, so the season is
 * configurable and defaults to the newest one the free plan allows.
 */
export function getSeason(): number {
  return Number(process.env["LALIGA_SEASON"] ?? 2024);
}

async function readCache(key: string): Promise<{ payload: unknown; fresh: boolean } | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("api_cache")
    .select("payload, expires_at")
    .eq("cache_key", key)
    .maybeSingle();
  if (!data) return null;
  return { payload: data.payload, fresh: new Date(data.expires_at).getTime() > Date.now() };
}

async function writeCache(key: string, payload: unknown, ttlSeconds: number): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("api_cache").upsert(
    {
      cache_key: key,
      payload: payload as never,
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    },
    { onConflict: "cache_key" },
  );
}

/** Cached fetch against API-Sports. Keeps the app inside the free daily quota. */
export async function apiGet<T>(path: string, ttlSeconds: number): Promise<T[]> {
  const key = `apisports:${path}`;
  const cached = await readCache(key);
  if (cached?.fresh) return cached.payload as T[];

  const apiKey = process.env["APISPORTS_KEY"];
  if (!apiKey) {
    console.error("APISPORTS_KEY is not configured");
    return (cached?.payload as T[]) ?? [];
  }

  try {
    const res = await fetch(`${BASE}/${path}`, { headers: { "x-apisports-key": apiKey } });
    const json = (await res.json()) as { response?: T[]; errors?: unknown };
    const errors = json.errors;
    const hasErrors = Array.isArray(errors)
      ? errors.length > 0
      : !!errors && Object.keys(errors as object).length > 0;

    if (!res.ok || hasErrors) {
      console.error(`api-sports ${path} failed [${res.status}]: ${JSON.stringify(errors)}`);
      return (cached?.payload as T[]) ?? [];
    }

    const response = json.response ?? [];
    await writeCache(key, response, ttlSeconds);
    return response;
  } catch (error) {
    console.error(`api-sports ${path} threw`, error);
    return (cached?.payload as T[]) ?? [];
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return match ? decodeEntities(match[1] ?? "") : "";
}

/** Free, key-less LaLiga headlines from a public news RSS feed. */
export async function fetchNews(): Promise<NewsItem[]> {
  const key = "news:laliga";
  const cached = await readCache(key);
  if (cached?.fresh) return cached.payload as NewsItem[];

  const url =
    "https://news.google.com/rss/search?q=%22LaLiga%22+OR+%22La+Liga%22+football+when:7d&hl=en-US&gl=US&ceid=US:en";

  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (LALIGA app)" } });
    if (!res.ok) {
      console.error(`news feed failed [${res.status}]`);
      return (cached?.payload as NewsItem[]) ?? [];
    }
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 30)
      .map((match) => {
        const block = match[1] ?? "";
        const rawTitle = tag(block, "title");
        const parts = rawTitle.split(" - ");
        const trailingSource = parts.length > 1 ? (parts.pop() ?? "") : "";
        return {
          title: parts.length > 0 && trailingSource ? parts.join(" - ") : rawTitle,
          link: tag(block, "link"),
          source: tag(block, "source") || trailingSource || "News",
          published: tag(block, "pubDate"),
        } satisfies NewsItem;
      })
      .filter((item) => item.title && item.link);

    await writeCache(key, items, 1800);
    return items;
  } catch (error) {
    console.error("news feed threw", error);
    return (cached?.payload as NewsItem[]) ?? [];
  }
}
