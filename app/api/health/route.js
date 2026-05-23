import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function checkSupabase() {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    return !error;
  } catch {
    return false;
  }
}

async function checkOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return false;

  try {
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return true;
  } catch (error) {
    if (typeof error?.status === "number" && error.status !== 401 && error.status !== 403) {
      return true;
    }
    return false;
  }
}

export async function GET() {
  const [supabaseOk, openaiOk] = await Promise.all([checkSupabase(), checkOpenAI()]);

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env_check: {
      supabase: supabaseOk,
      openai: openaiOk,
    },
  });
}
