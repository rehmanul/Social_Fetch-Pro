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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private jobs: Map<string, Job>;
  private twitterAccounts: Map<string, TwitterAccount>;
  private instagramCredential: InstagramCredential | undefined;
  private platformStats: Map<string, PlatformStat>;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.twitterAccounts = new Map();
    this.instagramCredential = undefined;
    this.platformStats = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = crypto.randomUUID();
    const job: Job = {
      ...insertJob,
      id,
      status: "queued",
      result: null,
      error: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.jobs.set(id, job);
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getRecentJobs(limit: number): Promise<Job[]> {
    return (await this.getAllJobs()).slice(0, limit);
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const updated = { ...job, ...updates };
    this.jobs.set(id, updated);
    return updated;
  }

  async deleteJob(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getTwitterAccounts(): Promise<TwitterAccount[]> {
    return Array.from(this.twitterAccounts.values());
  }

  async createTwitterAccount(insertAccount: InsertTwitterAccount): Promise<TwitterAccount> {
    const id = crypto.randomUUID();
    const account: TwitterAccount = {
      ...insertAccount,
      id,
      status: "active",
      lastUsed: null,
      loginCount: 0,
      createdAt: new Date(),
    };
    this.twitterAccounts.set(id, account);
    return account;
  }

  async getTwitterAccount(id: string): Promise<TwitterAccount | undefined> {
    return this.twitterAccounts.get(id);
  }

  async updateTwitterAccount(id: string, updates: Partial<TwitterAccount>): Promise<TwitterAccount | undefined> {
    const account = this.twitterAccounts.get(id);
    if (!account) return undefined;
    const updated = { ...account, ...updates };
    this.twitterAccounts.set(id, updated);
    return updated;
  }

  async deleteTwitterAccount(id: string): Promise<boolean> {
    return this.twitterAccounts.delete(id);
  }

  async getInstagramCredential(): Promise<InstagramCredential | undefined> {
    return this.instagramCredential;
  }

  async upsertInstagramCredential(insertCredential: InsertInstagramCredential): Promise<InstagramCredential> {
    if (this.instagramCredential) {
      this.instagramCredential = {
        ...this.instagramCredential,
        ...insertCredential,
        updatedAt: new Date(),
      };
    } else {
      const id = crypto.randomUUID();
      this.instagramCredential = {
        ...insertCredential,
        id,
        sessionData: null,
        status: "active",
        lastUsed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return this.instagramCredential;
  }

  async updateInstagramCredential(id: string, updates: Partial<InstagramCredential>): Promise<InstagramCredential | undefined> {
    if (!this.instagramCredential || this.instagramCredential.id !== id) {
      return undefined;
    }
    this.instagramCredential = {
      ...this.instagramCredential,
      ...updates,
      updatedAt: new Date(),
    };
    return this.instagramCredential;
  }

  async getPlatformStats(): Promise<Record<string, PlatformStat>> {
    const stats: Record<string, PlatformStat> = {};
    for (const [platform, stat] of this.platformStats) {
      stats[platform] = stat;
    }
    return stats;
  }

  async updatePlatformStats(platform: string, updates: Partial<PlatformStat>): Promise<void> {
    const existing = this.platformStats.get(platform);
    if (existing) {
      this.platformStats.set(platform, { ...existing, ...updates, updatedAt: new Date() });
    } else {
      const id = crypto.randomUUID();
      this.platformStats.set(platform, {
        id,
        platform,
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        lastScrapedAt: null,
        updatedAt: new Date(),
        ...updates,
      });
    }
  }
}

export const storage = new MemStorage();
