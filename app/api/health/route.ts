import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function checkSupabase(): Promise<boolean> {
  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    return !error;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const redis = getRedis();
    const key = `healthcheck:${Date.now()}`;
    await redis.set(key, "ok", { ex: 15 });
    const value = await redis.get<string>(key);
    return value === "ok";
  } catch {
    return false;
  }
}

async function checkOpenAI(): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return false;

  try {
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return true;
  } catch (error: any) {
    if (typeof error?.status === "number" && error.status !== 401 && error.status !== 403) {
      return true;
    }
    return false;
  }
}

export async function GET() {
  const [supabaseOk, redisOk, openaiOk] = await Promise.all([
    checkSupabase(),
    checkRedis(),
    checkOpenAI(),
  ]);

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env_check: {
      supabase: supabaseOk,
      redis: redisOk,
      openai: openaiOk,
    },
  });
}
