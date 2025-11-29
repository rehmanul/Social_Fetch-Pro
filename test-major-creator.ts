/**
 * Test with a major TikTok creator to verify scraper works
 */

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env.local") });

console.log("\n🧪 Testing with major TikTok creator");
console.log("==========================================\n");

// Import after env vars are loaded
const { scrapeTikTok } = await import("./server/scrapers.js");

// Test with a major creator that definitely has videos
const testUsers = ["mrbeast", "khaby.lame", "charlidamelio"];

for (const user of testUsers) {
  console.log(`\n🎵 Testing @${user}...\n`);

  try {
    const result = await scrapeTikTok(user);

    console.log("\n✅ SUCCESS!");
    console.log("==========================================");
    console.log(`Username: ${result.meta.username}`);
    console.log(`Videos found: ${result.data.length}`);
    console.log(`Fetch method: ${result.meta.fetch_method}`);
    console.log(`Status: ${result.meta.status}`);

    if (result.data.length > 0) {
      console.log("\nFirst video:");
      console.log(`  ID: ${result.data[0].video_id}`);
      console.log(`  Title: ${result.data[0].title?.substring(0, 60)}...`);
      console.log(`  Views: ${result.data[0].views}`);
      console.log(`  Likes: ${result.data[0].likes}`);
      console.log(`  URL: ${result.data[0].url}`);
      console.log(`  Thumbnail: ${result.data[0].thumbnail_url?.substring(0, 80)}...`);
    }

    console.log("\n✅ Scraper is working! Breaking...");
    break; // Success! Stop testing
  } catch (error: any) {
    console.error(`\n❌ Failed for @${user}:`, error.message);
  }
}
