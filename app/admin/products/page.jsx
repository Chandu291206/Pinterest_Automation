import Link from "next/link";

import { ProductRowActions } from "@/components/admin/product-row-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getSupabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  let products = [];
  let campaigns = [];
  let dataError = "";

  try {
    const supabase = getSupabaseServer();
    const [productsRes, campaignsRes] = await Promise.all([
      supabase
        .from("products")
        .select("id,product_name,price,product_category,campaign_id,is_active,affiliate_source,clicks")
        .order("created_at", { ascending: false }),
      supabase.from("campaigns").select("id,name,theme"),
    ]);

    if (productsRes.error) {
      throw new Error(`Failed to load products: ${productsRes.error.message}`);
    }

    if (campaignsRes.error) {
      throw new Error(`Failed to load campaigns: ${campaignsRes.error.message}`);
    }

    products = productsRes.data ?? [];
    campaigns = campaignsRes.data ?? [];
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
                  <TableHead>Source</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No products yet.
                    </TableCell>
                  </TableRow>
                ) : null}
                {products.map((product) => {
                  const campaign = campaignMap.get(product.campaign_id);
                  const theme = product.product_category || campaign?.theme || "general";
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/products/${product.id}`} className="hover:underline">
                          {product.product_name}
                        </Link>
                      </TableCell>
                      <TableCell>{product.price ?? "-"}</TableCell>
                      <TableCell className="capitalize">{theme}</TableCell>
                      <TableCell className="capitalize">{product.affiliate_source ?? "amazon"}</TableCell>
                      <TableCell>{campaign?.name ?? "Unknown campaign"}</TableCell>
                      <TableCell>{Number(product.clicks ?? 0).toLocaleString()}</TableCell>
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
