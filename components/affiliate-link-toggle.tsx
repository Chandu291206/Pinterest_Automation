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

  async function handleClick() {
    setIsLoading(true);
    try {
      await fetch(`/api/affiliate-links/${affiliateLinkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button size="sm" variant={isActive ? "secondary" : "default"} onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Saving..." : isActive ? "Set Inactive" : "Set Active"}
    </Button>
  );
}
