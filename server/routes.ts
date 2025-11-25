import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertTwitterAccountSchema, insertInstagramCredentialSchema } from "@shared/schema";
import { z } from "zod";
import { scrapeYouTube, scrapeTikTok, scrapeTwitter, scrapeInstagram } from "./scrapers";

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

      // Fetch real data from YouTube
      const result = await scrapeYouTube(url);

      await storage.updateJob(job.id, {
        status: "completed",
        result,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        ...result,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start scraping job" });
    }
  });

  app.post("/api/scrape/twitter", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const job = await storage.createJob({
        platform: "twitter",
        input: { query },
      });

      // Fetch real data from Twitter
      const result = await scrapeTwitter(query);

      await storage.updateJob(job.id, {
        status: "completed",
        result,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        ...result,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start scraping job" });
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

      // Fetch real data from Instagram
      const result = await scrapeInstagram(username);

      await storage.updateJob(job.id, {
        status: "completed",
        result,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        ...result,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start scraping job" });
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

      // Fetch real data from TikTok
      const result = await scrapeTikTok(username);

      await storage.updateJob(job.id, {
        status: "completed",
        result,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        ...result,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start scraping job" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
