import Link from "next/link";
import { HomeGrid } from "@/components/public/home-grid";
import { fetchLatestPostedProducts, formatThemeLabel } from "@/lib/public-products";

export default async function HomePage() {
  const items = await fetchLatestPostedProducts({ limit: 12 });
  const uniqueThemes = Array.from(new Set(items.map((item) => item.theme.toLowerCase())));

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <section className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Curated picks, tested and loved
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base">
            Discover standout Amazon finds across fitness, tech, fashion, home, and beauty.
            Handpicked collections built for practical everyday wins.
          </p>
          {uniqueThemes.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {uniqueThemes.map((theme) => (
                <Link
                  key={theme}
                  href={`/niche/${theme}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
                >
                  Explore {formatThemeLabel(theme)}
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <HomeGrid items={items} />
      </div>
    </main>
  );
}
