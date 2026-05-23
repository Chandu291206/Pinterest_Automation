import { NextResponse } from "next/server";

import { getSettings, setSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_KEYS = new Set([
  "llm_provider",
  "openai_model",
  "default_posting_interval_hours",
  "auto_post_bypass",
]);

export async function GET() {
  try {
    const map = await getSettings(Array.from(ALLOWED_KEYS));
    const settings = {};
    for (const key of ALLOWED_KEYS) {
      settings[key] = map.get(key) ?? "";
    }

    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const incoming = body?.settings;

    if (!incoming || typeof incoming !== "object") {
      return NextResponse.json({ error: "settings object is required." }, { status: 400 });
    }

    const payload = {};
    for (const [key, value] of Object.entries(incoming)) {
      if (!ALLOWED_KEYS.has(key)) continue;
      payload[key] = String(value ?? "");
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No valid settings provided." }, { status: 400 });
    }

    await setSettings(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
