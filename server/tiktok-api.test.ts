import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import {
  TikTokTokenBundle,
  readTikTokTokens,
  writeTikTokTokens,
  getTikTokBaseUrl,
  buildTikTokAuthUrl,
  isAccessTokenExpired,
  exchangeAuthCode,
  refreshTikTokToken,
  ensureAccessToken,
  fetchAdvertiserInfo,
  tiktokStatus,
} from "./tiktok-api";

// Mock modules
vi.mock("axios");
vi.mock("node:fs");

// Helper to create a mock token bundle
const createMockTokenBundle = (overrides?: Partial<TikTokTokenBundle>): TikTokTokenBundle => ({
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  expiresIn: 3600,
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  scope: ["user.info.basic"],
  advertiserIds: ["123456789"],
  state: "test-state",
  obtainedAt: new Date().toISOString(),
  source: "auth_code",
  ...overrides,
});

describe("TikTok API Module", () => {
  const originalEnv = process.env;
  const mockDataDir = path.join(process.cwd(), ".data");
  const mockTokensFile = path.join(mockDataDir, "tiktok_tokens.json");

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    vi.clearAllMocks();

    // Setup default mock implementations
    (fs.existsSync as Mock).mockImplementation((path: string) => {
      if (path === mockDataDir) return true;
      if (path === mockTokensFile) return false;
      return false;
    });

    (fs.mkdirSync as Mock).mockImplementation(() => undefined);
    (fs.readFileSync as Mock).mockImplementation(() => JSON.stringify(createMockTokenBundle()));
    (fs.writeFileSync as Mock).mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("readTikTokTokens", () => {
    it("should return null when token file doesn't exist", () => {
      (fs.existsSync as Mock).mockReturnValue(false);

      const result = readTikTokTokens();

      expect(result).toBeNull();
    });

    it("should return parsed token bundle when file exists", () => {
      const mockBundle = createMockTokenBundle();
      (fs.existsSync as Mock).mockReturnValue(true);
      (fs.readFileSync as Mock).mockReturnValue(JSON.stringify(mockBundle));

      const result = readTikTokTokens();

      expect(result).toEqual(mockBundle);
    });

    it("should return null and log warning on parse error", () => {
      (fs.existsSync as Mock).mockReturnValue(true);
      (fs.readFileSync as Mock).mockReturnValue("invalid json");
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = readTikTokTokens();

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to read TikTok token cache",
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("writeTikTokTokens", () => {
    it("should create data directory if it doesn't exist", () => {
      const mockBundle = createMockTokenBundle();
      (fs.existsSync as Mock).mockReturnValue(false);

      writeTikTokTokens(mockBundle);

      expect(fs.mkdirSync).toHaveBeenCalledWith(mockDataDir, { recursive: true });
    });

    it("should write token bundle to file", () => {
      const mockBundle = createMockTokenBundle();
      (fs.existsSync as Mock).mockReturnValue(true);

      const result = writeTikTokTokens(mockBundle);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockTokensFile,
        JSON.stringify(mockBundle, null, 2),
        "utf8"
      );
      expect(result).toEqual(mockBundle);
    });
  });

  describe("getTikTokBaseUrl", () => {
    it("should return explicit base URL when TIKTOK_API_BASE is set", () => {
      process.env.TIKTOK_API_BASE = "https://custom-api.tiktok.com/";

      const result = getTikTokBaseUrl();

      expect(result).toBe("https://custom-api.tiktok.com");
    });

    it("should return sandbox URL when TIKTOK_USE_SANDBOX is true", () => {
      process.env.TIKTOK_USE_SANDBOX = "true";

      const result = getTikTokBaseUrl();

      expect(result).toBe("https://sandbox-ads.tiktok.com/open_api");
    });

    it("should return production URL when TIKTOK_USE_SANDBOX is false", () => {
      process.env.TIKTOK_USE_SANDBOX = "false";

      const result = getTikTokBaseUrl();

      expect(result).toBe("https://business-api.tiktok.com/open_api");
    });

    it("should return production URL by default", () => {
      delete process.env.TIKTOK_USE_SANDBOX;
      delete process.env.TIKTOK_API_BASE;

      const result = getTikTokBaseUrl();

      expect(result).toBe("https://business-api.tiktok.com/open_api");
    });
  });

  describe("buildTikTokAuthUrl", () => {
    it("should throw error when TIKTOK_APP_ID is missing", () => {
      delete process.env.TIKTOK_APP_ID;
      process.env.TIKTOK_REDIRECT_URI = "https://example.com/callback";

      expect(() => buildTikTokAuthUrl()).toThrow(
        "TIKTOK_APP_ID and TIKTOK_REDIRECT_URI must be configured"
      );
    });

    it("should throw error when TIKTOK_REDIRECT_URI is missing", () => {
      process.env.TIKTOK_APP_ID = "test-app-id";
      delete process.env.TIKTOK_REDIRECT_URI;

      expect(() => buildTikTokAuthUrl()).toThrow(
        "TIKTOK_APP_ID and TIKTOK_REDIRECT_URI must be configured"
      );
    });

    it("should build auth URL with default state", () => {
      process.env.TIKTOK_APP_ID = "test-app-id";
      process.env.TIKTOK_REDIRECT_URI = "https://example.com/callback";

      const result = buildTikTokAuthUrl();

      expect(result).toBe(
        "https://business-api.tiktok.com/portal/auth?" +
        "app_id=test-app-id&state=social-fetch-pro&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback"
      );
    });

    it("should build auth URL with custom state", () => {
      process.env.TIKTOK_APP_ID = "test-app-id";
      process.env.TIKTOK_REDIRECT_URI = "https://example.com/callback";

      const result = buildTikTokAuthUrl("custom-state");

      expect(result).toBe(
        "https://business-api.tiktok.com/portal/auth?" +
        "app_id=test-app-id&state=custom-state&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback"
      );
    });
  });

  describe("isAccessTokenExpired", () => {
    it("should return false when expiresAt is not set", () => {
      const bundle = createMockTokenBundle({ expiresAt: undefined });

      const result = isAccessTokenExpired(bundle);

      expect(result).toBe(false);
    });

    it("should return false when token is not expired", () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      const bundle = createMockTokenBundle({ expiresAt: futureDate });

      const result = isAccessTokenExpired(bundle);

      expect(result).toBe(false);
    });

    it("should return true when token is expired", () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const bundle = createMockTokenBundle({ expiresAt: pastDate });

      const result = isAccessTokenExpired(bundle);

      expect(result).toBe(true);
    });

    it("should return true when token expires within 60 seconds", () => {
      const nearFutureDate = new Date(Date.now() + 30000).toISOString(); // 30 seconds from now
      const bundle = createMockTokenBundle({ expiresAt: nearFutureDate });

      const result = isAccessTokenExpired(bundle);

      expect(result).toBe(true);
    });
  });

  describe("exchangeAuthCode", () => {
    beforeEach(() => {
      process.env.TIKTOK_APP_ID = "test-app-id";
      process.env.TIKTOK_APP_SECRET = "test-app-secret";
    });

    it("should throw error when TIKTOK_APP_ID is missing", async () => {
      delete process.env.TIKTOK_APP_ID;

      await expect(exchangeAuthCode("auth-code")).rejects.toThrow(
        "TIKTOK_APP_ID and TIKTOK_APP_SECRET must be configured"
      );
    });

    it("should throw error when TIKTOK_APP_SECRET is missing", async () => {
      delete process.env.TIKTOK_APP_SECRET;

      await expect(exchangeAuthCode("auth-code")).rejects.toThrow(
        "TIKTOK_APP_ID and TIKTOK_APP_SECRET must be configured"
      );
    });

    it("should exchange auth code for token bundle", async () => {
      const mockResponse = {
        data: {
          data: {
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
            expires_in: 7200,
            scope: "user.info.basic,user.info.profile",
          },
        },
      };

      const mockAdvertiserResponse = {
        data: {
          data: {
            list: [
              { advertiser_id: "adv-123" },
              { advertiser_id: "adv-456" },
            ],
          },
        },
      };

      (axios.post as Mock).mockResolvedValue(mockResponse);
      (axios.get as Mock).mockResolvedValue(mockAdvertiserResponse);

      const result = await exchangeAuthCode("auth-code", "custom-state");

      expect(axios.post).toHaveBeenCalledWith(
        "https://business-api.tiktok.com/open_api/v1.3/oauth2/token/",
        {
          app_id: "test-app-id",
          secret: "test-app-secret",
          auth_code: "auth-code",
          grant_type: "auth_code",
        },
        { timeout: 15000 }
      );

      expect(result.accessToken).toBe("new-access-token");
      expect(result.refreshToken).toBe("new-refresh-token");
      expect(result.expiresIn).toBe(7200);
      expect(result.scope).toEqual(["user.info.basic", "user.info.profile"]);
      expect(result.advertiserIds).toEqual(["adv-123", "adv-456"]);
      expect(result.state).toBe("custom-state");
      expect(result.source).toBe("auth_code");
    });

    it("should throw error when TikTok doesn't return access token", async () => {
      const mockResponse = {
        data: {
          data: {},
        },
      };

      (axios.post as Mock).mockResolvedValue(mockResponse);

      await expect(exchangeAuthCode("auth-code")).rejects.toThrow(
        "TikTok did not return an access token"
      );
    });
  });

  describe("refreshTikTokToken", () => {
    beforeEach(() => {
      process.env.TIKTOK_APP_ID = "test-app-id";
      process.env.TIKTOK_APP_SECRET = "test-app-secret";
    });

    it("should throw error when no refresh token is available", async () => {
      (fs.existsSync as Mock).mockReturnValue(false);
      delete process.env.TIKTOK_REFRESH_TOKEN;

      await expect(refreshTikTokToken()).rejects.toThrow(
        "No refresh token available for TikTok"
      );
    });

    it("should use manual refresh token when provided", async () => {
      const mockResponse = {
        data: {
          data: {
            access_token: "refreshed-access-token",
            refresh_token: "new-refresh-token",
            expires_in: 3600,
          },
        },
      };

      (axios.post as Mock).mockResolvedValue(mockResponse);

      const result = await refreshTikTokToken("manual-refresh-token");

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/v1.3/oauth2/token/"),
        expect.objectContaining({
          refresh_token: "manual-refresh-token",
          grant_type: "refresh_token",
        }),
        expect.any(Object)
      );

      expect(result.accessToken).toBe("refreshed-access-token");
      expect(result.source).toBe("refresh");
    });

    it("should use stored refresh token when available", async () => {
      const mockBundle = createMockTokenBundle({ refreshToken: "stored-refresh-token" });
      (fs.existsSync as Mock).mockReturnValue(true);
      (fs.readFileSync as Mock).mockReturnValue(JSON.stringify(mockBundle));

      const mockResponse = {
        data: {
          data: {
            access_token: "refreshed-access-token",
            expires_in: 3600,
          },
        },
      };

      (axios.post as Mock).mockResolvedValue(mockResponse);

      const result = await refreshTikTokToken();

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/v1.3/oauth2/token/"),
        expect.objectContaining({
          refresh_token: "stored-refresh-token",
          grant_type: "refresh_token",
        }),
        expect.any(Object)
      );

      expect(result.accessToken).toBe("refreshed-access-token");
    });

    it("should use environment refresh token as fallback", async () => {
      (fs.existsSync as Mock).mockReturnValue(false);
      process.env.TIKTOK_REFRESH_TOKEN = "env-refresh-token";

      const mockResponse = {
        data: {
          data: {
            access_token: "refreshed-access-token",
            expires_in: 3600,
          },
        },
      };

      (axios.post as Mock).mockResolvedValue(mockResponse);

      const result = await refreshTikTokToken();

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/v1.3/oauth2/token/"),
        expect.objectContaining({
          refresh_token: "env-refresh-token",
          grant_type: "refresh_token",
        }),
        expect.any(Object)
      );

      expect(result.accessToken).toBe("refreshed-access-token");
    });
  });

  describe("ensureAccessToken", () => {
    it("should return existing token when not expired", async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      const mockBundle = createMockTokenBundle({ expiresAt: futureDate });
      (fs.existsSync as Mock).mockReturnValue(true);
      (fs.readFileSync as Mock).mockReturnValue(JSON.stringify(mockBundle));

      const result = await ensureAccessToken();

      expect(result).toEqual(mockBundle);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should refresh token when expired and refresh token exists", async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const mockBundle = createMockTokenBundle({
        expiresAt: pastDate,
        refreshToken: "stored-refresh-token"
      });
      (fs.existsSync as Mock).mockReturnValue(true);
      (fs.readFileSync as Mock).mockReturnValue(JSON.stringify(mockBundle));

      process.env.TIKTOK_APP_ID = "test-app-id";
      process.env.TIKTOK_APP_SECRET = "test-app-secret";

      const mockResponse = {
        data: {
          data: {
            access_token: "refreshed-access-token",
            expires_in: 3600,
          },
        },
      };

      (axios.post as Mock).mockResolvedValue(mockResponse);

      const result = await ensureAccessToken();

      expect(result.accessToken).toBe("refreshed-access-token");
      expect(result.source).toBe("refresh");
    });

    it("should use environment token as fallback", async () => {
      (fs.existsSync as Mock).mockReturnValue(false);
      process.env.TIKTOK_ACCESS_TOKEN = "env-access-token";
      process.env.TIKTOK_ADVERTISER_ID = "env-advertiser-id";

      const result = await ensureAccessToken();

      expect(result.accessToken).toBe("env-access-token");
      expect(result.advertiserIds).toEqual(["env-advertiser-id"]);
      expect(result.source).toBe("manual_env");
    });

    it("should throw error when no token is available", async () => {
      (fs.existsSync as Mock).mockReturnValue(false);
      delete process.env.TIKTOK_ACCESS_TOKEN;

      await expect(ensureAccessToken()).rejects.toThrow(
        "No TikTok access token available. Authorize via /api/tiktok/auth-url"
      );
    });
  });

  describe("fetchAdvertiserInfo", () => {
    beforeEach(() => {
      const mockBundle = createMockTokenBundle();
      (fs.existsSync as Mock).mockReturnValue(true);
      (fs.readFileSync as Mock).mockReturnValue(JSON.stringify(mockBundle));
    });

    it("should fetch advertiser info with provided advertiser ID", async () => {
      const mockResponse = {
        data: {
          data: {
            list: [
              {
                advertiser_id: "test-advertiser-id",
                name: "Test Advertiser",
                status: "active",
              },
            ],
          },
        },
      };

      (axios.post as Mock).mockResolvedValue(mockResponse);

      const result = await fetchAdvertiserInfo("test-advertiser-id");

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/v1.3/advertiser/info/"),
        {
          advertiser_ids: ["test-advertiser-id"],
        },
        expect.objectContaining({
          headers: {
            "Access-Token": "mock-access-token",
          },
        })
      );

      expect(result.advertiser).toEqual({
        advertiser_id: "test-advertiser-id",
        name: "Test Advertiser",
        status: "active",
      });
      expect(result.advertiserId).toBe("test-advertiser-id");
    });

    it("should use environment advertiser ID as fallback", async () => {
      process.env.TIKTOK_ADVERTISER_ID = "env-advertiser-id";

      const mockResponse = {
        data: {
          data: {
            list: [
              {
                advertiser_id: "env-advertiser-id",
                name: "Env Advertiser",
              },
            ],
          },
        },
      };

      (axios.post as Mock).mockResolvedValue(mockResponse);

      const result = await fetchAdvertiserInfo();

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/v1.3/advertiser/info/"),
        {
          advertiser_ids: ["env-advertiser-id"],
        },
        expect.any(Object)
      );

      expect(result.advertiserId).toBe("env-advertiser-id");
    });

    it("should use first advertiser ID from token bundle", async () => {
      const mockBundle = createMockTokenBundle({
        advertiserIds: ["bundle-adv-1", "bundle-adv-2"]
      });
      (fs.readFileSync as Mock).mockReturnValue(JSON.stringify(mockBundle));

      const mockResponse = {
        data: {
          data: {
            list: [
              {
                advertiser_id: "bundle-adv-1",
                name: "Bundle Advertiser",
              },
            ],
          },
        },
      };

      (axios.post as Mock).mockResolvedValue(mockResponse);

      const result = await fetchAdvertiserInfo();

      expect(result.advertiserId).toBe("bundle-adv-1");
    });

    it("should throw error when no advertiser ID is available", async () => {
      const mockBundle = createMockTokenBundle({ advertiserIds: undefined });
      (fs.readFileSync as Mock).mockReturnValue(JSON.stringify(mockBundle));
      delete process.env.TIKTOK_ADVERTISER_ID;

      await expect(fetchAdvertiserInfo()).rejects.toThrow(
        "No advertiser_id available. Provide one in the request or set TIKTOK_ADVERTISER_ID."
      );
    });
  });

  describe("tiktokStatus", () => {
    it("should return status with stored token", () => {
      const mockBundle = createMockTokenBundle();
      (fs.existsSync as Mock).mockReturnValue(true);
      (fs.readFileSync as Mock).mockReturnValue(JSON.stringify(mockBundle));

      process.env.TIKTOK_REDIRECT_URI = "https://example.com/callback";
      process.env.TIKTOK_APP_ID = "test-app-id";
      process.env.TIKTOK_USE_SANDBOX = "true";

      const result = tiktokStatus();

      expect(result).toEqual({
        baseUrl: "https://sandbox-ads.tiktok.com/open_api",
        hasStoredToken: true,
        expiresAt: mockBundle.expiresAt,
        advertiserIds: mockBundle.advertiserIds,
        source: mockBundle.source,
        redirectUri: "https://example.com/callback",
        appId: "configured",
        sandbox: true,
      });
    });

    it("should return status without stored token", () => {
      (fs.existsSync as Mock).mockReturnValue(false);

      delete process.env.TIKTOK_APP_ID;
      delete process.env.TIKTOK_USE_SANDBOX;

      const result = tiktokStatus();

      expect(result).toEqual({
        baseUrl: "https://business-api.tiktok.com/open_api",
        hasStoredToken: false,
        expiresAt: undefined,
        advertiserIds: undefined,
        source: undefined,
        redirectUri: undefined,
        appId: "missing",
        sandbox: false,
      });
    });
  });
});