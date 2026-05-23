import SettingsClient from "@/app/admin/settings/settings-client";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const map = await getSettings([
    "llm_provider",
    "openai_model",
    "default_posting_interval_hours",
    "auto_post_bypass",
  ]);

  const initial = {
    llm_provider: map.get("llm_provider") || "openai",
    openai_model: map.get("openai_model") || "gpt-4o-mini",
    default_posting_interval_hours: map.get("default_posting_interval_hours") || "1",
    auto_post_bypass: map.get("auto_post_bypass") || "false",
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage LLM provider, model, and posting defaults.
        </p>
      </header>

      <SettingsClient initial={initial} />
    </div>
  );
}
