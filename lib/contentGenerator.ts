import "server-only";
import OpenAI from "openai";

export type GeneratePinContentParams = {
  theme: string;
  productName: string;
  productPrice: string;
  trendingTerms: string[];
  variant: "a" | "b";
  pinFormat: "single" | "collage";
  relatedProducts?: string[];
};

export type PinContent = {
  title: string;
  description: string;
  hashtags: string[];
  overlay_headline: string;
  price_badge_text: string;
};

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("Missing environment variable: OPENAI_API_KEY");
  }

  openaiClient = new OpenAI({
    apiKey: openaiApiKey,
  });
  return openaiClient;
}

function normalizeHashtags(input: unknown, fallbackTerms: string[]): string[] {
  const raw: string[] = Array.isArray(input)
    ? input.filter((item): item is string => typeof item === "string")
    : typeof input === "string"
    ? input
        .split(/[,\n]/g)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const cleaned = raw
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .map((tag) => `#${tag.replace(/\s+/g, "")}`);

  const deduped: string[] = [];
  for (const tag of cleaned) {
    if (!deduped.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      deduped.push(tag);
    }
  }

  const fallback = fallbackTerms
    .map((term) => term.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .map((term) => `#${term.replace(/\s+/g, "")}`);

  for (const tag of fallback) {
    if (deduped.length >= 18) break;
    if (!deduped.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      deduped.push(tag);
    }
  }

  while (deduped.length < 18) {
    deduped.push(`#pinidea${deduped.length + 1}`);
  }

  return deduped.slice(0, 18);
}

function safeWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function safeChars(text: string, maxChars: number): string {
  const trimmed = text.trim();
  return trimmed.length <= maxChars ? trimmed : `${trimmed.slice(0, maxChars - 3).trim()}...`;
}

function ensureSoftCta(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) {
    return "Discover how this pick can fit your routine, and explore more details when you are ready.";
  }

  if (/[.?!]\s*$/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}.`;
}

export async function generatePinContent(
  params: GeneratePinContentParams
): Promise<PinContent> {
  const openai = getOpenAIClient();
  const styleInstruction =
    params.variant === "a"
      ? "Variant a style: benefit-focused and educational."
      : "Variant b style: aspirational and lifestyle-focused.";

  const collageInstruction =
    params.pinFormat === "collage"
      ? "Pin format is collage: title must clearly reference a collection/set of products."
      : "Pin format is single: title should focus on one hero product.";

  const userPrompt = [
    "Generate Pinterest pin copy as valid JSON with keys:",
    "title, description, hashtags, overlay_headline, price_badge_text",
    "",
    "Rules:",
    "- title: max 100 chars, include 1-2 trending terms, no clickbait",
    "- description: 150-200 words, end with a soft CTA",
    "- hashtags: exactly 18 tags total (4 ultra-niche, 8 niche, 6 broad)",
    "- overlay_headline: max 6 words for image text overlay",
    '- price_badge_text: short price string or "Shop the List" for collages',
    "",
    styleInstruction,
    collageInstruction,
    "",
    `Theme: ${params.theme}`,
    `Product name: ${params.productName}`,
    `Product price: ${params.productPrice}`,
    `Trending terms: ${params.trendingTerms.join(", ") || "none provided"}`,
    `Variant: ${params.variant}`,
    `Pin format: ${params.pinFormat}`,
    `Related products: ${params.relatedProducts?.join(", ") || "none"}`,
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a Pinterest SEO expert. You always return strict JSON only, with no markdown or extra text.",
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Failed to parse JSON response from OpenAI: ${String(error)}`);
  }

  const fallbackTerms = [
    params.theme,
    ...params.trendingTerms,
    ...((params.relatedProducts ?? []).slice(0, 4) || []),
  ];

  const title = safeChars(String(parsed?.title ?? `${params.productName} Ideas`), 100);
  const description = ensureSoftCta(String(parsed?.description ?? "").trim());
  const hashtags = normalizeHashtags(parsed?.hashtags, fallbackTerms);
  const overlayHeadline = safeWords(String(parsed?.overlay_headline ?? params.theme), 6);
  const priceBadgeText =
    params.pinFormat === "collage"
      ? "Shop the List"
      : safeChars(String(parsed?.price_badge_text ?? params.productPrice), 24);

  return {
    title,
    description,
    hashtags,
    overlay_headline: overlayHeadline,
    price_badge_text: priceBadgeText,
  };
}
