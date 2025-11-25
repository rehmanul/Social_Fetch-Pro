import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  jobs,
  twitterAccounts,
  instagramCredentials,
  platformStats,
  type Job,
  type InsertJob,
  type TwitterAccount,
  type InsertTwitterAccount,
  type InstagramCredential,
  type InsertInstagramCredential,
  type PlatformStat,
} from "@shared/schema";

export interface IStorage {
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  getRecentJobs(limit: number): Promise<Job[]>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;

  getTwitterAccounts(): Promise<TwitterAccount[]>;
  createTwitterAccount(account: InsertTwitterAccount): Promise<TwitterAccount>;
  getTwitterAccount(id: string): Promise<TwitterAccount | undefined>;
  updateTwitterAccount(id: string, updates: Partial<TwitterAccount>): Promise<TwitterAccount | undefined>;
  deleteTwitterAccount(id: string): Promise<boolean>;

  getInstagramCredential(): Promise<InstagramCredential | undefined>;
  upsertInstagramCredential(credential: InsertInstagramCredential): Promise<InstagramCredential>;
  updateInstagramCredential(id: string, updates: Partial<InstagramCredential>): Promise<InstagramCredential | undefined>;

  getPlatformStats(): Promise<Record<string, PlatformStat>>;
  updatePlatformStats(platform: string, updates: Partial<PlatformStat>): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createJob(insertJob: InsertJob): Promise<Job> {
    try {
      const [job] = await db
        .insert(jobs)
        .values({
          ...insertJob,
          status: "queued" as const,
        })
        .returning();
      return job as Job;
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  }

  async getJob(id: string): Promise<Job | undefined> {
    try {
      const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching job:", error);
      throw error;
    }
  }

  async getAllJobs(): Promise<Job[]> {
    try {
      const result = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching all jobs:", error);
      throw error;
    }
  }

  async getRecentJobs(limit: number): Promise<Job[]> {
    try {
      const result = await db
        .select()
        .from(jobs)
        .orderBy(desc(jobs.createdAt))
        .limit(limit);
      return result;
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
      throw error;
    }
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    try {
      const [updated] = await db
        .update(jobs)
        .set(updates)
        .where(eq(jobs.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating job:", error);
      throw error;
    }
  }

  async deleteJob(id: string): Promise<boolean> {
    try {
      await db.delete(jobs).where(eq(jobs.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting job:", error);
      return false;
    }
  }

  async getTwitterAccounts(): Promise<TwitterAccount[]> {
    try {
      return await db.select().from(twitterAccounts);
    } catch (error) {
      console.error("Error fetching Twitter accounts:", error);
      throw error;
    }
  }

  async createTwitterAccount(insertAccount: InsertTwitterAccount): Promise<TwitterAccount> {
    try {
      const [account] = await db
        .insert(twitterAccounts)
        .values({
          ...insertAccount,
          status: "active" as const,
          loginCount: 0,
        })
        .returning();
      return account as TwitterAccount;
    } catch (error) {
      console.error("Error creating Twitter account:", error);
      throw error;
    }
  }

  async getTwitterAccount(id: string): Promise<TwitterAccount | undefined> {
    try {
      const result = await db
        .select()
        .from(twitterAccounts)
        .where(eq(twitterAccounts.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching Twitter account:", error);
      throw error;
    }
  }

  async updateTwitterAccount(id: string, updates: Partial<TwitterAccount>): Promise<TwitterAccount | undefined> {
    try {
      const [updated] = await db
        .update(twitterAccounts)
        .set(updates)
        .where(eq(twitterAccounts.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating Twitter account:", error);
      throw error;
    }
  }

  async deleteTwitterAccount(id: string): Promise<boolean> {
    try {
      await db.delete(twitterAccounts).where(eq(twitterAccounts.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting Twitter account:", error);
      return false;
    }
  }

  async getInstagramCredential(): Promise<InstagramCredential | undefined> {
    try {
      const result = await db.select().from(instagramCredentials).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching Instagram credential:", error);
      throw error;
    }
  }

  async upsertInstagramCredential(insertCredential: InsertInstagramCredential): Promise<InstagramCredential> {
    try {
      const existing = await this.getInstagramCredential();

      if (existing) {
        const [updated] = await db
          .update(instagramCredentials)
          .set({
            ...insertCredential,
            updatedAt: new Date(),
          })
          .where(eq(instagramCredentials.id, existing.id))
          .returning();
        return updated as InstagramCredential;
      }

      const [created] = await db
        .insert(instagramCredentials)
        .values({
          ...insertCredential,
          status: "active" as const,
        })
        .returning();
      return created as InstagramCredential;
    } catch (error) {
      console.error("Error upserting Instagram credential:", error);
      throw error;
    }
  }

  async updateInstagramCredential(id: string, updates: Partial<InstagramCredential>): Promise<InstagramCredential | undefined> {
    try {
      const [updated] = await db
        .update(instagramCredentials)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(instagramCredentials.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating Instagram credential:", error);
      throw error;
    }
  }

  async getPlatformStats(): Promise<Record<string, PlatformStat>> {
    try {
      const stats = await db.select().from(platformStats);
      const result: Record<string, PlatformStat> = {};
      for (const stat of stats) {
        result[stat.platform] = stat;
      }
      return result;
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      throw error;
    }
  }

  async updatePlatformStats(platform: string, updates: Partial<PlatformStat>): Promise<void> {
    try {
      const existing = await db
        .select()
        .from(platformStats)
        .where(eq(platformStats.platform, platform))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(platformStats)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(platformStats.platform, platform));
      } else {
        await db.insert(platformStats).values({
          platform,
          totalJobs: updates.totalJobs ?? 0,
          successfulJobs: updates.successfulJobs ?? 0,
          failedJobs: updates.failedJobs ?? 0,
          lastScrapedAt: updates.lastScrapedAt ?? null,
        });
      }
    } catch (error) {
      console.error("Error updating platform stats:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
