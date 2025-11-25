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

      const mockResult = {
        meta: {
          url,
          page: 1,
          total_pages: 1,
          total_videos: 1,
          fetch_method: "oauth2_tv_client",
          status: "success",
        },
        data: [{
          video_id: "dQw4w9WgXcQ",
          url,
          title: "Sample YouTube Video",
          description: "A sample video from YouTube using OAuth2 TV client",
          views: 1234567,
          likes: 54321,
          comments: 2345,
          duration: 180,
          channel: "Sample Channel",
          author_name: "Sample Channel",
          thumbnail_url: "https://via.placeholder.com/320x180?text=YouTube",
        }],
        status: "success",
      };

      await storage.updateJob(job.id, {
        status: "completed",
        result: mockResult,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        ...mockResult,
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

      const mockResult = {
        meta: {
          query,
          page: 1,
          total_pages: 1,
          total_tweets: 2,
          fetch_method: "account_swarm",
          status: "success",
        },
        data: [
          {
            video_id: "1234567890",
            url: "https://twitter.com/sample/status/1234567890",
            description: `Sample tweet about ${query}`,
            views: 5432,
            likes: 42,
            comments: 10,
            shares: 8,
            author_name: "sample_user",
          },
          {
            video_id: "1234567891",
            url: "https://twitter.com/another/status/1234567891",
            description: `Another tweet mentioning ${query}`,
            views: 8765,
            likes: 123,
            comments: 45,
            shares: 34,
            author_name: "another_user",
          },
        ],
        status: "success",
      };

      await storage.updateJob(job.id, {
        status: "completed",
        result: mockResult,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        ...mockResult,
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

      const mockResult = {
        meta: {
          username,
          page: 1,
          total_pages: 1,
          total_posts: 2,
          fetch_method: "mobile_api_emulation",
          status: "success",
        },
        data: [
          {
            video_id: "3123456789",
            url: `https://instagram.com/p/3123456789/`,
            description: `Sample post from ${username}`,
            views: 890,
            likes: 567,
            comments: 23,
            shares: 12,
            author_name: username,
            thumbnail_url: "https://via.placeholder.com/400x400?text=Instagram",
          },
          {
            video_id: "3123456790",
            url: `https://instagram.com/p/3123456790/`,
            description: "Another sample Instagram post",
            views: 1200,
            likes: 890,
            comments: 45,
            shares: 34,
            author_name: username,
            thumbnail_url: "https://via.placeholder.com/400x400?text=Instagram",
          },
        ],
        status: "success",
      };

      await storage.updateJob(job.id, {
        status: "completed",
        result: mockResult,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        ...mockResult,
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

      const mockResult = {
        meta: {
          username,
          page: 1,
          total_pages: 1,
          posts_per_page: 30,
          total_posts: 2,
          fetched_posts: 2,
          fetch_method: "hybrid_signing_architecture",
          status: "success",
          has_more: false,
        },
        data: [
          {
            video_id: "6727327145951183878",
            url: `https://www.tiktok.com/@${username}/video/6727327145951183878`,
            description: "Sample TikTok video",
            views: 234567,
            likes: 12345,
            comments: 678,
            shares: 456,
            duration: 15,
            author_name: username,
            thumbnail_url: "https://via.placeholder.com/480x854?text=TikTok",
          },
          {
            video_id: "6727327145951183879",
            url: `https://www.tiktok.com/@${username}/video/6727327145951183879`,
            description: "Another TikTok video",
            views: 567890,
            likes: 45678,
            comments: 1234,
            shares: 890,
            duration: 12,
            author_name: username,
            thumbnail_url: "https://via.placeholder.com/480x854?text=TikTok",
          },
        ],
        status: "success",
      };

      await storage.updateJob(job.id, {
        status: "completed",
        result: mockResult,
        completedAt: new Date(),
      });

      res.json({
        jobId: job.id,
        status: "completed",
        ...mockResult,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start scraping job" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
