import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  jobs,
  twitterAccounts,
  instagramCredentials,
  platformStats,
  type User,
  type InsertUser,
  type Job,
  type InsertJob,
  type TwitterAccount,
  type InsertTwitterAccount,
  type InstagramCredential,
  type InsertInstagramCredential,
  type PlatformStat,
} from "@shared/schema";

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
    const result = await db.query.users.findFirst({ where: (users, { eq }) => eq(users.id, id) });
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({ where: (users, { eq }) => eq(users.username, username) });
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user as User;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db
      .insert(jobs)
      .values({
        ...insertJob,
        status: "queued" as const,
      })
      .returning();
    return job as Job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const result = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
    return result;
  }

  async getAllJobs(): Promise<Job[]> {
    const result = await db.query.jobs.findMany({
      orderBy: desc(jobs.createdAt),
    });
    return result;
  }

  async getRecentJobs(limit: number): Promise<Job[]> {
    const result = await db.query.jobs.findMany({
      orderBy: desc(jobs.createdAt),
      limit,
    });
    return result;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const [updated] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, id))
      .returning();
    return updated;
  }

  async deleteJob(id: string): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return !!result;
  }

  async getTwitterAccounts(): Promise<TwitterAccount[]> {
    return db.query.twitterAccounts.findMany();
  }

  async createTwitterAccount(insertAccount: InsertTwitterAccount): Promise<TwitterAccount> {
    const [account] = await db.insert(twitterAccounts).values(insertAccount).returning();
    return account as TwitterAccount;
  }

  async getTwitterAccount(id: string): Promise<TwitterAccount | undefined> {
    return db.query.twitterAccounts.findFirst({ where: eq(twitterAccounts.id, id) });
  }

  async updateTwitterAccount(id: string, updates: Partial<TwitterAccount>): Promise<TwitterAccount | undefined> {
    const [updated] = await db
      .update(twitterAccounts)
      .set(updates)
      .where(eq(twitterAccounts.id, id))
      .returning();
    return updated;
  }

  async deleteTwitterAccount(id: string): Promise<boolean> {
    const result = await db.delete(twitterAccounts).where(eq(twitterAccounts.id, id));
    return !!result;
  }

  async getInstagramCredential(): Promise<InstagramCredential | undefined> {
    return db.query.instagramCredentials.findFirst();
  }

  async upsertInstagramCredential(insertCredential: InsertInstagramCredential): Promise<InstagramCredential> {
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

    const [created] = await db.insert(instagramCredentials).values(insertCredential).returning();
    return created as InstagramCredential;
  }

  async updateInstagramCredential(id: string, updates: Partial<InstagramCredential>): Promise<InstagramCredential | undefined> {
    const [updated] = await db
      .update(instagramCredentials)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(instagramCredentials.id, id))
      .returning();
    return updated;
  }

  async getPlatformStats(): Promise<Record<string, PlatformStat>> {
    const stats = await db.query.platformStats.findMany();
    const result: Record<string, PlatformStat> = {};
    for (const stat of stats) {
      result[stat.platform] = stat;
    }
    return result;
  }

  async updatePlatformStats(platform: string, updates: Partial<PlatformStat>): Promise<void> {
    const existing = await db.query.platformStats.findFirst({
      where: eq(platformStats.platform, platform),
    });

    if (existing) {
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
        ...updates,
      });
    }
  }
}

export const storage = new DatabaseStorage();
