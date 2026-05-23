"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INTERVALS = [1, 2, 4, 6, 12, 24];

export function CampaignIntervalSelect({ campaignId, currentInterval }) {
  const router = useRouter();
  const [value, setValue] = useState(String(currentInterval || 1));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function save() {
    setErrorMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval_hours: Number(value) }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to update interval.");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update interval.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={(next) => setValue(next || "1") }>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Interval" />
          </SelectTrigger>
          <SelectContent>
            {INTERVALS.map((interval) => (
              <SelectItem key={interval} value={String(interval)}>
                {interval}h
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="sm" onClick={save} disabled={isSaving}>
          {isSaving ? "Saving..." : "Update"}
        </Button>
      </div>
      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
