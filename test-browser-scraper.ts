/**
 * Test the new Bright Data browser scraper
 */

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env.local") });

console.log("\n🎬 Testing TikTok Browser Scraper");
console.log("==========================================\n");

console.log("Environment:");
console.log(`✓ BRIGHTDATA_BROWSER_URL: ${process.env.BRIGHTDATA_BROWSER_URL ? "SET" : "NOT SET"}`);
console.log(`✓ TIKTOK_COOKIE: ${process.env.TIKTOK_COOKIE ? "SET" : "NOT SET"}`);
console.log(`✓ TIKTOK_SESSION_ID: ${process.env.TIKTOK_SESSION_ID ? "SET" : "NOT SET"}`);

const { scrapeTikTok } = await import("./server/scrapers.js");

console.log("\n🎵 Testing @clipsexclusive_...\n");

try {
  const result = await scrapeTikTok("clipsexclusive_");

  console.log("\n✅ SUCCESS!");
  console.log("==========================================");
  console.log(JSON.stringify(result, null, 2).substring(0, 2000));
  console.log("...");

  console.log(`\n📊 Summary:`);
  console.log(`   Username: ${result.meta.username}`);
  console.log(`   Videos: ${result.data.length}`);
  console.log(`   Method: ${result.meta.fetch_method}`);
  console.log(`   Status: ${result.meta.status}`);

  if (result.data.length > 0) {
    console.log(`\n🎬 First video:`);
    console.log(`   ID: ${result.data[0].video_id}`);
    console.log(`   Title: ${result.data[0].title?.substring(0, 60)}...`);
    console.log(`   Views: ${result.data[0].views}`);
    console.log(`   Likes: ${result.data[0].likes}`);
    console.log(`   URL: ${result.data[0].url}`);
  }

  process.exit(0);
} catch (error: any) {
  console.error("\n❌ FAILED!");
  console.error("Error:", error.message);
  if (error.stack) {
    console.error("\nStack:", error.stack);
  }
  process.exit(1);
}
