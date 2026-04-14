"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const themeOptions = [
  "fitness",
  "tech",
  "fashion",
  "home",
  "beauty",
  "productivity",
];

export default function PinPreviewPage() {
  const [format, setFormat] = useState<"single" | "collage">("single");
  const [theme, setTheme] = useState("fitness");
  const [imageUrlsRaw, setImageUrlsRaw] = useState(
    "https://m.media-amazon.com/images/I/71GeRoUotCS.jpg\nhttps://m.media-amazon.com/images/I/41vF-oMm5XL.jpg"
  );
  const [headline, setHeadline] = useState("Top Picks for Your Routine");
  const [priceBadge, setPriceBadge] = useState("$29.99");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const parsedUrls = useMemo(
    () =>
      imageUrlsRaw
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean),
    [imageUrlsRaw]
  );

  async function handleGenerate() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/pins/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          theme,
          imageUrls: parsedUrls,
          headline,
          priceBadge,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to generate preview");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(objectUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Preview generation failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Pin Preview Tool</h1>
        <p className="text-sm text-muted-foreground">
          Test the image compositor visually before enabling live posting.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Preview Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Format</Label>
              <Select
                value={format}
                onValueChange={(value) => setFormat((value as "single" | "collage") ?? "single")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">single</SelectItem>
                  <SelectItem value="collage">collage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value ?? "fitness")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((item) => (
                    <SelectItem key={item} value={item} className="capitalize">
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Amazon product image URLs (one per line)</Label>
              <Textarea
                rows={7}
                value={imageUrlsRaw}
                onChange={(event) => setImageUrlsRaw(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Overlay headline</Label>
              <Input value={headline} onChange={(event) => setHeadline(event.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Price badge text</Label>
              <Input value={priceBadge} onChange={(event) => setPriceBadge(event.target.value)} />
            </div>

            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

            <Button onClick={handleGenerate} disabled={isLoading || parsedUrls.length === 0}>
              {isLoading ? "Generating..." : "Generate Preview"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            {previewUrl ? (
              <img src={previewUrl} alt="Pin preview output" className="w-full rounded-md border" />
            ) : (
              <div className="flex min-h-[500px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                Generate a preview to see the image output.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
