/**
 * Test script to see what TikTok actually returns
 * Run this locally to debug the scraping issue
 */

import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function testTikTokResponse() {
  const username = "clipsexclusive_";
  const tiktokCookie = process.env.TIKTOK_COOKIE || "";
  const tiktokSessionId = process.env.TIKTOK_SESSION_ID || "";

  if (!tiktokCookie || !tiktokSessionId) {
    console.error("❌ Missing TikTok cookies in environment variables");
    return;
  }

  const combinedCookie = `sessionid=${tiktokSessionId}; ${tiktokCookie}`;

  console.log(`\n🎵 Testing TikTok scraping for @${username}`);
  console.log(`🍪 Using cookies: ${combinedCookie.substring(0, 50)}...`);

  try {
    const response = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: combinedCookie,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.tiktok.com/",
      },
      timeout: 20000,
      maxRedirects: 0,
      validateStatus: () => true,
    });

    console.log(`\n✅ Response Status: ${response.status}`);
    console.log(`📦 Response Size: ${response.data.length} bytes`);

    // Save the HTML for inspection
    fs.writeFileSync("tiktok-response.html", response.data);
    console.log(`💾 Saved response to tiktok-response.html`);

    // Parse with Cheerio
    const $ = cheerio.load(response.data);
    const title = $("title").text();
    console.log(`📄 Page Title: ${title}`);

    // Count scripts
    const scriptCount = $("script").length;
    console.log(`📜 Total Script Tags: ${scriptCount}`);

    // Check for specific script IDs
    const sigiState = $("#SIGI_STATE").length;
    console.log(`🎯 SIGI_STATE script: ${sigiState > 0 ? "✅ Found" : "❌ Not found"}`);

    // Look for data patterns
    const hasUniversalData = response.data.includes("__UNIVERSAL_DATA_FOR_REHYDRATION__");
    console.log(`🌐 __UNIVERSAL_DATA_FOR_REHYDRATION__: ${hasUniversalData ? "✅ Found" : "❌ Not found"}`);

    const hasItemModule = response.data.includes("ItemModule");
    console.log(`📦 ItemModule: ${hasItemModule ? "✅ Found" : "❌ Not found"}`);

    // Check for login/CAPTCHA indicators
    const hasLogin = response.data.toLowerCase().includes("login");
    const hasVerify = response.data.toLowerCase().includes("verify");
    const hasCaptcha = response.data.toLowerCase().includes("captcha");

    console.log(`\n🔒 Page Indicators:`);
    console.log(`   Login page: ${hasLogin ? "⚠️ Yes" : "✅ No"}`);
    console.log(`   Verify page: ${hasVerify ? "⚠️ Yes" : "✅ No"}`);
    console.log(`   CAPTCHA: ${hasCaptcha ? "⚠️ Yes" : "✅ No"}`);

    // Show first 500 characters
    console.log(`\n📝 Response Preview (first 500 chars):`);
    console.log(response.data.substring(0, 500));
    console.log("...\n");

  } catch (error: any) {
    console.error(`\n❌ Error:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data?.substring(0, 200));
    }
  }
}

testTikTokResponse();
