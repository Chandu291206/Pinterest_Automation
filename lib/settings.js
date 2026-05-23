import { getSupabaseServer } from "@/lib/supabase";

export async function getSettings(keys) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.from("settings").select("key,value").in("key", keys);

  if (error) {
    throw new Error(`Failed to load settings: ${error.message}`);
  }

  const map = new Map();
  for (const row of data ?? []) {
    map.set(String(row.key), String(row.value ?? ""));
  }

  return map;
}

export async function getSetting(key, fallback = "") {
  const map = await getSettings([key]);
  return map.get(key) ?? fallback;
}

export async function setSettings(entries) {
  const supabase = getSupabaseServer();
  const payload = Object.entries(entries).map(([key, value]) => ({
    key,
    value: String(value ?? ""),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("settings")
    .upsert(payload, { onConflict: "key" });

  if (error) {
    throw new Error(`Failed to save settings: ${error.message}`);
  }
}
