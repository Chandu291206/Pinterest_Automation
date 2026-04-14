import { AddProductForm } from "@/components/admin/add-product-form";
import { getSupabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type CampaignRow = {
  id: string;
  name: string;
  theme: string;
};

export default async function AddProductPage() {
  const { data, error } = await getSupabaseServer()
    .from("campaigns")
    .select("id,name,theme")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load campaigns: {error.message}
      </div>
    );
  }

  const campaigns = (data ?? []) as CampaignRow[];
  return <AddProductForm campaigns={campaigns} />;
}
