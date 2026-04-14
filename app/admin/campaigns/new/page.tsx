"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const postingHourOptions = [
  { value: 6, label: "6am" },
  { value: 9, label: "9am" },
  { value: 12, label: "12pm" },
  { value: 14, label: "2pm" },
  { value: 15, label: "3pm" },
  { value: 18, label: "6pm" },
  { value: 20, label: "8pm" },
  { value: 22, label: "10pm" },
];

const themeOptions = [
  "fitness",
  "tech",
  "fashion",
  "home",
  "beauty",
  "productivity",
] as const;

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<string>("fitness");
  const [amazonKeywords, setAmazonKeywords] = useState("");
  const [postsPerDay, setPostsPerDay] = useState<number>(3);
  const [postingHours, setPostingHours] = useState<number[]>([9, 14, 20]);
  const [boardId, setBoardId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function togglePostingHour(hour: number, checked: boolean) {
    setPostingHours((prev) => {
      const next = checked ? [...prev, hour] : prev.filter((item) => item !== hour);
      return Array.from(new Set(next)).sort((a, b) => a - b);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          theme,
          amazon_keywords: keywords,
          posts_per_day: postsPerDay,
          posting_hours: postingHours,
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

            <div className="grid gap-3">
              <Label>Posting hours</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {postingHourOptions.map((hourOption) => (
                  <label
                    key={hourOption.value}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm"
                  >
                    <Checkbox
                      checked={postingHours.includes(hourOption.value)}
                      onCheckedChange={(checked) =>
                        togglePostingHour(hourOption.value, Boolean(checked))
                      }
                    />
                    <span>{hourOption.label}</span>
                  </label>
                ))}
              </div>
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

            <Button type="submit" disabled={isSubmitting || postingHours.length === 0}>
              {isSubmitting ? "Creating..." : "Create Campaign"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
