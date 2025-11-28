import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import request from "supertest";
import express from "express";
import { runRoutes } from "./routes";
import * as tiktokApi from "./tiktok-api";
import * as scrapers from "./scrapers";
import { storage } from "./storage";

// Mock modules
vi.mock("./tiktok-api");
vi.mock("./scrapers");
vi.mock("./storage");

describe("TikTok Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    runRoutes(app);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/tiktok/auth-url", () => {
    it("should return auth URL with default state", async () => {
      (tiktokApi.buildTikTokAuthUrl as Mock).mockReturnValue(
        "https://business-api.tiktok.com/portal/auth?app_id=test&state=social-fetch-pro"
      );

      const response = await request(app)
        .get("/api/tiktok/auth-url")
        .expect(200);

      expect(response.body).toEqual({
        url: "https://business-api.tiktok.com/portal/auth?app_id=test&state=social-fetch-pro",
        state: "social-fetch-pro",
      });
      expect(tiktokApi.buildTikTokAuthUrl).toHaveBeenCalledWith(undefined);
    });

    it("should return auth URL with custom state", async () => {
      (tiktokApi.buildTikTokAuthUrl as Mock).mockReturnValue(
        "https://business-api.tiktok.com/portal/auth?app_id=test&state=custom-state"
      );

      const response = await request(app)
        .get("/api/tiktok/auth-url?state=custom-state")
        .expect(200);

      expect(response.body).toEqual({
        url: "https://business-api.tiktok.com/portal/auth?app_id=test&state=custom-state",
        state: "custom-state",
      });
      expect(tiktokApi.buildTikTokAuthUrl).toHaveBeenCalledWith("custom-state");
    });

    it("should return 400 when buildTikTokAuthUrl throws error", async () => {
      (tiktokApi.buildTikTokAuthUrl as Mock).mockImplementation(() => {
        throw new Error("Missing configuration");
      });

      const response = await request(app)
        .get("/api/tiktok/auth-url")
        .expect(400);

      expect(response.body).toEqual({
        error: "Missing configuration",
      });
    });
  });

  describe("GET /oauth-callback", () => {
    it("should handle successful auth code exchange", async () => {
      const mockBundle = {
        accessToken: "test-access-token",
        advertiserIds: ["123", "456"],
        expiresAt: "2024-12-31T23:59:59Z",
      };

      (tiktokApi.exchangeAuthCode as Mock).mockResolvedValue(mockBundle);

      const response = await request(app)
        .get("/oauth-callback?auth_code=test-code&state=test-state")
        .expect(200);

      expect(response.text).toContain("TikTok authorization saved");
      expect(response.text).toContain("123, 456");
      expect(response.text).toContain("2024-12-31T23:59:59Z");
      expect(tiktokApi.exchangeAuthCode).toHaveBeenCalledWith("test-code", "test-state");
    });

    it("should handle auth code in 'code' parameter", async () => {
      const mockBundle = {
        accessToken: "test-access-token",
        advertiserIds: [],
        expiresAt: undefined,
      };

      (tiktokApi.exchangeAuthCode as Mock).mockResolvedValue(mockBundle);

      const response = await request(app)
        .get("/oauth-callback?code=test-code")
        .expect(200);

      expect(response.text).toContain("TikTok authorization saved");
      expect(response.text).toContain("none returned");
      expect(response.text).toContain("unknown");
      expect(tiktokApi.exchangeAuthCode).toHaveBeenCalledWith("test-code", undefined);
    });

    it("should handle authorization error", async () => {
      const response = await request(app)
        .get("/oauth-callback?error=access_denied&error_description=User%20denied%20access")
        .expect(400);

      expect(response.text).toBe("TikTok authorization failed: User denied access");
    });

    it("should handle missing auth code", async () => {
      const response = await request(app)
        .get("/oauth-callback")
        .expect(400);

      expect(response.text).toBe("Missing auth_code parameter from TikTok");
    });

    it("should handle exchange failure", async () => {
      (tiktokApi.exchangeAuthCode as Mock).mockRejectedValue(
        new Error("Exchange failed")
      );

      const response = await request(app)
        .get("/oauth-callback?auth_code=test-code")
        .expect(500);

      expect(response.text).toBe("Failed to exchange TikTok auth_code: Exchange failed");
    });
  });

  describe("GET /api/tiktok/status", () => {
    it("should return TikTok status", async () => {
      const mockStatus = {
        baseUrl: "https://business-api.tiktok.com/open_api",
        hasStoredToken: true,
        expiresAt: "2024-12-31T23:59:59Z",
        advertiserIds: ["123"],
        source: "auth_code",
        redirectUri: "https://example.com/callback",
        appId: "configured",
        sandbox: false,
      };

      (tiktokApi.tiktokStatus as Mock).mockReturnValue(mockStatus);

      const response = await request(app)
        .get("/api/tiktok/status")
        .expect(200);

      expect(response.body).toEqual(mockStatus);
      expect(tiktokApi.tiktokStatus).toHaveBeenCalled();
    });
  });

  describe("POST /api/tiktok/token/refresh", () => {
    it("should refresh token without manual refresh token", async () => {
      const mockBundle = {
        accessToken: "refreshed-token",
        expiresAt: "2024-12-31T23:59:59Z",
        advertiserIds: ["123"],
        source: "refresh",
      };

      (tiktokApi.refreshTikTokToken as Mock).mockResolvedValue(mockBundle);

      const response = await request(app)
        .post("/api/tiktok/token/refresh")
        .send({})
        .expect(200);

      expect(response.body).toEqual({
        expiresAt: "2024-12-31T23:59:59Z",
        advertiserIds: ["123"],
        source: "refresh",
      });
      expect(tiktokApi.refreshTikTokToken).toHaveBeenCalledWith(undefined);
    });

    it("should refresh token with manual refresh token", async () => {
      const mockBundle = {
        accessToken: "refreshed-token",
        expiresAt: "2024-12-31T23:59:59Z",
        advertiserIds: ["456"],
        source: "refresh",
      };

      (tiktokApi.refreshTikTokToken as Mock).mockResolvedValue(mockBundle);

      const response = await request(app)
        .post("/api/tiktok/token/refresh")
        .send({ refreshToken: "manual-refresh-token" })
        .expect(200);

      expect(response.body).toEqual({
        expiresAt: "2024-12-31T23:59:59Z",
        advertiserIds: ["456"],
        source: "refresh",
      });
      expect(tiktokApi.refreshTikTokToken).toHaveBeenCalledWith("manual-refresh-token");
    });

    it("should handle refresh failure", async () => {
      (tiktokApi.refreshTikTokToken as Mock).mockRejectedValue(
        new Error("Refresh failed")
      );

      const response = await request(app)
        .post("/api/tiktok/token/refresh")
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: "Refresh failed",
      });
    });
  });

  describe("POST /api/tiktok/advertiser/info", () => {
    it("should fetch advertiser info without advertiser ID", async () => {
      const mockInfo = {
        advertiser: {
          advertiser_id: "123",
          name: "Test Advertiser",
        },
        advertiserId: "123",
        raw: { data: { list: [] } },
        token: {
          expiresAt: "2024-12-31T23:59:59Z",
          source: "auth_code",
          advertiserIds: ["123"],
        },
      };

      (tiktokApi.fetchAdvertiserInfo as Mock).mockResolvedValue(mockInfo);

      const response = await request(app)
        .post("/api/tiktok/advertiser/info")
        .send({})
        .expect(200);

      expect(response.body).toEqual(mockInfo);
      expect(tiktokApi.fetchAdvertiserInfo).toHaveBeenCalledWith(undefined);
    });

    it("should fetch advertiser info with specific advertiser ID", async () => {
      const mockInfo = {
        advertiser: {
          advertiser_id: "456",
          name: "Specific Advertiser",
        },
        advertiserId: "456",
        raw: { data: { list: [] } },
        token: {
          expiresAt: "2024-12-31T23:59:59Z",
          source: "auth_code",
          advertiserIds: ["456"],
        },
      };

      (tiktokApi.fetchAdvertiserInfo as Mock).mockResolvedValue(mockInfo);

      const response = await request(app)
        .post("/api/tiktok/advertiser/info")
        .send({ advertiserId: "456" })
        .expect(200);

      expect(response.body).toEqual(mockInfo);
      expect(tiktokApi.fetchAdvertiserInfo).toHaveBeenCalledWith("456");
    });

    it("should handle fetch failure", async () => {
      (tiktokApi.fetchAdvertiserInfo as Mock).mockRejectedValue(
        new Error("Fetch failed")
      );

      const response = await request(app)
        .post("/api/tiktok/advertiser/info")
        .send({})
        .expect(500);

      expect(response.body).toEqual({
        error: "Fetch failed",
      });
    });
  });

  describe("GET /api/tiktok", () => {
    it("should return error when username is missing", async () => {
      const response = await request(app)
        .get("/api/tiktok")
        .expect(400);

      expect(response.body).toEqual({
        error: "Username is required",
      });
    });

    it("should scrape TikTok with default pagination", async () => {
      const mockScrapeResult = {
        data: [
          { id: "1", title: "Video 1" },
          { id: "2", title: "Video 2" },
          { id: "3", title: "Video 3" },
        ],
        status: "success",
        meta: {
          username: "testuser",
        },
      };

      (scrapers.scrapeTikTok as Mock).mockResolvedValue(mockScrapeResult);

      const response = await request(app)
        .get("/api/tiktok?username=testuser")
        .expect(200);

      expect(response.body).toEqual({
        data: mockScrapeResult.data,
        meta: {
          username: "testuser",
          page: 1,
          per_page: 10,
          total_pages: 1,
          total_posts: 3,
        },
        status: "success",
      });
      expect(scrapers.scrapeTikTok).toHaveBeenCalledWith("testuser");
    });

    it("should scrape TikTok with custom pagination", async () => {
      const mockData = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Video ${i + 1}`,
      }));

      const mockScrapeResult = {
        data: mockData,
        status: "success",
        meta: {
          username: "testuser",
        },
      };

      (scrapers.scrapeTikTok as Mock).mockResolvedValue(mockScrapeResult);

      const response = await request(app)
        .get("/api/tiktok?username=testuser&page=2&per-page=5")
        .expect(200);

      expect(response.body).toEqual({
        data: mockData.slice(5, 10), // Page 2 with 5 items per page
        meta: {
          username: "testuser",
          page: 2,
          per_page: 5,
          total_pages: 5,
          total_posts: 25,
        },
        status: "success",
      });
    });

    it("should handle per_page parameter variant", async () => {
      const mockScrapeResult = {
        data: Array.from({ length: 15 }, (_, i) => ({ id: `${i + 1}` })),
        status: "success",
        meta: {},
      };

      (scrapers.scrapeTikTok as Mock).mockResolvedValue(mockScrapeResult);

      const response = await request(app)
        .get("/api/tiktok?username=testuser&page=1&per_page=7")
        .expect(200);

      expect(response.body.meta.per_page).toBe(7);
      expect(response.body.data.length).toBe(7);
    });

    it("should cap per-page at 50", async () => {
      const mockScrapeResult = {
        data: Array.from({ length: 100 }, (_, i) => ({ id: `${i + 1}` })),
        status: "success",
        meta: {},
      };

      (scrapers.scrapeTikTok as Mock).mockResolvedValue(mockScrapeResult);

      const response = await request(app)
        .get("/api/tiktok?username=testuser&per-page=100")
        .expect(200);

      expect(response.body.meta.per_page).toBe(50);
      expect(response.body.data.length).toBe(50);
    });

    it("should handle invalid page number", async () => {
      const mockScrapeResult = {
        data: [{ id: "1" }],
        status: "success",
        meta: {},
      };

      (scrapers.scrapeTikTok as Mock).mockResolvedValue(mockScrapeResult);

      const response = await request(app)
        .get("/api/tiktok?username=testuser&page=invalid")
        .expect(200);

      expect(response.body.meta.page).toBe(1);
    });

    it("should handle scraping error", async () => {
      (scrapers.scrapeTikTok as Mock).mockRejectedValue(
        new Error("Scraping failed")
      );

      const response = await request(app)
        .get("/api/tiktok?username=testuser")
        .expect(500);

      expect(response.body).toEqual({
        error: "Scraping failed",
      });
    });

    it("should handle empty results", async () => {
      const mockScrapeResult = {
        data: [],
        status: "success",
        meta: {
          username: "testuser",
        },
      };

      (scrapers.scrapeTikTok as Mock).mockResolvedValue(mockScrapeResult);

      const response = await request(app)
        .get("/api/tiktok?username=testuser")
        .expect(200);

      expect(response.body).toEqual({
        data: [],
        meta: {
          username: "testuser",
          page: 1,
          per_page: 10,
          total_pages: 1,
          total_posts: 0,
        },
        status: "success",
      });
    });

    it("should return correct page when requesting beyond available data", async () => {
      const mockScrapeResult = {
        data: [
          { id: "1", title: "Video 1" },
          { id: "2", title: "Video 2" },
        ],
        status: "success",
        meta: {},
      };

      (scrapers.scrapeTikTok as Mock).mockResolvedValue(mockScrapeResult);

      const response = await request(app)
        .get("/api/tiktok?username=testuser&page=5&per-page=10")
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.meta.page).toBe(5);
      expect(response.body.meta.total_pages).toBe(1);
      expect(response.body.meta.total_posts).toBe(2);
    });
  });

  describe("GET /api/stats", () => {
    it("should include TikTok in active accounts count", async () => {
      const mockTikTokStatus = {
        baseUrl: "https://business-api.tiktok.com/open_api",
        hasStoredToken: true,
        expiresAt: "2024-12-31T23:59:59Z",
        advertiserIds: ["123"],
        source: "auth_code",
      };

      (tiktokApi.tiktokStatus as Mock).mockReturnValue(mockTikTokStatus);
      (storage.getJobCount as Mock).mockResolvedValue(10);
      (storage.getRecentJobs as Mock).mockResolvedValue([]);
      (storage.getAllPlatformStats as Mock).mockResolvedValue([]);
      (storage.getTwitterAccounts as Mock).mockResolvedValue([
        { id: "1", username: "user1", status: "active" },
        { id: "2", username: "user2", status: "active" },
      ]);
      (storage.getInstagramCredential as Mock).mockResolvedValue({
        status: "active",
      });

      const response = await request(app)
        .get("/api/stats")
        .expect(200);

      expect(response.body.activeAccounts).toBe(4); // 2 Twitter + 1 Instagram + 1 TikTok
    });

    it("should not count TikTok when no token is stored", async () => {
      const mockTikTokStatus = {
        baseUrl: "https://business-api.tiktok.com/open_api",
        hasStoredToken: false,
        expiresAt: undefined,
        advertiserIds: undefined,
        source: undefined,
      };

      (tiktokApi.tiktokStatus as Mock).mockReturnValue(mockTikTokStatus);
      (storage.getJobCount as Mock).mockResolvedValue(10);
      (storage.getRecentJobs as Mock).mockResolvedValue([]);
      (storage.getAllPlatformStats as Mock).mockResolvedValue([]);
      (storage.getTwitterAccounts as Mock).mockResolvedValue([
        { id: "1", username: "user1", status: "active" },
      ]);
      (storage.getInstagramCredential as Mock).mockResolvedValue(null);

      const response = await request(app)
        .get("/api/stats")
        .expect(200);

      expect(response.body.activeAccounts).toBe(1); // Only 1 Twitter account
    });
  });
});