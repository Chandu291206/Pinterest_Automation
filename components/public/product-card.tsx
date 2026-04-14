import Link from "next/link";
import { formatThemeLabel, PublicProductCard } from "@/lib/public-products";

export function ProductCard({ item }: { item: PublicProductCard }) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.productName}
          className="h-56 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-56 w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
          No image
        </div>
      )}

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
            {formatThemeLabel(item.theme)}
          </span>
          {item.price ? (
            <span className="text-sm font-semibold text-gray-900">{item.price}</span>
          ) : (
            <span className="text-sm text-gray-500">Price varies</span>
          )}
        </div>

        <h2 className="line-clamp-2 text-base font-semibold text-gray-900">{item.productName}</h2>

        <Link
          href={`/shop/${item.affiliateLinkId}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          View Product
        </Link>
      </div>
    </article>
  );
}
