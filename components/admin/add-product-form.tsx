"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";

const themeOptions = ["fitness", "tech", "fashion", "home", "beauty", "productivity"] as const;
const ASIN_REGEX = /(?:dp|product|amzn\.to)\/([A-Z0-9]{10})/i;

type CampaignOption = {
  id: string;
  name: string;
  theme: string;
};

type Props = {
  campaigns: CampaignOption[];
};

function parseAsin(url: string): string {
  const match = url.match(ASIN_REGEX);
  return match?.[1]?.toUpperCase() ?? "";
}

export function AddProductForm({ campaigns }: Props) {
  const router = useRouter();
  const hasCampaigns = campaigns.length > 0;
  const [productName, setProductName] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [theme, setTheme] = useState<string>("fitness");
  const [campaignId, setCampaignId] = useState<string>(campaigns[0]?.id ?? "");
  const [asin, setAsin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const parsedAsin = useMemo(() => parseAsin(affiliateUrl), [affiliateUrl]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          affiliate_url: affiliateUrl,
          image_url: imageUrl,
          price,
          theme,
          campaign_id: campaignId,
          asin: asin || parsedAsin || undefined,
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
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="affiliate-url">Amazon Affiliate URL</Label>
              <Input
                id="affiliate-url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="Paste SiteStripe link"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image-url">Product Image URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="$29.99"
              />
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
              <Select value={campaignId} onValueChange={(value) => setCampaignId(value || "")}>
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
              {!hasCampaigns ? (
                <p className="text-xs text-muted-foreground">
                  Create a campaign first, then add products.
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="asin">ASIN (optional)</Label>
              <Input
                id="asin"
                value={asin}
                onChange={(e) => setAsin(e.target.value.toUpperCase())}
                placeholder={parsedAsin || "Auto-parsed from URL if present"}
              />
              {parsedAsin ? (
                <p className="text-xs text-muted-foreground">Detected ASIN from URL: {parsedAsin}</p>
              ) : null}
            </div>

            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

            <Button type="submit" disabled={isSubmitting || !campaignId || !hasCampaigns}>
              {isSubmitting ? "Saving..." : "Add Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
