import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertTwitterAccountSchema, insertInstagramCredentialSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get("/api/stats", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      const twitterAccounts = await storage.getTwitterAccounts();
      const instagramAccount = await storage.getInstagramCredential();
      
      const completedJobs = jobs.filter(j => j.status === "completed");
      const successRate = jobs.length > 0 
        ? Math.round((completedJobs.length / jobs.length) * 100) 
        : 0;
      
      const activeAccounts = twitterAccounts.filter(a => a.status === "active").length + 
        (instagramAccount && instagramAccount.status === "active" ? 1 : 0);
      
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
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const job = await storage.createJob({
        platform: "youtube",
        input: { url },
      });

      await storage.updatePlatformStats("youtube", {
        totalJobs: (await storage.getPlatformStats()).youtube?.totalJobs || 0 + 1,
      });

      try {
        const mockResult = {
          id: "dQw4w9WgXcQ",
          title: "Sample YouTube Video",
          views: 1234567,
          channel: "Sample Channel",
          duration: 180,
          upload_date: "20240101",
          tags: ["sample", "video", "youtube"],
        };

        await storage.updateJob(job.id, {
          status: "completed",
          result: mockResult,
          completedAt: new Date(),
        });

        await storage.updatePlatformStats("youtube", {
          successfulJobs: (await storage.getPlatformStats()).youtube?.successfulJobs || 0 + 1,
        });

        res.json({
          jobId: job.id,
          status: "completed",
          result: mockResult,
        });
      } catch (scrapeError) {
        await storage.updateJob(job.id, {
          status: "failed",
          error: scrapeError instanceof Error ? scrapeError.message : "Unknown error",
          completedAt: new Date(),
        });

        await storage.updatePlatformStats("youtube", {
          failedJobs: (await storage.getPlatformStats()).youtube?.failedJobs || 0 + 1,
        });

        res.status(500).json({
          jobId: job.id,
          status: "failed",
          error: scrapeError instanceof Error ? scrapeError.message : "Scraping failed",
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to start scraping job" });
    }
  });

  app.post("/api/scrape/twitter", async (req, res) => {
    try {
      const { query, limit = 100 } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const twitterAccounts = await storage.getTwitterAccounts();
      if (twitterAccounts.length === 0) {
        return res.status(400).json({ 
          error: "No Twitter accounts configured. Please add accounts first." 
        });
      }

      const job = await storage.createJob({
        platform: "twitter",
        input: { query, limit },
      });

      await storage.updatePlatformStats("twitter", {
        totalJobs: (await storage.getPlatformStats()).twitter?.totalJobs || 0 + 1,
      });

      try {
        const mockResult = [
          {
            id: "1234567890",
            username: "sample_user",
            text: `Sample tweet about ${query}`,
            likes: 42,
            retweets: 10,
            date: new Date().toISOString(),
          },
          {
            id: "1234567891",
            username: "another_user",
            text: `Another tweet mentioning ${query}`,
            likes: 123,
            retweets: 45,
            date: new Date().toISOString(),
          },
        ];

        await storage.updateJob(job.id, {
          status: "completed",
          result: mockResult,
          completedAt: new Date(),
        });

        await storage.updatePlatformStats("twitter", {
          successfulJobs: (await storage.getPlatformStats()).twitter?.successfulJobs || 0 + 1,
        });

        res.json({
          jobId: job.id,
          status: "completed",
          result: mockResult,
        });
      } catch (scrapeError) {
        await storage.updateJob(job.id, {
          status: "failed",
          error: scrapeError instanceof Error ? scrapeError.message : "Unknown error",
          completedAt: new Date(),
        });

        await storage.updatePlatformStats("twitter", {
          failedJobs: (await storage.getPlatformStats()).twitter?.failedJobs || 0 + 1,
        });

        res.status(500).json({
          jobId: job.id,
          status: "failed",
          error: scrapeError instanceof Error ? scrapeError.message : "Scraping failed",
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to start scraping job" });
    }
  });

  app.post("/api/scrape/instagram", async (req, res) => {
    try {
      const { username, amount = 20 } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const instagramCredential = await storage.getInstagramCredential();
      if (!instagramCredential) {
        return res.status(400).json({ 
          error: "Instagram credentials not configured. Please add credentials first." 
        });
      }

      const job = await storage.createJob({
        platform: "instagram",
        input: { username, amount },
      });

      await storage.updatePlatformStats("instagram", {
        totalJobs: (await storage.getPlatformStats()).instagram?.totalJobs || 0 + 1,
      });

      try {
        const mockResult = [
          {
            pk: "3123456789",
            caption: `Sample post from ${username}`,
            likes: 567,
            comments: 23,
            type: 1,
          },
          {
            pk: "3123456790",
            caption: "Another sample Instagram post",
            likes: 890,
            comments: 45,
            type: 2,
          },
        ];

        await storage.updateJob(job.id, {
          status: "completed",
          result: mockResult,
          completedAt: new Date(),
        });

        await storage.updatePlatformStats("instagram", {
          successfulJobs: (await storage.getPlatformStats()).instagram?.successfulJobs || 0 + 1,
        });

        res.json({
          jobId: job.id,
          status: "completed",
          result: mockResult,
        });
      } catch (scrapeError) {
        await storage.updateJob(job.id, {
          status: "failed",
          error: scrapeError instanceof Error ? scrapeError.message : "Unknown error",
          completedAt: new Date(),
        });

        await storage.updatePlatformStats("instagram", {
          failedJobs: (await storage.getPlatformStats()).instagram?.failedJobs || 0 + 1,
        });

        res.status(500).json({
          jobId: job.id,
          status: "failed",
          error: scrapeError instanceof Error ? scrapeError.message : "Scraping failed",
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to start scraping job" });
    }
  });

  app.post("/api/scrape/tiktok", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const job = await storage.createJob({
        platform: "tiktok",
        input: { url },
      });

      await storage.updatePlatformStats("tiktok", {
        totalJobs: (await storage.getPlatformStats()).tiktok?.totalJobs || 0 + 1,
      });

      try {
        const mockResult = {
          platform: "TikTok",
          status: "Signed & Ready",
          video_id: "7234567890123456789",
          views: 234567,
          likes: 12345,
          comments: 678,
          creator: "sample_creator",
          signed_headers: {
            "User-Agent": "Mozilla/5.0...",
            "X-Bogus": "DFSzswVL...",
            "_signature": "_02B4Z6...",
          },
        };

        await storage.updateJob(job.id, {
          status: "completed",
          result: mockResult,
          completedAt: new Date(),
        });

        await storage.updatePlatformStats("tiktok", {
          successfulJobs: (await storage.getPlatformStats()).tiktok?.successfulJobs || 0 + 1,
        });

        res.json({
          jobId: job.id,
          status: "completed",
          result: mockResult,
        });
      } catch (scrapeError) {
        await storage.updateJob(job.id, {
          status: "failed",
          error: scrapeError instanceof Error ? scrapeError.message : "Unknown error",
          completedAt: new Date(),
        });

        await storage.updatePlatformStats("tiktok", {
          failedJobs: (await storage.getPlatformStats()).tiktok?.failedJobs || 0 + 1,
        });

        res.status(500).json({
          jobId: job.id,
          status: "failed",
          error: scrapeError instanceof Error ? scrapeError.message : "Scraping failed",
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to start scraping job" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
