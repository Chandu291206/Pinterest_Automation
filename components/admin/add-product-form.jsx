"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const themeOptions = ["fitness", "tech", "fashion", "home", "beauty", "productivity"];
const sourceOptions = ["amazon", "flipkart", "shareasale", "cj", "other"];
const ASIN_REGEX = /(?:dp|product|amzn\.to)\/([A-Z0-9]{10})/i;

function parseAsin(url) {
  const match = url.match(ASIN_REGEX);
  return match?.[1]?.toUpperCase() ?? "";
}

async function uploadSingleImage(file) {
  const data = new FormData();
  data.append("file", file);

  const response = await fetch("/api/upload-product-image", {
    method: "POST",
    body: data,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Image upload failed.");
  }

  const payload = await response.json();
  return String(payload?.url ?? "").trim();
}

export function AddProductForm({ campaigns }) {
  const router = useRouter();
  const hasCampaigns = campaigns.length > 0;

  const [productName, setProductName] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState([]);
  const [price, setPrice] = useState("");
  const [theme, setTheme] = useState("fitness");
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [asin, setAsin] = useState("");
  const [affiliateSource, setAffiliateSource] = useState("amazon");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const parsedAsin = useMemo(() => parseAsin(affiliateUrl), [affiliateUrl]);

  async function handleUpload(event) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setErrorMessage("");
    setIsUploading(true);

    try {
      const roomLeft = Math.max(0, 4 - images.length);
      const uploadList = files.slice(0, roomLeft);
      const urls = [];

      for (const file of uploadList) {
        const url = await uploadSingleImage(file);
        if (url) urls.push(url);
      }

      setImages((prev) => [...prev, ...urls].slice(0, 4));
      if (!imageUrl && urls[0]) {
        setImageUrl(urls[0]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const allImages = [
        ...images,
        ...(imageUrl && !images.includes(imageUrl) ? [imageUrl] : []),
      ].slice(0, 4);

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          affiliate_url: affiliateUrl,
          image_url: allImages[0] || imageUrl,
          images: allImages,
          price,
          theme,
          campaign_id: campaignId,
          source_id: asin || parsedAsin || undefined,
          affiliate_source: affiliateSource,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to add product.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to add product.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Add Product</h1>
          <p className="text-sm text-muted-foreground">
            Manually add affiliate products for campaign posting.
          </p>
        </div>
        <Link href="/admin/products" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Products
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="affiliate-url">Affiliate URL</Label>
              <Input
                id="affiliate-url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="Paste affiliate link"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Affiliate Source</Label>
              <Select value={affiliateSource} onValueChange={(value) => setAffiliateSource(value || "amazon")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image-url">Primary Image URL</Label>
              <Input id="image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image-upload">Upload Product Images (up to 4)</Label>
              <Input id="image-upload" type="file" accept="image/*" multiple onChange={handleUpload} disabled={isUploading || images.length >= 4} />
              {isUploading ? <p className="text-xs text-muted-foreground">Uploading...</p> : null}
              {images.length > 0 ? (
                <div className="space-y-2">
                  {images.map((url, idx) => (
                    <div key={url} className="flex items-center gap-2 rounded border p-2 text-xs">
                      <span className="truncate">{idx + 1}. {url}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setImages((prev) => prev.filter((item) => item !== url))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$29.99" />
            </div>

            <div className="grid gap-2">
              <Label>Category/Theme</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value || "fitness")}>
                <SelectTrigger className="w-full">
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
              <Label>Campaign</Label>
              <Select value={campaignId} onValueChange={(value) => setCampaignId(value || "") }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {hasCampaigns ? (
                    campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name} ({campaign.theme})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No campaigns available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="asin">Source ID / ASIN (optional)</Label>
              <Input
                id="asin"
                value={asin}
                onChange={(e) => setAsin(e.target.value.toUpperCase())}
                placeholder={parsedAsin || "Auto-parsed from URL for Amazon"}
              />
            </div>

            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

            <Button type="submit" disabled={isSubmitting || isUploading || !campaignId || !hasCampaigns}>
              {isSubmitting ? "Saving..." : "Add Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
