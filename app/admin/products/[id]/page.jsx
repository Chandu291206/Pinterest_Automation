import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductImageManager } from "@/components/admin/product-image-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }) {
  const id = String(params?.id ?? "").trim();
  if (!id) notFound();

  const { data, error } = await getSupabaseServer()
    .from("products")
    .select("id,product_name,image_url,images,affiliate_url")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const images = Array.isArray(data.images) && data.images.length > 0
    ? data.images
    : data.image_url
      ? [data.image_url]
      : [];

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/products" className="text-sm text-muted-foreground hover:underline">
          {"< Back to products"}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{data.product_name}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate URL</CardTitle>
        </CardHeader>
        <CardContent>
          <a href={data.affiliate_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
            {data.affiliate_url}
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images (max 4)</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductImageManager productId={data.id} initialImages={images} />
        </CardContent>
      </Card>
    </div>
  );
}
