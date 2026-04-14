import Link from "next/link";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getSupabaseServer } from "@/lib/supabase";

type ProductRow = {
  id: string;
  product_name: string;
  price: string | null;
  product_category: string | null;
  campaign_id: string;
  is_active: boolean;
};

type CampaignRow = {
  id: string;
  name: string;
  theme: string;
};

export default async function AdminProductsPage() {
  let products: ProductRow[] = [];
  let campaigns: CampaignRow[] = [];
  let dataError = "";

  try {
    const supabase = getSupabaseServer();
    const [productsRes, campaignsRes] = await Promise.all([
      supabase
        .from("affiliate_links")
        .select("id,product_name,price,product_category,campaign_id,is_active")
        .order("created_at", { ascending: false }),
      supabase.from("campaigns").select("id,name,theme"),
    ]);

    products = (productsRes.data ?? []) as ProductRow[];
    campaigns = (campaignsRes.data ?? []) as CampaignRow[];
  } catch (error) {
    dataError = error instanceof Error ? error.message : "Failed to load products.";
  }

  const campaignMap = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage manually entered affiliate products for posting.
          </p>
        </div>
        <Link href="/admin/products/add" className={cn(buttonVariants())}>
          Add Product
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          {dataError ? (
            <p className="text-sm text-destructive">{dataError}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Theme</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No products yet.
                    </TableCell>
                  </TableRow>
                ) : null}
                {products.map((product) => {
                  const campaign = campaignMap.get(product.campaign_id);
                  const theme = product.product_category || campaign?.theme || "general";

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell>{product.price ?? "-"}</TableCell>
                      <TableCell className="capitalize">{theme}</TableCell>
                      <TableCell>{campaign?.name ?? "Unknown campaign"}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ProductRowActions id={product.id} isActive={product.is_active} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
