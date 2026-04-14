"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  affiliateLinkId: string;
  isActive: boolean;
};

export function AffiliateLinkToggle({ affiliateLinkId, isActive }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleClick() {
    setErrorMessage("");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/affiliate-links/${affiliateLinkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to update affiliate link.");
      }
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update affiliate link.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button size="sm" variant={isActive ? "secondary" : "default"} onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Saving..." : isActive ? "Set Inactive" : "Set Active"}
      </Button>
      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
