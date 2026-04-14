import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/public/product-card";
import { fetchLatestPostedProducts, formatThemeLabel } from "@/lib/public-products";

const allowedThemes = new Set([
  "fitness",
  "tech",
  "fashion",
  "home",
  "beauty",
  "productivity",
]);

export default async function NicheThemePage({ params }: { params: { theme: string } }) {
  const theme = params.theme.toLowerCase();
  if (!allowedThemes.has(theme)) {
    notFound();
  }

  const items = await fetchLatestPostedProducts({ limit: 48, theme });

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="space-y-2">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            Back to homepage
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900">{formatThemeLabel(theme)} Picks</h1>
          <p className="text-sm text-gray-600">
            Explore curated products in the {formatThemeLabel(theme).toLowerCase()} niche.
          </p>
        </header>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No posted products found for this theme yet.</p>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ProductCard key={item.pinId} item={item} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
