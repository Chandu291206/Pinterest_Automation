import "server-only";

import { getSettings, setSettings } from "@/lib/settings";

async function refreshPinterestAccessToken(refreshToken) {
  const clientId = process.env.PINTEREST_APP_ID;
  const clientSecret = process.env.PINTEREST_APP_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing PINTEREST_APP_ID or PINTEREST_APP_SECRET for token refresh.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinterest token refresh failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const accessToken = String(payload?.access_token ?? "").trim();
  const expiresIn = Number(payload?.expires_in ?? 0);
  const nextRefreshToken = String(payload?.refresh_token ?? refreshToken).trim();

  if (!accessToken) {
    throw new Error("Pinterest refresh response did not include access_token.");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + (Number.isFinite(expiresIn) ? expiresIn : 0);

  await setSettings({
    pinterest_access_token: accessToken,
    pinterest_refresh_token: nextRefreshToken,
    pinterest_token_expires_at: String(expiresAt),
  });

  return accessToken;
}

async function getValidAccessToken() {
  const settings = await getSettings([
    "pinterest_access_token",
    "pinterest_refresh_token",
    "pinterest_token_expires_at",
  ]);

  const accessToken = String(settings.get("pinterest_access_token") ?? "").trim();
  const refreshToken = String(settings.get("pinterest_refresh_token") ?? "").trim();
  const expiresAtRaw = Number(settings.get("pinterest_token_expires_at") ?? "0");
  const now = Math.floor(Date.now() / 1000);

  if (accessToken && Number.isFinite(expiresAtRaw) && expiresAtRaw - now > 86400) {
    return accessToken;
  }

  if (refreshToken) {
    return refreshPinterestAccessToken(refreshToken);
  }

  if (accessToken) {
    return accessToken;
  }

  const fallback = process.env.PINTEREST_ACCESS_TOKEN;
  if (!fallback) {
    throw new Error("Missing Pinterest access token. Connect Pinterest in /admin/pinterest-auth.");
  }

  return fallback;
}

function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getMetricValue(payload, name) {
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
    const metricItem = metricsArray.find((item) => {
      const metricType = String(item?.metric_type ?? item?.metricType ?? "").toLowerCase();
      return metricType === lowerName;
    });
    if (metricItem) {
      return toNumber(metricItem?.value ?? metricItem?.sum);
    }
  }

  return 0;
}

export async function getTrendingTerms(theme) {
  const pinterestAccessToken = await getValidAccessToken();
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
    .map((trend) => {
      if (typeof trend === "string") return trend;
      if (typeof trend?.keyword === "string") return trend.keyword;
      if (typeof trend?.term === "string") return trend.term;
      return "";
    })
    .filter(Boolean);
}

export async function postPin(params) {
  const pinterestAccessToken = await getValidAccessToken();
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

export async function getPinAnalytics(pinId) {
  const pinterestAccessToken = await getValidAccessToken();
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
