/**
 * Local test script for Bright Data proxy with TikTok scraping
 * Tests the advanced proxy management system
 */

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, ".env.local") });

console.log("\n🧪 Testing Bright Data Proxy Configuration");
console.log("==========================================\n");

console.log("Environment Variables:");
console.log(`✓ BRIGHTDATA_BROWSER_URL: ${process.env.BRIGHTDATA_BROWSER_URL ? "SET" : "NOT SET"}`);
console.log(`✓ USE_BRIGHTDATA: ${process.env.USE_BRIGHTDATA}`);
console.log(`✓ TIKTOK_COOKIE: ${process.env.TIKTOK_COOKIE ? "SET" : "NOT SET"}`);
console.log(`✓ TIKTOK_SESSION_ID: ${process.env.TIKTOK_SESSION_ID ? "SET" : "NOT SET"}`);

// Import after env vars are loaded
const { scrapeTikTok } = await import("./server/scrapers.js");

console.log("\n🎵 Testing TikTok scraping with advanced proxy system...\n");

try {
  const result = await scrapeTikTok("clipsexclusive_");

  console.log("\n✅ SUCCESS! TikTok scraping worked!");
  console.log("==========================================");
  console.log(`Videos found: ${result.data.length}`);
  console.log(`Fetch method: ${result.meta.fetch_method}`);

  if (result.data.length > 0) {
    console.log("\nFirst video:");
    console.log(`  Title: ${result.data[0].description?.substring(0, 60)}...`);
    console.log(`  Views: ${result.data[0].views}`);
    console.log(`  Likes: ${result.data[0].likes}`);
    console.log(`  URL: ${result.data[0].url}`);
  }

  process.exit(0);
} catch (error: any) {
  console.error("\n❌ FAILED! Error:", error.message);
  if (error.code) {
    console.error(`Error code: ${error.code}`);
  }
  if (error.stack) {
    console.error("\nStack trace:");
    console.error(error.stack);
  }
  process.exit(1);
}
