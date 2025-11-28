import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertTwitterAccountSchema, insertInstagramCredentialSchema, settingsSchema } from "@shared/schema";
import { z } from "zod";
import { scrapeYouTube, scrapeTikTok, scrapeTwitter, scrapeInstagram } from "./scrapers";
import { buildTikTokAuthUrl, exchangeAuthCode, refreshTikTokToken, fetchAdvertiserInfo, tiktokStatus, writeTikTokTokens, type TikTokTokenBundle } from "./tiktok-api";
import { registerMetadataRoutes } from "./metadata-routes";

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      const twitterAccounts = await storage.getTwitterAccounts();
      const instagramAccount = await storage.getInstagramCredential();
      const tiktok = tiktokStatus();
      
      const completedJobs = jobs.filter(j => j.status === "completed");
      const successRate = jobs.length > 0 
        ? Math.round((completedJobs.length / jobs.length) * 100) 
        : 0;
      
      const activeAccounts = twitterAccounts.filter(a => a.status === "active").length + 
        (instagramAccount && instagramAccount.status === "active" ? 1 : 0) +
        (tiktok.hasStoredToken ? 1 : 0);
      
      const dataVolume = `${Math.round(JSON.stringify(jobs).length / 1024 / 1024 * 100) / 100} MB`;

      res.json({
        totalJobs: jobs.length,
        successRate,
        activeAccounts,
        dataVolume,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/jobs/recent", async (req, res) => {
    try {
      const jobs = await storage.getRecentJobs(10);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent jobs" });
    }
  });

  app.get("/api/platforms/stats", async (req, res) => {
    try {
      const platformStats = await storage.getPlatformStats();
      const formattedStats: Record<string, { totalJobs: number; successRate: number }> = {};
      
      for (const [platform, stat] of Object.entries(platformStats)) {
        const successRate = stat.totalJobs > 0 
          ? Math.round((stat.successfulJobs / stat.totalJobs) * 100) 
          : 0;
        formattedStats[platform] = {
          totalJobs: stat.totalJobs,
          successRate,
        };
      }
      
      res.json(formattedStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch platform stats" });
    }
  });

  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const partialSettings = settingsSchema.partial().parse(req.body);
      const updated = await storage.updateSettings(partialSettings);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/tiktok/auth-url", (req, res) => {
    try {
      const state = typeof req.query.state === "string" ? req.query.state : undefined;
      const url = buildTikTokAuthUrl(state);
      res.json({ url, state: state || "social-fetch-pro" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to build TikTok auth URL" });
    }
  });

  app.get("/oauth-callback", async (req, res) => {
    try {
      const { auth_code, code, state, error, error_description } = req.query;
      if (error) {
        return res.status(400).send(`TikTok authorization failed: ${error_description || error}`);
      }

      const authCode =
        typeof auth_code === "string"
          ? auth_code
          : typeof code === "string"
            ? code
            : undefined;

      if (!authCode) {
        return res.status(400).send("Missing auth_code parameter from TikTok");
      }

      const bundle = await exchangeAuthCode(
        authCode,
        typeof state === "string" ? state : undefined,
      );
      const advertiserIds = bundle.advertiserIds?.join(", ") || "none returned";
      const expires = bundle.expiresAt || "unknown";

      const successHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 24px;">
            <h2>TikTok authorization saved</h2>
            <p>Access token stored successfully.</p>
            <p><strong>Advertiser IDs:</strong> ${advertiserIds}</p>
            <p><strong>Expires:</strong> ${expires}</p>
            <p>You may close this tab.</p>
          </body>
        </html>`;
      res.send(successHtml);
    } catch (error: any) {
      res.status(500).send(`Failed to exchange TikTok auth_code: ${error.message}`);
    }
  });

  app.get("/api/tiktok/status", (_req, res) => {
    res.json(tiktokStatus());
  });

  app.post("/api/tiktok/token/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body || {};
      const bundle = await refreshTikTokToken(refreshToken);
      res.json({
        expiresAt: bundle.expiresAt,
        advertiserIds: bundle.advertiserIds,
        source: bundle.source,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to refresh TikTok token" });
    }
  });

  app.post("/api/tiktok/token/manual", async (req, res) => {
    try {
      const { accessToken, refreshToken, expiresIn, scope } = req.body || {};

      if (!accessToken || typeof accessToken !== "string") {
        return res.status(400).json({ error: "accessToken is required" });
      }

      const bundle: TikTokTokenBundle = {
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresIn: typeof expiresIn === "number" ? expiresIn : 86400,
        expiresAt: buildExpiresAt(typeof expiresIn === "number" ? expiresIn : 86400),
        scope: scope ? String(scope).split(",") : undefined,
        advertiserIds: await fetchAdvertiserIds(accessToken),
        obtainedAt: new Date().toISOString(),
        source: "manual_env",
      };

      writeTikTokTokens(bundle);

      res.json({
        success: true,
        expiresAt: bundle.expiresAt,
        advertiserIds: bundle.advertiserIds,
        hasRefreshToken: !!bundle.refreshToken,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to save manual token" });
    }
  });

  app.post("/api/tiktok/advertiser/info", async (req, res) => {
    try {
      const advertiserId = typeof req.body?.advertiserId === "string" ? req.body.advertiserId : undefined;
      const info = await fetchAdvertiserInfo(advertiserId);
      res.json(info);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch TikTok advertiser info" });
    }
  });

  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteJob(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  app.get("/api/accounts/twitter", async (req, res) => {
    try {
      const accounts = await storage.getTwitterAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Twitter accounts" });
    }
  });

  app.post("/api/accounts/twitter", async (req, res) => {
    try {
      const validated = insertTwitterAccountSchema.parse(req.body);
      const account = await storage.createTwitterAccount(validated);
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create Twitter account" });
    }
  });

  app.delete("/api/accounts/twitter/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTwitterAccount(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete Twitter account" });
    }
  });

  app.get("/api/accounts/instagram", async (req, res) => {
    try {
      const credential = await storage.getInstagramCredential();
      res.json(credential || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Instagram credential" });
    }
  });

  app.post("/api/accounts/instagram", async (req, res) => {
    try {
      const validated = insertInstagramCredentialSchema.parse(req.body);
      const credential = await storage.upsertInstagramCredential(validated);
      res.json(credential);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to save Instagram credential" });
    }
  });

  app.post("/api/scrape/youtube", async (req, res) => {
    try {
      const { channel } = req.body;
      if (!channel) {
        return res.status(400).json({ error: "Channel name is required" });
      }

      const job = await storage.createJob({
        platform: "youtube",
        input: { channel },
      });

      const result = await scrapeYouTube(channel);

      await storage.updateJob(job.id, {
        status: "completed",
        result,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        result,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "YouTube scraping failed" });
    }
  });

  app.post("/api/scrape/twitter", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Username is required" });
      }

      const job = await storage.createJob({
        platform: "twitter",
        input: { username: query },
      });

      const result = await scrapeTwitter(query);

      await storage.updateJob(job.id, {
        status: "completed",
        result,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        result,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Twitter scraping failed" });
    }
  });

  app.post("/api/scrape/instagram", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const job = await storage.createJob({
        platform: "instagram",
        input: { username },
      });

      const result = await scrapeInstagram(username);

      await storage.updateJob(job.id, {
        status: "completed",
        result,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        result,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Instagram scraping failed" });
    }
  });

  app.post("/api/scrape/tiktok", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const job = await storage.createJob({
        platform: "tiktok",
        input: { username },
      });

      const result = await scrapeTikTok(username);

      await storage.updateJob(job.id, {
        status: "completed",
        result,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        result,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "TikTok scraping failed" });
    }
  });

  // TikTok fetch with query params: /api/tiktok?username=foo&page=1&per-page=10
  app.get("/api/tiktok", async (req, res) => {
    try {
      const username = typeof req.query.username === "string" ? req.query.username : undefined;
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const pageParam = typeof req.query.page === "string" ? Number.parseInt(req.query.page, 10) : 1;
      const perPageParamRaw =
        (typeof req.query["per-page"] === "string" && req.query["per-page"]) ||
        (typeof req.query.per_page === "string" && req.query.per_page);
      const perPageParam = perPageParamRaw ? Number.parseInt(perPageParamRaw, 10) : 10;

      const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
      const perPage = Number.isNaN(perPageParam) || perPageParam < 1 ? 10 : Math.min(perPageParam, 50);

      const result = await scrapeTikTok(username);
      const items = Array.isArray((result as any)?.data) ? (result as any).data : [];
      const total = items.length;
      const offset = (page - 1) * perPage;
      const data = items.slice(offset, offset + perPage);
      const totalPages = Math.max(1, Math.ceil(total / perPage));

      return res.json({
        meta: {
          ...(result as any)?.meta,
          username,
          page,
          per_page: perPage,
          total_pages: totalPages,
          total_posts: total,
        },
        data,
        status: (result as any)?.status ?? "success",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "TikTok scraping failed" });
    }
  });

  // Register enhanced metadata scraping routes (v2 API)
  registerMetadataRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
