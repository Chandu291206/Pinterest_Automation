import "server-only";

type PostPinParams = {
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  boardId: string;
};

type PinAnalytics = {
  impressions: number;
  saves: number;
  clicks: number;
};

function getPinterestAccessToken(): string {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing environment variable: PINTEREST_ACCESS_TOKEN");
  }
  return token;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getMetricValue(payload: any, name: string): number {
  const lowerName = name.toLowerCase();

  const direct =
    payload?.[name] ??
    payload?.[lowerName] ??
    payload?.all?.[name] ??
    payload?.all?.[lowerName] ??
    payload?.data?.[name] ??
    payload?.data?.[lowerName];

  if (direct !== undefined) {
    return toNumber(direct);
  }

  const metricsArray = payload?.metrics ?? payload?.data?.metrics;
  if (Array.isArray(metricsArray)) {
    const metricItem = metricsArray.find((item: any) => {
      const metricType = String(item?.metric_type ?? item?.metricType ?? "").toLowerCase();
      return metricType === lowerName;
    });
    if (metricItem) {
      return toNumber(metricItem?.value ?? metricItem?.sum);
    }
  }

  return 0;
}

export async function getTrendingTerms(theme: string): Promise<string[]> {
  const pinterestAccessToken = getPinterestAccessToken();
  const url = `https://api.pinterest.com/v5/trends/keywords/${encodeURIComponent(
    theme
  )}/top/monthly?region=US`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${pinterestAccessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pinterest trends request failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  const trends = Array.isArray(data?.data?.trends)
    ? data.data.trends
    : Array.isArray(data?.trends)
    ? data.trends
    : [];

  return trends
    .map((trend: any) => {
      if (typeof trend === "string") return trend;
      if (typeof trend?.keyword === "string") return trend.keyword;
      if (typeof trend?.term === "string") return trend.term;
      return "";
    })
    .filter(Boolean);
}

export async function postPin(params: PostPinParams): Promise<{ id: string }> {
  const pinterestAccessToken = getPinterestAccessToken();
  const response = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinterestAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: params.title,
      description: params.description,
      link: params.link,
      board_id: params.boardId,
      media_source: {
        source_type: "image_url",
        url: params.imageUrl,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pinterest post pin request failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  const id = data?.id ?? data?.data?.id;

  if (!id || typeof id !== "string") {
    throw new Error("Pinterest post pin response did not include a pin id");
  }

  return { id };
}

export async function getPinAnalytics(pinId: string): Promise<PinAnalytics> {
  const pinterestAccessToken = getPinterestAccessToken();
  const url = `https://api.pinterest.com/v5/pins/${encodeURIComponent(
    pinId
  )}/analytics?metric_types=IMPRESSION,SAVE,PIN_CLICK`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${pinterestAccessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pinterest analytics request failed: ${response.status} ${body}`);
  }

  const data = await response.json();

  return {
    impressions: getMetricValue(data, "IMPRESSION"),
    saves: getMetricValue(data, "SAVE"),
    clicks: getMetricValue(data, "PIN_CLICK"),
  };
}
