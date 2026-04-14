import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validThemes = new Set([
  "fitness",
  "tech",
  "fashion",
  "home",
  "beauty",
  "productivity",
]);

function normalizePostingHours(value: unknown): number[] {
  if (!Array.isArray(value)) return [9, 14, 20];
  const normalized = value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 23)
    .map((item) => Math.trunc(item));
  return normalized.length > 0 ? Array.from(new Set(normalized)).sort((a, b) => a - b) : [9, 14, 20];
}

function normalizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body?.name ?? "").trim();
    const theme = String(body?.theme ?? "").trim().toLowerCase();
    const boardId = String(body?.board_id ?? "").trim();
    const postsPerDayRaw = Number(body?.posts_per_day ?? 3);
    const postsPerDay = Number.isFinite(postsPerDayRaw)
      ? Math.min(10, Math.max(1, Math.trunc(postsPerDayRaw)))
      : 3;
    const postingHours = normalizePostingHours(body?.posting_hours);
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
        posting_hours: postingHours,
        board_id: boardId,
        status: "active",
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create campaign." },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaign: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
