import { AddProductForm } from "@/components/admin/add-product-form";
import { getSupabaseServer } from "@/lib/supabase";

type CampaignRow = {
  id: string;
  name: string;
  theme: string;
};

export default async function AddProductPage() {
  const { data } = await getSupabaseServer()
    .from("campaigns")
    .select("id,name,theme")
    .order("created_at", { ascending: false });

  const campaigns = (data ?? []) as CampaignRow[];
  return <AddProductForm campaigns={campaigns} />;
}
