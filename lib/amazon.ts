import "server-only";
import crypto from "node:crypto";

type AmazonProduct = {
  asin: string;
  title: string;
  url: string;
  imageUrl: string | null;
  price: string | null;
};

const AMAZON_HOST = "webservices.amazon.com";
const AMAZON_REGION = "us-east-1";
const AMAZON_SERVICE = "ProductAdvertisingAPI";
const AMAZON_TARGET = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
const AMAZON_PATH = "/paapi5/searchitems";
const AMAZON_ENDPOINT = `https://${AMAZON_HOST}${AMAZON_PATH}`;

function hmac(key: Buffer | string, value: string): Buffer {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest();
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function getAmzDates() {
  const now = new Date();
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function buildAuthorizationHeader(params: {
  accessKey: string;
  secretKey: string;
  amzDate: string;
  dateStamp: string;
  payload: string;
}) {
  const canonicalHeaders = [
    "content-encoding:amz-1.0",
    "content-type:application/json; charset=utf-8",
    `host:${AMAZON_HOST}`,
    `x-amz-date:${params.amzDate}`,
    `x-amz-target:${AMAZON_TARGET}`,
  ].join("\n");

  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const payloadHash = sha256(params.payload);

  const canonicalRequest = [
    "POST",
    AMAZON_PATH,
    "",
    canonicalHeaders,
    "",
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${params.dateStamp}/${AMAZON_REGION}/${AMAZON_SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    params.amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${params.secretKey}`, params.dateStamp);
  const kRegion = hmac(kDate, AMAZON_REGION);
  const kService = hmac(kRegion, AMAZON_SERVICE);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${params.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return authorization;
}

export async function searchAmazonProducts(
  keywords: string,
  searchIndex: string
): Promise<AmazonProduct[]> {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const associateTag = process.env.AMAZON_ASSOCIATE_TAG;

  if (!accessKey || !secretKey || !associateTag) {
    console.error("[amazon] Missing one or more required environment variables.");
    return [];
  }

  try {
    const body = JSON.stringify({
      Keywords: keywords,
      SearchIndex: searchIndex,
      PartnerTag: associateTag,
      PartnerType: "Associates",
      Marketplace: "www.amazon.com",
      Resources: ["ItemInfo.Title", "Offers.Listings.Price", "Images.Primary.Large"],
    });

    const { amzDate, dateStamp } = getAmzDates();
    const authorization = buildAuthorizationHeader({
      accessKey,
      secretKey,
      amzDate,
      dateStamp,
      payload: body,
    });

    const response = await fetch(AMAZON_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Encoding": "amz-1.0",
        "Content-Type": "application/json; charset=utf-8",
        Host: AMAZON_HOST,
        "X-Amz-Date": amzDate,
        "X-Amz-Target": AMAZON_TARGET,
        Authorization: authorization,
      },
      body,
      cache: "no-store",
    });

    const rawResponse = await response.text();
    console.log("[amazon] Raw API response:", rawResponse);

    if (!response.ok) {
      console.error(`[amazon] SearchItems failed with status ${response.status}`);
      return [];
    }

    let data: any;
    try {
      data = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error("[amazon] Failed to parse API response JSON:", parseError);
      return [];
    }

    if (Array.isArray(data?.Errors) && data.Errors.length > 0) {
      console.error("[amazon] API returned errors:", data.Errors);
    }

    const items = Array.isArray(data?.SearchResult?.Items) ? data.SearchResult.Items : [];

    const mappedItems: Array<AmazonProduct | null> = items.map((item: any) => {
        const asin = typeof item?.ASIN === "string" ? item.ASIN : "";
        const title =
          typeof item?.ItemInfo?.Title?.DisplayValue === "string"
            ? item.ItemInfo.Title.DisplayValue
            : "";
        const imageUrl =
          typeof item?.Images?.Primary?.Large?.URL === "string"
            ? item.Images.Primary.Large.URL
            : null;
        const price =
          typeof item?.Offers?.Listings?.[0]?.Price?.DisplayAmount === "string"
            ? item.Offers.Listings[0].Price.DisplayAmount
            : null;

        if (!asin || !title) {
          return null;
        }

        return {
          asin,
          title,
          url: `https://www.amazon.com/dp/${asin}?tag=${associateTag}`,
          imageUrl,
          price,
        } satisfies AmazonProduct;
      });

    return mappedItems.filter(
      (item: AmazonProduct | null): item is AmazonProduct => item !== null
    );
  } catch (error) {
    console.error("[amazon] Unexpected SearchItems error:", error);
    return [];
  }
}
