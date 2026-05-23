import { NextResponse } from "next/server";

import { getSetting } from "@/lib/settings";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validThemes = new Set(["fitness", "tech", "fashion", "home", "beauty", "productivity"]);
const validIntervals = new Set([1, 2, 4, 6, 12, 24]);

function normalizeKeywords(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseServer()
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaigns: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list campaigns.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const name = String(body?.name ?? "").trim();
    const theme = String(body?.theme ?? "").trim().toLowerCase();
    const boardId = String(body?.board_id ?? "").trim();
    const postsPerDayRaw = Number(body?.posts_per_day ?? 3);
    const postsPerDay = Number.isFinite(postsPerDayRaw)
      ? Math.min(10, Math.max(1, Math.trunc(postsPerDayRaw)))
      : 3;

    const intervalRaw = Number(body?.interval_hours ?? 0);
    const defaultInterval = Number(await getSetting("default_posting_interval_hours", "1"));
    const fallbackInterval = Number.isFinite(defaultInterval) ? defaultInterval : 1;
    const intervalHours = validIntervals.has(intervalRaw) ? intervalRaw : fallbackInterval;

    const amazonKeywords = normalizeKeywords(body?.amazon_keywords);

    if (!name) {
      return NextResponse.json({ error: "Campaign name is required." }, { status: 400 });
    }

    if (!validThemes.has(theme)) {
      return NextResponse.json({ error: "Invalid theme value." }, { status: 400 });
    }

    if (!boardId) {
      return NextResponse.json({ error: "Pinterest Board ID is required." }, { status: 400 });
    }

    const { data, error } = await getSupabaseServer()
      .from("campaigns")
      .insert({
        name,
        theme,
        amazon_keywords: amazonKeywords,
        posts_per_day: postsPerDay,
        board_id: boardId,
        status: "active",
        interval_hours: intervalHours,
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Failed to create campaign." }, { status: 500 });
    }

    return NextResponse.json({ campaign: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
