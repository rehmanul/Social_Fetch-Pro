/**
 * Test TikTok API endpoint for fetching user videos
 */

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env.local") });

const combinedCookie = `sessionid=${process.env.TIKTOK_SESSION_ID}; ${process.env.TIKTOK_COOKIE}`;

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// TikTok uses this API endpoint to fetch user videos
const username = "clipsexclusive_";

console.log(`Testing TikTok API for @${username}...\n`);

// Try the item_list API endpoint
try {
  const response = await axios.get(`https://www.tiktok.com/api/post/item_list/`, {
    params: {
      secUid: "", // We'll get this from user detail
      count: 30,
      cursor: 0,
    },
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: combinedCookie,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: `https://www.tiktok.com/@${username}`,
      "X-Requested-With": "XMLHttpRequest",
    },
    timeout: 20000,
    validateStatus: () => true,
  });

  console.log("item_list API response:");
  console.log(`Status: ${response.status}`);
  console.log(`Data:`, JSON.stringify(response.data, null, 2).substring(0, 1000));
} catch (error: any) {
  console.error("item_list API error:", error.message);
}

console.log("\n---\n");

// First get the secUid from user info
try {
  console.log("Getting user secUid...");
  const userResponse = await axios.get(`https://www.tiktok.com/api/user/detail/`, {
    params: {
      uniqueId: username,
    },
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: combinedCookie,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: `https://www.tiktok.com/@${username}`,
    },
    timeout: 20000,
    validateStatus: () => true,
  });

  console.log(`User API Status: ${userResponse.status}`);

  if (userResponse.status === 200 && userResponse.data?.userInfo) {
    const secUid = userResponse.data.userInfo.user.secUid;
    console.log(`SecUid: ${secUid}\n`);

    // Now fetch videos with the correct secUid
    console.log("Fetching videos with secUid...");
    const videosResponse = await axios.get(`https://www.tiktok.com/api/post/item_list/`, {
      params: {
        secUid,
        count: 30,
        cursor: 0,
      },
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: combinedCookie,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: `https://www.tiktok.com/@${username}`,
      },
      timeout: 20000,
      validateStatus: () => true,
    });

    console.log(`Videos API Status: ${videosResponse.status}`);

    if (videosResponse.status === 200 && videosResponse.data) {
      const itemList = videosResponse.data.itemList || [];
      console.log(`✅ Found ${itemList.length} videos`);

      if (itemList.length > 0) {
        console.log("\nFirst video structure:");
        console.log(JSON.stringify(itemList[0], null, 2).substring(0, 2000));
      }
    } else {
      console.log("Response:", JSON.stringify(videosResponse.data, null, 2).substring(0, 500));
    }
  } else {
    console.log("User API response:", JSON.stringify(userResponse.data, null, 2).substring(0, 500));
  }
} catch (error: any) {
  console.error("API error:", error.message);
}
