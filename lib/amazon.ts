// PA API integration — uncomment when Amazon approves API access
// For now all products are entered manually via /admin/products/add

export type AmazonProduct = {
  asin: string;
  title: string;
  url: string;
  imageUrl: string | null;
  price: string | null;
};

export async function searchAmazonProducts(): Promise<AmazonProduct[]> {
  return [];
}
