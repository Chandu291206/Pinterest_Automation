import ReviewClientPage from "@/app/admin/review/review-client";
import { getSupabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("pins")
    .select("id,title,description,hashtags,image_url,status,product_id,campaign_id")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-sm text-destructive">Failed to load drafts: {error.message}</p>;
  }

  const drafts = data ?? [];

  let productMap = new Map();
  if (drafts.length > 0) {
    const productIds = Array.from(new Set(drafts.map((pin) => pin.product_id).filter(Boolean)));
    const productRes = await supabase
      .from("products")
      .select("id,product_name")
      .in("id", productIds);

    productMap = new Map((productRes.data ?? []).map((row) => [row.id, row.product_name]));
  }

  const withProducts = drafts.map((pin) => ({
    ...pin,
    product_name: productMap.get(pin.product_id) || "Product",
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Pin Review Queue</h1>
        <p className="text-sm text-muted-foreground">
          Review draft pins before posting to Pinterest.
        </p>
      </header>

      <ReviewClientPage drafts={withProducts} />
    </div>
  );
}
