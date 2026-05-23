"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const themeOptions = ["fitness", "tech", "fashion", "home", "beauty", "productivity"];
const intervalOptions = [1, 2, 4, 6, 12, 24];

export default function NewCampaignPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [theme, setTheme] = useState("fitness");
  const [amazonKeywords, setAmazonKeywords] = useState("");
  const [postsPerDay, setPostsPerDay] = useState(3);
  const [intervalHours, setIntervalHours] = useState("1");
  const [boardId, setBoardId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const keywords = amazonKeywords
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          theme,
          amazon_keywords: keywords,
          posts_per_day: postsPerDay,
          interval_hours: Number(intervalHours),
          board_id: boardId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to create campaign");
      }

      const payload = await response.json();
      const campaignId = payload?.campaign?.id;
      router.push(campaignId ? `/admin/campaigns/${campaignId}` : "/admin/campaigns");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create campaign.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Campaign</h1>
          <p className="text-sm text-muted-foreground">
            Set up publishing cadence and product discovery settings.
          </p>
        </div>
        <Link href="/admin/campaigns" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Campaigns
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="campaign-name">Campaign name</Label>
              <Input
                id="campaign-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Summer Fitness Essentials"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-theme">Theme</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value || "fitness")}>
                <SelectTrigger id="campaign-theme" className="w-full">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-keywords">Amazon keywords (comma-separated)</Label>
              <Input
                id="campaign-keywords"
                value={amazonKeywords}
                onChange={(event) => setAmazonKeywords(event.target.value)}
                placeholder="adjustable dumbbells, workout bands, yoga mat"
              />
            </div>

            <div className="grid gap-2">
              <Label>Posts per day: {postsPerDay}</Label>
              <Slider
                value={[postsPerDay]}
                onValueChange={(values) => {
                  const nextValue = Array.isArray(values) ? values[0] : values;
                  setPostsPerDay(typeof nextValue === "number" ? nextValue : 3);
                }}
                min={1}
                max={10}
                step={1}
              />
            </div>

            <div className="grid gap-2">
              <Label>Post every</Label>
              <Select value={intervalHours} onValueChange={(value) => setIntervalHours(value || "1") }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {intervalOptions.map((interval) => (
                    <SelectItem key={interval} value={String(interval)}>
                      {interval} hour{interval > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="board-id">Pinterest Board ID</Label>
              <Input
                id="board-id"
                value={boardId}
                onChange={(event) => setBoardId(event.target.value)}
                placeholder="123456789012345678"
                required
              />
            </div>

            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Campaign"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
