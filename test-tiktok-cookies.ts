/**
 * Test TikTok API with Session Cookies
 * Tests the new cookie-based TikTok scraper with real session cookies
 */

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env.local") });

console.log("\n🎬 Testing TikTok Cookie-Based API Scraper");
console.log("==========================================\n");

// Verify environment variables
console.log("Environment Check:");
console.log(`✓ TIKTOK_COOKIES: ${process.env.TIKTOK_COOKIES ? "SET (" + process.env.TIKTOK_COOKIES.length + " chars)" : "NOT SET"}`);
console.log(`✓ BRIGHTDATA_BROWSER_URL: ${process.env.BRIGHTDATA_BROWSER_URL ? "SET" : "NOT SET"}`);
console.log(`✓ BRIGHTDATA_PROXY_URL: ${process.env.BRIGHTDATA_PROXY_URL ? "SET" : "NOT SET"}`);

if (!process.env.TIKTOK_COOKIES) {
  console.error("\n❌ ERROR: TIKTOK_COOKIES not set!");
  console.error("Add to .env.local:");
  console.error('TIKTOK_COOKIES=\'{"tt_session_tlb_tag_ads":"...","ttwid":"...","uid_tt":"..."}\'');
  process.exit(1);
}

// Parse and display cookies
try {
  const cookies = JSON.parse(process.env.TIKTOK_COOKIES);
  console.log("\n📋 Parsed Cookies:");
  for (const [key, value] of Object.entries(cookies)) {
    const valueStr = value as string;
    console.log(`   ${key}: ${valueStr.substring(0, 50)}${valueStr.length > 50 ? "..." : ""}`);
  }
} catch (error) {
  console.error("\n❌ ERROR: Invalid TIKTOK_COOKIES JSON format!");
  process.exit(1);
}

// Test TikTok API scraper
console.log("\n🎵 Testing TikTok API with @clipsexclusive_...\n");

const { scrapeTikTokAPI } = await import("./server/tiktok-api-scraper.js");

try {
  const result = await scrapeTikTokAPI("clipsexclusive_");

  console.log("\n✅ SUCCESS!");
  console.log("==========================================");

  // Display summary
  console.log(`\n📊 Summary:`);
  console.log(`   Username: ${result.meta.username}`);
  console.log(`   Videos: ${result.data.length}`);
  console.log(`   Method: ${result.meta.fetch_method}`);
  console.log(`   Status: ${result.meta.status}`);

  if (result.data.length > 0) {
    console.log(`\n🎬 First video:`);
    const video = result.data[0];
    console.log(`   ID: ${video.video_id}`);
    console.log(`   Title: ${video.title?.substring(0, 80)}${video.title && video.title.length > 80 ? "..." : ""}`);
    console.log(`   Views: ${video.views?.toLocaleString() || "N/A"}`);
    console.log(`   Likes: ${video.likes?.toLocaleString() || "N/A"}`);
    console.log(`   Comments: ${video.comments?.toLocaleString() || "N/A"}`);
    console.log(`   Shares: ${video.shares?.toLocaleString() || "N/A"}`);
    console.log(`   Duration: ${video.duration ? Math.floor(video.duration / 1000) + "s" : "N/A"}`);
    console.log(`   Published: ${video.published || "N/A"}`);
    console.log(`   URL: ${video.url}`);
    console.log(`   Thumbnail: ${video.thumbnail_url ? "✓" : "✗"}`);

    // Show full JSON for first video (truncated)
    console.log(`\n📄 Full Video JSON (first video):`);
    console.log(JSON.stringify(result.data[0], null, 2).substring(0, 1000));
    console.log("...\n");

    // Metadata quality check
    console.log(`\n📈 Metadata Quality Check:`);
    const videosWithViews = result.data.filter(v => v.views !== null).length;
    const videosWithLikes = result.data.filter(v => v.likes !== null).length;
    const videosWithThumbnails = result.data.filter(v => v.thumbnail_url).length;
    const videosWithPublishDate = result.data.filter(v => v.published).length;

    console.log(`   Views: ${videosWithViews}/${result.data.length} (${Math.round(videosWithViews / result.data.length * 100)}%)`);
    console.log(`   Likes: ${videosWithLikes}/${result.data.length} (${Math.round(videosWithLikes / result.data.length * 100)}%)`);
    console.log(`   Thumbnails: ${videosWithThumbnails}/${result.data.length} (${Math.round(videosWithThumbnails / result.data.length * 100)}%)`);
    console.log(`   Publish Dates: ${videosWithPublishDate}/${result.data.length} (${Math.round(videosWithPublishDate / result.data.length * 100)}%)`);

    const overallQuality = Math.round(
      ((videosWithViews + videosWithLikes + videosWithThumbnails + videosWithPublishDate) /
      (result.data.length * 4)) * 100
    );
    console.log(`\n   Overall Metadata Quality: ${overallQuality}%`);

    if (overallQuality >= 90) {
      console.log(`   ✅ EXCELLENT - Near 100% metadata coverage!`);
    } else if (overallQuality >= 70) {
      console.log(`   ⚠️  GOOD - Most metadata available`);
    } else {
      console.log(`   ❌ POOR - Missing significant metadata`);
    }
  }

  process.exit(0);
} catch (error: any) {
  console.error("\n❌ FAILED!");
  console.error("==========================================");
  console.error("Error:", error.message);

  if (error.stack) {
    console.error("\n📋 Stack Trace:");
    console.error(error.stack);
  }

  // Provide troubleshooting tips
  console.error("\n🔧 Troubleshooting Tips:");
  console.error("   1. Check if cookies are valid (not expired)");
  console.error("   2. Verify TIKTOK_COOKIES is properly formatted JSON");
  console.error("   3. Test profile exists: https://www.tiktok.com/@clipsexclusive_");
  console.error("   4. Check if proxy is working (BRIGHTDATA_PROXY_URL)");
  console.error("   5. Try with different TikTok username");

  process.exit(1);
}
