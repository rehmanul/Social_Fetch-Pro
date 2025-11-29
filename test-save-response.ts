/**
 * Save TikTok response to file for inspection
 */

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as fs from "fs";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env.local") });

const combinedCookie = `sessionid=${process.env.TIKTOK_SESSION_ID}; ${process.env.TIKTOK_COOKIE}`;

console.log("Fetching TikTok page...");

const response = await axios.get("https://www.tiktok.com/@clipsexclusive_", {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Cookie: combinedCookie,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.tiktok.com/",
  },
  timeout: 20000,
  maxRedirects: 0,
  validateStatus: () => true,
});

console.log(`Status: ${response.status}`);
console.log(`Size: ${response.data.length} bytes`);

fs.writeFileSync("tiktok-direct-response.html", response.data);
console.log("Saved to tiktok-direct-response.html");

// Check for script tags
const hasScript = response.data.includes("<script");
const hasLogin = response.data.toLowerCase().includes("login");
const hasVerify = response.data.toLowerCase().includes("verify");
const hasSIGI = response.data.includes("SIGI_STATE");
const hasItemModule = response.data.includes("ItemModule");

console.log(`\nContent check:`);
console.log(`  Has <script> tags: ${hasScript}`);
console.log(`  Has login indicators: ${hasLogin}`);
console.log(`  Has verify page: ${hasVerify}`);
console.log(`  Has SIGI_STATE: ${hasSIGI}`);
console.log(`  Has ItemModule: ${hasItemModule}`);
