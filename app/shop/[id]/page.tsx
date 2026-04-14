import OpenAI from "openai";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AffiliateLinkRow = {
  id: string;
  product_name: string;
  affiliate_url: string;
  image_url: string | null;
  price: string | null;
  benefits: string[] | null;
};

function sanitizeBenefits(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function fallbackBenefits(productName: string): string[] {
  return [
    `Designed to make ${productName} easier to use daily.`,
    "Simple setup with a clean, beginner-friendly experience.",
    "Reliable quality for long-term everyday performance.",
    "Great value pick for practical, real-world use.",
  ];
}

async function generateBenefits(productName: string): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackBenefits(productName);

  try {
    const openai = new OpenAI({ apiKey });
    const prompt = `Give me 4 short benefit bullet points for: ${productName}. Each bullet max 12 words. Return JSON array of strings.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a concise product copywriter. Return JSON only.",
        },
        {
          role: "user",
          content: `${prompt}\nUse this schema: {"bullets": ["..."]}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content;
    if (!text) return fallbackBenefits(productName);

    const parsed = JSON.parse(text);
    const bullets = sanitizeBenefits(parsed?.bullets);
    return bullets.length > 0 ? bullets : fallbackBenefits(productName);
  } catch {
    return fallbackBenefits(productName);
  }
}

async function incrementPinClicks(affiliateLinkId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: pins, error } = await supabase
      .from("pins")
      .select("id,clicks")
      .eq("affiliate_link_id", affiliateLinkId);

    if (error || !pins?.length) return;

    await Promise.all(
      pins.map((pin) =>
        supabase
          .from("pins")
          .update({ clicks: Number(pin.clicks ?? 0) + 1 })
          .eq("id", pin.id)
      )
    );
  } catch {
    // Do not block page rendering if analytics update fails.
  }
}

async function getAffiliateLink(id: string): Promise<AffiliateLinkRow | null> {
  const { data, error } = await getSupabaseServer()
    .from("affiliate_links")
    .select("id,product_name,affiliate_url,image_url,price,benefits")
    .eq("id", id)
    .maybeSingle();

  if (error) return null;
  return (data as AffiliateLinkRow | null) ?? null;
}

async function getOrCreateBenefits(link: AffiliateLinkRow): Promise<string[]> {
  const existingBenefits = sanitizeBenefits(link.benefits);
  if (existingBenefits.length > 0) {
    return existingBenefits;
  }

  const generated = await generateBenefits(link.product_name);

  try {
    await getSupabaseServer()
      .from("affiliate_links")
      .update({ benefits: generated })
      .eq("id", link.id);
  } catch {
    // Keep rendering with generated values even if write-back fails.
  }

  return generated;
}

export default async function ShopProductPage({ params }: { params: { id: string } }) {
  const link = await getAffiliateLink(params.id);
  if (!link?.affiliate_url || !link.product_name) {
    notFound();
  }

  const [benefits] = await Promise.all([
    getOrCreateBenefits(link),
    incrementPinClicks(link.id),
  ]);

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto w-full max-w-[480px] space-y-5">
        {link.image_url ? (
          <img
            src={link.image_url}
            alt={link.product_name}
            className="w-full rounded-2xl border object-cover"
          />
        ) : (
          <div className="flex h-72 w-full items-center justify-center rounded-2xl border bg-gray-50 text-sm text-gray-500">
            No product image available
          </div>
        )}

        <h1 className="text-2xl font-semibold leading-tight text-gray-900">{link.product_name}</h1>

        {link.price ? (
          <div>
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {link.price}
            </span>
          </div>
        ) : null}

        <ul className="space-y-2 text-sm text-gray-700">
          {benefits.map((benefit, idx) => (
            <li key={`${benefit}-${idx}`} className="flex items-start gap-2">
              <span className="mt-0.5 text-[#FF9900]">•</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <a
          href={link.affiliate_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block w-full rounded-xl bg-[#FF9900] px-4 py-3 text-center text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Buy on Amazon
        </a>

        <p className="pt-2 text-xs text-gray-500">
          As an Amazon Associate I earn from qualifying purchases
        </p>
      </div>
    </main>
  );
}
