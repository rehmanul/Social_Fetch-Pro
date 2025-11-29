/**
 * Complete exploration of TikTok JSON to find video data
 */

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";

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

const $ = cheerio.load(response.data);
const universalRaw = $("script#__UNIVERSAL_DATA_FOR_REHYDRATION__").first().html();

if (!universalRaw) {
  console.error("No __UNIVERSAL_DATA_FOR_REHYDRATION__ found!");
  process.exit(1);
}

const payload = JSON.parse(universalRaw);

// Save full JSON for inspection
fs.writeFileSync("tiktok-full-payload.json", JSON.stringify(payload, null, 2));
console.log("Saved full payload to tiktok-full-payload.json");

// Recursive function to find video data
function findVideosInObject(obj: any, path: string = ""): any {
  if (!obj || typeof obj !== "object") return null;

  // Check if this object looks like a video
  if (obj.id && obj.desc && obj.stats && (obj.stats.diggCount !== undefined || obj.stats.playCount !== undefined)) {
    return { path, video: obj };
  }

  // Check if this is an array of videos
  if (Array.isArray(obj)) {
    const firstItem = obj[0];
    if (firstItem && firstItem.id && firstItem.desc && firstItem.stats) {
      return { path, videos: obj };
    }
  }

  // Recursively search
  for (const key in obj) {
    const newPath = path ? `${path}.${key}` : key;
    const result = findVideosInObject(obj[key], newPath);
    if (result) return result;
  }

  return null;
}

console.log("\nSearching for video data...");
const result = findVideosInObject(payload);

if (result) {
  if (result.videos) {
    console.log(`\n✅ FOUND VIDEO ARRAY at path: ${result.path}`);
    console.log(`   Number of videos: ${result.videos.length}`);
    console.log(`\n   First video structure:`);
    console.log(JSON.stringify(result.videos[0], null, 2).substring(0, 1500));

    // Save videos array
    fs.writeFileSync("tiktok-videos-array.json", JSON.stringify(result.videos, null, 2));
    console.log(`\n   Saved all videos to tiktok-videos-array.json`);

    console.log(`\n📍 EXTRACTION PATH: payload.${result.path}`);
  } else if (result.video) {
    console.log(`\n✅ FOUND SINGLE VIDEO at path: ${result.path}`);
    console.log(JSON.stringify(result.video, null, 2).substring(0, 1000));
  }
} else {
  console.log("❌ No video data found in expected format");
  console.log("\nTrying alternative search...");

  // Search for any object with video-like properties
  const jsonStr = JSON.stringify(payload);
  console.log("Contains 'diggCount':", jsonStr.includes("diggCount"));
  console.log("Contains 'playCount':", jsonStr.includes("playCount"));
  console.log("Contains 'createTime':", jsonStr.includes("createTime"));
  console.log("Contains 'video':", jsonStr.includes('"video"'));

  // Check all top-level keys
  console.log("\nTop-level structure:");
  console.log(Object.keys(payload));

  if (payload.__DEFAULT_SCOPE__) {
    console.log("\n__DEFAULT_SCOPE__ keys:");
    console.log(Object.keys(payload.__DEFAULT_SCOPE__));
  }
}
