"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const intervalOptions = [1, 2, 4, 6, 12, 24];

export default function SettingsClient({ initial }) {
  const [llmProvider, setLlmProvider] = useState(initial.llm_provider || "openai");
  const [openaiModel, setOpenaiModel] = useState(initial.openai_model || "gpt-4o-mini");
  const [defaultInterval, setDefaultInterval] = useState(initial.default_posting_interval_hours || "1");
  const [autoPostBypass, setAutoPostBypass] = useState(initial.auto_post_bypass || "false");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            llm_provider: llmProvider,
            openai_model: openaiModel,
            default_posting_interval_hours: defaultInterval,
            auto_post_bypass: autoPostBypass,
          },
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to save settings.");
      }

      setMessage("Settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-2">
        <Label>LLM Provider</Label>
        <Select value={llmProvider} onValueChange={(value) => setLlmProvider(value || "openai") }>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="local">Local (Ollama)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>OpenAI Model</Label>
        <Select value={openaiModel} onValueChange={(value) => setOpenaiModel(value || "gpt-4o-mini") }>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
            <SelectItem value="gpt-4o">gpt-4o</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Default posting interval</Label>
        <Select value={defaultInterval} onValueChange={(value) => setDefaultInterval(value || "1") }>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Interval" />
          </SelectTrigger>
          <SelectContent>
            {intervalOptions.map((item) => (
              <SelectItem key={item} value={String(item)}>{item}h</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Auto-post bypass</Label>
        <Select value={autoPostBypass} onValueChange={(value) => setAutoPostBypass(value || "false") }>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Auto post" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Disabled (review queue)</SelectItem>
            <SelectItem value="true">Enabled (post directly)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={save} disabled={isSaving}>{isSaving ? "Saving..." : "Save settings"}</Button>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
