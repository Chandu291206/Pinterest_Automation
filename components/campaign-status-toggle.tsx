"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  campaignId: string;
  currentStatus: string | null;
};

export function CampaignStatusToggle({ campaignId, currentStatus }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isActive = currentStatus === "active";

  async function handleClick() {
    setErrorMessage("");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isActive ? "paused" : "active" }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to update campaign status.");
      }
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update campaign status.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-1 text-right">
      <Button onClick={handleClick} disabled={isLoading} variant={isActive ? "secondary" : "default"}>
        {isLoading ? "Updating..." : isActive ? "Pause Campaign" : "Resume Campaign"}
      </Button>
      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
