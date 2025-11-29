/**
 * Inspect the JSON structure from __UNIVERSAL_DATA_FOR_REHYDRATION__
 */

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import axios from "axios";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env.local") });

const combinedCookie = `sessionid=${process.env.TIKTOK_SESSION_ID}; ${process.env.TIKTOK_COOKIE}`;

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
const universalRaw = $('script#__UNIVERSAL_DATA_FOR_REHYDRATION__').first().html();

if (universalRaw) {
  const payload = JSON.parse(universalRaw);

  console.log("Top-level keys:");
  console.log(Object.keys(payload));

  // Check for user profile data
  if (payload.__DEFAULT_SCOPE__) {
    console.log("\n__DEFAULT_SCOPE__ keys:");
    console.log(Object.keys(payload.__DEFAULT_SCOPE__));

    // Check each key for video data
    for (const [key, value] of Object.entries(payload.__DEFAULT_SCOPE__)) {
      if (typeof value === 'object' && value !== null) {
        console.log(`\n${key} structure:`, JSON.stringify(value, null, 2).substring(0, 500));
      }
    }
  }

  // Look for ItemModule or video data patterns
  const jsonStr = JSON.stringify(payload);
  console.log("\nSearching for video patterns:");
  console.log("Has 'ItemModule':", jsonStr.includes("ItemModule"));
  console.log("Has 'itemList':", jsonStr.includes("itemList"));
  console.log("Has 'videoList':", jsonStr.includes("videoList"));
  console.log("Has 'ItemInfo':", jsonStr.includes("ItemInfo"));
  console.log("Has 'playCount':", jsonStr.includes("playCount"));
  console.log("Has 'diggCount':", jsonStr.includes("diggCount"));
}
