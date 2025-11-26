import {
  type Job,
  type InsertJob,
  type TwitterAccount,
  type InsertTwitterAccount,
  type InstagramCredential,
  type InsertInstagramCredential,
  type PlatformStat,
} from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import crypto from "node:crypto";

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

const DATA_DIR = path.join(process.cwd(), ".data");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");
const TWITTER_ACCOUNTS_FILE = path.join(DATA_DIR, "twitter_accounts.json");
const INSTAGRAM_CREDENTIALS_FILE = path.join(DATA_DIR, "instagram_credentials.json");
const PLATFORM_STATS_FILE = path.join(DATA_DIR, "platform_stats.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(filePath: string, defaultValue: T): T {
  ensureDataDir();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

function writeJSON<T>(filePath: string, data: T): void {
  ensureDataDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

export class FileStorage implements IStorage {
  private jobs: Map<string, Job>;
  private twitterAccounts: Map<string, TwitterAccount>;
  private instagramCredential: InstagramCredential | undefined;
  private platformStats: Map<string, PlatformStat>;

  constructor() {
    this.jobs = new Map();
    this.twitterAccounts = new Map();
    this.instagramCredential = undefined;
    this.platformStats = new Map();
    this.load();
  }

  private load(): void {
    // Load jobs
    const jobsData = readJSON<Record<string, Job>>(JOBS_FILE, {});
    this.jobs = new Map(
      Object.entries(jobsData).map(([id, job]) => [id, this.parseJob(job)]),
    );

    // Load Twitter accounts
    const twitterData = readJSON<Record<string, TwitterAccount>>(TWITTER_ACCOUNTS_FILE, {});
    this.twitterAccounts = new Map(
      Object.entries(twitterData).map(([id, account]) => [id, this.parseTwitterAccount(account)]),
    );

    // Load Instagram credential
    const instagramData = readJSON<InstagramCredential | null>(INSTAGRAM_CREDENTIALS_FILE, null);
    this.instagramCredential = instagramData ? this.parseInstagramCredential(instagramData) : undefined;

    // Load platform stats
    const statsData = readJSON<Record<string, PlatformStat>>(PLATFORM_STATS_FILE, {});
    this.platformStats = new Map(
      Object.entries(statsData).map(([platform, stat]) => [platform, this.parsePlatformStat(stat)]),
    );

    console.log("✓ Data storage loaded from files");
  }

  private saveJobs(): void {
    const data: Record<string, Job> = {};
    for (const [key, value] of Array.from(this.jobs.entries())) {
      data[key] = value;
    }
    writeJSON(JOBS_FILE, data);
  }

  private saveTwitterAccounts(): void {
    const data: Record<string, TwitterAccount> = {};
    for (const [key, value] of Array.from(this.twitterAccounts.entries())) {
      data[key] = value;
    }
    writeJSON(TWITTER_ACCOUNTS_FILE, data);
  }

  private saveInstagramCredential(): void {
    writeJSON(INSTAGRAM_CREDENTIALS_FILE, this.instagramCredential || null);
  }

  private savePlatformStats(): void {
    const data: Record<string, PlatformStat> = {};
    for (const [key, value] of Array.from(this.platformStats.entries())) {
      data[key] = value;
    }
    writeJSON(PLATFORM_STATS_FILE, data);
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
    this.saveJobs();
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
    this.saveJobs();
    return updated;
  }

  async deleteJob(id: string): Promise<boolean> {
    const deleted = this.jobs.delete(id);
    if (deleted) this.saveJobs();
    return deleted;
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
    this.saveTwitterAccounts();
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
    this.saveTwitterAccounts();
    return updated;
  }

  async deleteTwitterAccount(id: string): Promise<boolean> {
    const deleted = this.twitterAccounts.delete(id);
    if (deleted) this.saveTwitterAccounts();
    return deleted;
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
    this.saveInstagramCredential();
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
    this.saveInstagramCredential();
    return this.instagramCredential;
  }

  async getPlatformStats(): Promise<Record<string, PlatformStat>> {
    const stats: Record<string, PlatformStat> = {};
    for (const [platform, stat] of Array.from(this.platformStats.entries())) {
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
    this.savePlatformStats();
  }

  private parseJob(job: Job): Job {
    return {
      ...job,
      createdAt: new Date(job.createdAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : null,
    };
  }

  private parseTwitterAccount(account: TwitterAccount): TwitterAccount {
    return {
      ...account,
      lastUsed: account.lastUsed ? new Date(account.lastUsed) : null,
      createdAt: new Date(account.createdAt),
    };
  }

  private parseInstagramCredential(credential: InstagramCredential): InstagramCredential {
    return {
      ...credential,
      lastUsed: credential.lastUsed ? new Date(credential.lastUsed) : null,
      createdAt: new Date(credential.createdAt),
      updatedAt: new Date(credential.updatedAt),
    };
  }

  private parsePlatformStat(stat: PlatformStat): PlatformStat {
    return {
      ...stat,
      lastScrapedAt: stat.lastScrapedAt ? new Date(stat.lastScrapedAt) : null,
      updatedAt: new Date(stat.updatedAt),
    };
  }
}

export const storage = new FileStorage();
