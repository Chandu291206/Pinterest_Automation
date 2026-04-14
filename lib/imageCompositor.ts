import "server-only";
import sharp from "sharp";

type ThemeKey =
  | "fitness"
  | "tech"
  | "fashion"
  | "home"
  | "beauty"
  | "productivity"
  | "default";

type SingleProductPinParams = {
  productImageUrl: string;
  headline: string;
  priceBadge: string;
  theme: string;
};

type CollagePinParams = {
  productImageUrls: string[];
  headline: string;
  priceBadge: string;
  theme: string;
};

const PIN_WIDTH = 1000;
const PIN_HEIGHT = 1500;
const OUTPUT_QUALITY = 92;
const COLLAGE_GAP = 4;
const COLLAGE_WORKING_WIDTH = PIN_WIDTH + COLLAGE_GAP;
const COLLAGE_LEFT_OFFSET = 2;

const THEME_ACCENTS: Record<ThemeKey, string> = {
  fitness: "#E84855",
  tech: "#0066FF",
  fashion: "#C9A84C",
  home: "#4CAF50",
  beauty: "#E91E8C",
  productivity: "#7B2FBE",
  default: "#1A1A2E",
};

type Slot = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getAccentColor(theme: string): string {
  const key = theme.toLowerCase() as ThemeKey;
  return THEME_ACCENTS[key] ?? THEME_ACCENTS.default;
}

function splitHeadline(headline: string, maxCharsPerLine = 22, maxLines = 2): string[] {
  const words = headline.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["Shop This Pick"];

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) break;
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines);
}

function buildOverlaySvg(headline: string, priceBadge: string, theme: string): Buffer {
  const accentColor = getAccentColor(theme);
  const safeHeadlineLines = splitHeadline(headline).map(escapeXml);
  const safePriceBadge = escapeXml(priceBadge);

  const priceFontSize = 36;
  const shopFontSize = 34;
  const badgeHeight = 84;
  const badgeY = PIN_HEIGHT - 160 - badgeHeight;
  const leftBadgeX = 50;

  const priceTextWidth = Math.max(190, safePriceBadge.length * 20 + 56);
  const shopText = "Shop Now &#8594;";
  const shopBadgeWidth = 300;
  const shopBadgeX = PIN_WIDTH - 50 - shopBadgeWidth;

  const headlineBaseY = PIN_HEIGHT - 280;
  const headlineLineSpacing = 78;
  const headlineStartY =
    safeHeadlineLines.length === 1 ? headlineBaseY : headlineBaseY - headlineLineSpacing / 2;

  const headlineTspans = safeHeadlineLines
    .map((line, index) => {
      const y = headlineStartY + index * headlineLineSpacing;
      return `<tspan x="500" y="${y}">${line}</tspan>`;
    })
    .join("");

  const svg = `
  <svg width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 ${PIN_WIDTH} ${PIN_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bottomFade" x1="0" y1="${PIN_HEIGHT * 0.6}" x2="0" y2="${PIN_HEIGHT}" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="rgba(0,0,0,0)" />
        <stop offset="100%" stop-color="rgba(0,0,0,0.85)" />
      </linearGradient>
    </defs>

    <rect x="0" y="${PIN_HEIGHT * 0.6}" width="${PIN_WIDTH}" height="${PIN_HEIGHT * 0.4}" fill="url(#bottomFade)" />

    <text
      font-family="'Arial Black', Arial, sans-serif"
      font-size="64"
      font-weight="900"
      text-anchor="middle"
      fill="#FFFFFF"
      stroke="#000000"
      stroke-width="8"
      paint-order="stroke"
      letter-spacing="0.3"
    >
      ${headlineTspans}
    </text>

    <rect x="${leftBadgeX}" y="${badgeY}" width="${priceTextWidth}" height="${badgeHeight}" rx="42" ry="42" fill="${accentColor}" />
    <text
      x="${leftBadgeX + priceTextWidth / 2}"
      y="${badgeY + badgeHeight / 2 + 12}"
      font-family="Arial, sans-serif"
      font-size="${priceFontSize}"
      font-weight="700"
      fill="#FFFFFF"
      text-anchor="middle"
    >${safePriceBadge}</text>

    <rect x="${shopBadgeX}" y="${badgeY}" width="${shopBadgeWidth}" height="${badgeHeight}" rx="42" ry="42" fill="#FFFFFF" />
    <text
      x="${shopBadgeX + shopBadgeWidth / 2}"
      y="${badgeY + badgeHeight / 2 + 10}"
      font-family="Arial, sans-serif"
      font-size="${shopFontSize}"
      font-weight="700"
      fill="${accentColor}"
      text-anchor="middle"
    >${shopText}</text>
  </svg>`;

  return Buffer.from(svg);
}

async function createFallbackTile(width: number, height: number): Promise<Buffer> {
  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#F4F4F5" />
    <text
      x="${Math.floor(width / 2)}"
      y="${Math.floor(height / 2)}"
      font-family="Arial, sans-serif"
      font-size="32"
      text-anchor="middle"
      fill="#71717A"
    >Image unavailable</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function getCollageSlots(count: number): Slot[] {
  if (count === 2) {
    return [
      { left: 0, top: 0, width: 500, height: 900 },
      { left: 500 + COLLAGE_GAP, top: 0, width: 500, height: 900 },
    ];
  }

  if (count === 3) {
    return [
      { left: 0, top: 0, width: 500, height: 700 },
      { left: 500 + COLLAGE_GAP, top: 0, width: 500, height: 700 },
      { left: COLLAGE_LEFT_OFFSET, top: 700 + COLLAGE_GAP, width: 1000, height: 500 },
    ];
  }

  if (count === 4) {
    return [
      { left: 0, top: 0, width: 500, height: 600 },
      { left: 500 + COLLAGE_GAP, top: 0, width: 500, height: 600 },
      { left: 0, top: 600 + COLLAGE_GAP, width: 500, height: 600 },
      { left: 500 + COLLAGE_GAP, top: 600 + COLLAGE_GAP, width: 500, height: 600 },
    ];
  }

  throw new Error("Collage supports only 2 to 4 product images.");
}

export async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!buffer.length) {
    throw new Error(`Downloaded image is empty: ${url}`);
  }
  return buffer;
}

export async function resizeToFill(
  buffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  return sharp(buffer)
    .resize(width, height, {
      fit: "cover",
      position: "centre",
    })
    .toBuffer();
}

export async function createSingleProductPin(
  params: SingleProductPinParams
): Promise<Buffer> {
  const productBuffer = await fetchImageBuffer(params.productImageUrl);
  const background = await resizeToFill(productBuffer, PIN_WIDTH, PIN_HEIGHT);
  const overlay = buildOverlaySvg(params.headline, params.priceBadge, params.theme);

  return sharp(background)
    .composite([
      {
        input: overlay,
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: OUTPUT_QUALITY })
    .toBuffer();
}

export async function createCollagePin(params: CollagePinParams): Promise<Buffer> {
  const { productImageUrls } = params;
  if (productImageUrls.length < 2 || productImageUrls.length > 4) {
    throw new Error("createCollagePin requires 2 to 4 product image URLs.");
  }

  const slots = getCollageSlots(productImageUrls.length);
  const resizedBuffers = await Promise.all(
    productImageUrls.map(async (url, index) => {
      const slot = slots[index];
      try {
        const source = await fetchImageBuffer(url);
        return await resizeToFill(source, slot.width, slot.height);
      } catch (error) {
        console.error(`Collage image fetch failed for URL "${url}":`, error);
        return createFallbackTile(slot.width, slot.height);
      }
    })
  );

  const collageBase = sharp({
    create: {
      width: COLLAGE_WORKING_WIDTH,
      height: PIN_HEIGHT,
      channels: 3,
      background: "#FFFFFF",
    },
  });

  const withTiles = collageBase.composite(
    resizedBuffers.map((buffer, index) => ({
      input: buffer,
      left: slots[index].left,
      top: slots[index].top,
    }))
  );

  const croppedToPinSize = await withTiles
    .extract({
      left: COLLAGE_LEFT_OFFSET,
      top: 0,
      width: PIN_WIDTH,
      height: PIN_HEIGHT,
    })
    .png()
    .toBuffer();

  const overlay = buildOverlaySvg(params.headline, params.priceBadge, params.theme);

  return sharp(croppedToPinSize)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: OUTPUT_QUALITY })
    .toBuffer();
}

export async function uploadPinImage(buffer: Buffer, pinId: string): Promise<string> {
  const filePath = `pins/${pinId}.jpg`;
  const { getSupabaseServer } = await import("./supabase");
  const supabaseServer = getSupabaseServer();

  const { error } = await supabaseServer.storage.from("pin-images").upload(filePath, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload pin image: ${error.message}`);
  }

  const { data } = supabaseServer.storage.from("pin-images").getPublicUrl(filePath);
  return data.publicUrl;
}

