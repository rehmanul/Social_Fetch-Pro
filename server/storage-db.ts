import {
  type User,
  type InsertUser,
  type Job,
  type InsertJob,
  type TwitterAccount,
  type InsertTwitterAccount,
  type InstagramCredential,
  type InsertInstagramCredential,
  type PlatformStat,
  users,
  jobs,
  twitterAccounts,
  instagramCredentials,
  platformStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getAllJobs(): Promise<Job[]> {
    return db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getRecentJobs(limit: number): Promise<Job[]> {
    return db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(limit);
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const [updated] = await db.update(jobs).set(updates).where(eq(jobs.id, id)).returning();
    return updated;
  }

  async deleteJob(id: string): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return result.rowCount > 0;
  }

  async getTwitterAccounts(): Promise<TwitterAccount[]> {
    return db.select().from(twitterAccounts);
  }

  async createTwitterAccount(insertAccount: InsertTwitterAccount): Promise<TwitterAccount> {
    const [account] = await db.insert(twitterAccounts).values(insertAccount).returning();
    return account;
  }

  async getTwitterAccount(id: string): Promise<TwitterAccount | undefined> {
    const [account] = await db.select().from(twitterAccounts).where(eq(twitterAccounts.id, id));
    return account;
  }

  async updateTwitterAccount(id: string, updates: Partial<TwitterAccount>): Promise<TwitterAccount | undefined> {
    const [updated] = await db.update(twitterAccounts).set(updates).where(eq(twitterAccounts.id, id)).returning();
    return updated;
  }

  async deleteTwitterAccount(id: string): Promise<boolean> {
    const result = await db.delete(twitterAccounts).where(eq(twitterAccounts.id, id));
    return result.rowCount > 0;
  }

  async getInstagramCredential(): Promise<InstagramCredential | undefined> {
    const [credential] = await db.select().from(instagramCredentials).limit(1);
    return credential;
  }

  async upsertInstagramCredential(insertCredential: InsertInstagramCredential): Promise<InstagramCredential> {
    const existing = await this.getInstagramCredential();
    if (existing) {
      const [updated] = await db.update(instagramCredentials)
        .set({ ...insertCredential, updatedAt: new Date() })
        .where(eq(instagramCredentials.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(instagramCredentials).values(insertCredential).returning();
      return created;
    }
  }

  async updateInstagramCredential(id: string, updates: Partial<InstagramCredential>): Promise<InstagramCredential | undefined> {
    const [updated] = await db.update(instagramCredentials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(instagramCredentials.id, id))
      .returning();
    return updated;
  }

  async getPlatformStats(): Promise<Record<string, PlatformStat>> {
    const stats = await db.select().from(platformStats);
    const result: Record<string, PlatformStat> = {};
    for (const stat of stats) {
      result[stat.platform] = stat;
    }
    return result;
  }

  async updatePlatformStats(platform: string, updates: Partial<PlatformStat>): Promise<void> {
    const existing = await db.select().from(platformStats).where(eq(platformStats.platform, platform));
    if (existing.length > 0) {
      await db.update(platformStats)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(platformStats.platform, platform));
    } else {
      await db.insert(platformStats).values({
        platform,
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        lastScrapedAt: null,
        ...updates,
      });
    }
  }
}

export const storage = new DatabaseStorage();
