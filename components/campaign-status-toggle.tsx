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
  const isActive = currentStatus === "active";

  async function handleClick() {
    setIsLoading(true);
    try {
      await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isActive ? "paused" : "active" }),
      });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} variant={isActive ? "secondary" : "default"}>
      {isLoading ? "Updating..." : isActive ? "Pause Campaign" : "Resume Campaign"}
    </Button>
  );
}
