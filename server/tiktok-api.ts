import axios from "axios";
import fs from "node:fs";
import path from "node:path";

export interface TikTokTokenBundle {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: string;
  scope?: string[];
  advertiserIds?: string[];
  state?: string;
  obtainedAt: string;
  source: "auth_code" | "refresh" | "manual_env";
}

const DATA_DIR = path.join(process.cwd(), ".data");
const TOKENS_FILE = path.join(DATA_DIR, "tiktok_tokens.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readTikTokTokens(): TikTokTokenBundle | null {
  try {
    if (!fs.existsSync(TOKENS_FILE)) return null;
    const raw = fs.readFileSync(TOKENS_FILE, "utf8");
    return JSON.parse(raw) as TikTokTokenBundle;
  } catch (error) {
    console.warn("Failed to read TikTok token cache", error);
    return null;
  }
}

export function writeTikTokTokens(bundle: TikTokTokenBundle): TikTokTokenBundle {
  ensureDataDir();
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(bundle, null, 2), "utf8");
  return bundle;
}

export function getTikTokBaseUrl(): string {
  const explicit = process.env.TIKTOK_API_BASE?.replace(/\/+$/, "");
  if (explicit) return explicit;
  const useSandbox = (process.env.TIKTOK_USE_SANDBOX || "").toLowerCase() === "true";
  return useSandbox
    ? "https://sandbox-ads.tiktok.com/open_api"
    : "https://business-api.tiktok.com/open_api";
}

export function buildTikTokAuthUrl(state?: string): string {
  const appId = process.env.TIKTOK_APP_ID;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!appId || !redirectUri) {
    throw new Error("TIKTOK_APP_ID and TIKTOK_REDIRECT_URI must be configured");
  }

  const params = new URLSearchParams({
    app_id: appId,
    state: state || "social-fetch-pro",
    redirect_uri: redirectUri,
    // Don't specify scope parameter - let TikTok show all approved scopes for the app
    // The user can then approve all scopes they want during authorization
  });

  // Portal auth always uses the business-api host, even when sandboxing API calls
  return `https://business-api.tiktok.com/portal/auth?${params.toString()}`;
}

function buildExpiresAt(expiresIn?: number): string | undefined {
  if (!expiresIn || expiresIn <= 0) return undefined;
  const ms = expiresIn * 1000;
  return new Date(Date.now() + ms).toISOString();
}

export function isAccessTokenExpired(bundle: TikTokTokenBundle): boolean {
  if (!bundle.expiresAt) return false;
  const expiresAtMs = new Date(bundle.expiresAt).getTime();
  // Pad by 60 seconds to avoid edge expiry
  return expiresAtMs - 60000 <= Date.now();
}

async function fetchAdvertiserIds(accessToken: string): Promise<string[] | undefined> {
  try {
    const base = getTikTokBaseUrl();
    console.log("🎵 TikTok: Fetching advertiser list");

    const response = await axios.get(`${base}/v1.3/oauth2/advertiser/get/`, {
      headers: {
        "Access-Token": accessToken,
      },
      params: {
        page_size: 50,
      },
      timeout: 15000,
      validateStatus: () => true,
    });

    console.log("🎵 TikTok: Advertiser list response status:", response.status);
    console.log("🎵 TikTok: Advertiser list response:", JSON.stringify(response.data, null, 2));

    if (response.data?.code && response.data.code !== 0) {
      console.error(`🎵 TikTok: Advertiser list error (code ${response.data.code}): ${response.data.message}`);
      return undefined;
    }

    const list = response.data?.data?.list || response.data?.data?.advertiser_list;
    if (!Array.isArray(list)) {
      console.warn("🎵 TikTok: No advertiser list found in response");
      return undefined;
    }

    const ids = list
      .map((item: any) => item?.advertiser_id)
      .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

    console.log("🎵 TikTok: Found advertiser IDs:", ids);
    return ids;
  } catch (error: any) {
    console.error("🎵 TikTok: Failed to fetch advertiser list:", error.message);
    return undefined;
  }
}

export async function exchangeAuthCode(authCode: string, state?: string): Promise<TikTokTokenBundle> {
  const appId = process.env.TIKTOK_APP_ID;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("TIKTOK_APP_ID and TIKTOK_APP_SECRET must be configured");
  }

  const base = getTikTokBaseUrl();
  console.log("🎵 TikTok: Exchanging auth code for access token");
  console.log("🎵 TikTok: Using endpoint:", `${base}/v1.3/oauth2/access_token/`);

  let response;
  try {
    response = await axios.post(
      `${base}/v1.3/oauth2/access_token/`,
      {
        app_id: appId,
        secret: appSecret,
        auth_code: authCode,
        grant_type: "authorization_code",
      },
      {
        timeout: 15000,
        validateStatus: () => true, // Accept any status code to see full response
      },
    );

    console.log("🎵 TikTok: Response status:", response.status);
    console.log("🎵 TikTok: Response data:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    if (error.response) {
      console.error("🎵 TikTok: API request failed with status:", error.response.status);
      console.error("🎵 TikTok: Error response:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }

  // Check for TikTok API error response
  if (response.data?.code && response.data.code !== 0) {
    throw new Error(
      `TikTok API error (code ${response.data.code}): ${response.data.message || "Unknown error"}`
    );
  }

  const data = response.data?.data;
  if (!data?.access_token) {
    throw new Error(
      `TikTok did not return an access token. Response: ${JSON.stringify(response.data)}`
    );
  }

  console.log("🎵 TikTok: Successfully obtained access token");
  console.log("🎵 TikTok: Token expires in:", data.expires_in, "seconds");

  const advertiserIds = await fetchAdvertiserIds(data.access_token);

  const bundle: TikTokTokenBundle = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    expiresAt: buildExpiresAt(data.expires_in),
    scope: data.scope ? String(data.scope).split(",") : undefined,
    advertiserIds,
    obtainedAt: new Date().toISOString(),
    state,
    source: "auth_code",
  };

  return writeTikTokTokens(bundle);
}

export async function refreshTikTokToken(manualRefreshToken?: string): Promise<TikTokTokenBundle> {
  const existing = readTikTokTokens();
  const refreshToken = manualRefreshToken || existing?.refreshToken || process.env.TIKTOK_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error("No refresh token available for TikTok");
  }

  const appId = process.env.TIKTOK_APP_ID;
  const appSecret = process.env.TIKTOK_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("TIKTOK_APP_ID and TIKTOK_APP_SECRET must be configured");
  }

  const base = getTikTokBaseUrl();
  const response = await axios.post(
    `${base}/v1.3/oauth2/access_token/`,
    {
      app_id: appId,
      secret: appSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    },
    { timeout: 15000 },
  );

  const data = response.data?.data;
  if (!data?.access_token) {
    throw new Error("TikTok did not return an access token on refresh");
  }

  const advertiserIds = existing?.advertiserIds || (await fetchAdvertiserIds(data.access_token));

  const bundle: TikTokTokenBundle = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in,
    expiresAt: buildExpiresAt(data.expires_in),
    scope: data.scope ? String(data.scope).split(",") : existing?.scope,
    advertiserIds,
    obtainedAt: new Date().toISOString(),
    state: existing?.state,
    source: "refresh",
  };

  return writeTikTokTokens(bundle);
}

function buildEnvToken(): TikTokTokenBundle | null {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken: process.env.TIKTOK_REFRESH_TOKEN,
    expiresIn: undefined,
    expiresAt: undefined,
    scope: undefined,
    advertiserIds: process.env.TIKTOK_ADVERTISER_ID ? [process.env.TIKTOK_ADVERTISER_ID] : undefined,
    obtainedAt: new Date().toISOString(),
    state: "env",
    source: "manual_env",
  };
}

export async function ensureAccessToken(): Promise<TikTokTokenBundle> {
  const existing = readTikTokTokens();
  if (existing && !isAccessTokenExpired(existing)) {
    return existing;
  }

  if (existing?.refreshToken) {
    return refreshTikTokToken(existing.refreshToken);
  }

  const envToken = buildEnvToken();
  if (envToken) return envToken;

  throw new Error("No TikTok access token available. Authorize via /api/tiktok/auth-url");
}

export async function fetchAdvertiserInfo(advertiserId?: string) {
  const tokenBundle = await ensureAccessToken();
  const resolvedAdvertiser =
    advertiserId ||
    process.env.TIKTOK_ADVERTISER_ID ||
    (tokenBundle.advertiserIds && tokenBundle.advertiserIds[0]);

  if (!resolvedAdvertiser) {
    throw new Error("No advertiser_id available. Provide one in the request or set TIKTOK_ADVERTISER_ID.");
  }

  const base = getTikTokBaseUrl();
  const response = await axios.post(
    `${base}/v1.3/advertiser/info/`,
    {
      advertiser_ids: [resolvedAdvertiser],
    },
    {
      headers: {
        "Access-Token": tokenBundle.accessToken,
      },
      timeout: 15000,
    },
  );

  const advertisers = response.data?.data?.list || response.data?.data?.advertiser_info || [];
  const advertiser = Array.isArray(advertisers)
    ? advertisers.find((item: any) => item?.advertiser_id === resolvedAdvertiser) || advertisers[0]
    : advertisers;

  return {
    advertiser,
    advertiserId: resolvedAdvertiser,
    raw: response.data,
    token: {
      expiresAt: tokenBundle.expiresAt,
      source: tokenBundle.source,
      advertiserIds: tokenBundle.advertiserIds,
    },
  };
}

export function tiktokStatus() {
  const bundle = readTikTokTokens();
  return {
    baseUrl: getTikTokBaseUrl(),
    hasStoredToken: Boolean(bundle?.accessToken),
    expiresAt: bundle?.expiresAt,
    advertiserIds: bundle?.advertiserIds,
    source: bundle?.source,
    redirectUri: process.env.TIKTOK_REDIRECT_URI,
    appId: process.env.TIKTOK_APP_ID ? "configured" : "missing",
    sandbox: (process.env.TIKTOK_USE_SANDBOX || "").toLowerCase() === "true",
  };
}

