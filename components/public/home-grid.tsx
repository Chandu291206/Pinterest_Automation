"use client";

import { useMemo, useState } from "react";
import { PublicProductCard, formatThemeLabel } from "@/lib/public-products";
import { ProductCard } from "@/components/public/product-card";

const DEFAULT_THEMES = ["fitness", "tech", "fashion", "home", "beauty", "productivity"];

export function HomeGrid({ items }: { items: PublicProductCard[] }) {
  const themes = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.theme.toLowerCase())));
    const extras = unique.filter((theme) => !DEFAULT_THEMES.includes(theme));
    return ["all", ...DEFAULT_THEMES, ...extras];
  }, [items]);

  const [activeTheme, setActiveTheme] = useState("all");

  const filteredItems = useMemo(() => {
    if (activeTheme === "all") return items;
    return items.filter((item) => item.theme.toLowerCase() === activeTheme);
  }, [activeTheme, items]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {themes.map((theme) => {
          const isActive = theme === activeTheme;
          return (
            <button
              key={theme}
              type="button"
              onClick={() => setActiveTheme(theme)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {theme === "all" ? "All" : formatThemeLabel(theme)}
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-gray-500">No products available for this filter yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <ProductCard key={item.pinId} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
