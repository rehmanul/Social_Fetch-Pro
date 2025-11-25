import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Platform enumeration
export const platformEnum = ["youtube", "twitter", "instagram", "tiktok"] as const;
export type Platform = typeof platformEnum[number];

// Job status enumeration
export const jobStatusEnum = ["queued", "running", "completed", "failed"] as const;
export type JobStatus = typeof jobStatusEnum[number];

// Scraping Jobs Table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("queued"),
  input: jsonb("input").notNull(), // { url?, query?, user? }
  result: jsonb("result"), // Scraping results
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  platform: true,
  input: true,
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

// Twitter Accounts Pool Table
export const twitterAccounts = pgTable("twitter_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  emailPassword: text("email_password").notNull(),
  status: text("status").notNull().default("active"), // active, banned, locked
  lastUsed: timestamp("last_used"),
  loginCount: integer("login_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTwitterAccountSchema = createInsertSchema(twitterAccounts).pick({
  username: true,
  password: true,
  email: true,
  emailPassword: true,
});

export type TwitterAccount = typeof twitterAccounts.$inferSelect;
export type InsertTwitterAccount = z.infer<typeof insertTwitterAccountSchema>;

// Instagram Credentials Table (single account)
export const instagramCredentials = pgTable("instagram_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  password: text("password").notNull(),
  sessionData: jsonb("session_data"), // Stores session cookies and device UUID
  status: text("status").notNull().default("active"), // active, challenge_required, banned
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInstagramCredentialSchema = createInsertSchema(instagramCredentials).pick({
  username: true,
  password: true,
});

export type InstagramCredential = typeof instagramCredentials.$inferSelect;
export type InsertInstagramCredential = z.infer<typeof insertInstagramCredentialSchema>;

// Platform Statistics Table
export const platformStats = pgTable("platform_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull().unique(),
  totalJobs: integer("total_jobs").notNull().default(0),
  successfulJobs: integer("successful_jobs").notNull().default(0),
  failedJobs: integer("failed_jobs").notNull().default(0),
  lastScrapedAt: timestamp("last_scraped_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PlatformStat = typeof platformStats.$inferSelect;

// Users Table (kept for auth if needed)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
