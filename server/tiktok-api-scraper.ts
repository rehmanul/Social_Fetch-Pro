/**
 * TikTok API Scraper using Cookie Authentication
 * Uses TikTok's unofficial API endpoints with session cookies
 */

import axios from "axios";
import { proxyManager } from "./proxy-manager-simple";

interface TikTokVideo {
  video_id: string;
  url: string;
  title: string;
  description: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  duration: number | null;
  published: string | undefined;
  channel: string;
  author_name: string;
  thumbnail_url: string | undefined;
}

export async function scrapeTikTokAPI(username: string): Promise<{
  meta: {
    username: string;
    page: number;
    total_pages: number;
    total_posts: number;
    fetch_method: string;
    status: string;
  };
  data: TikTokVideo[];
  status: string;
}> {
  const handle = username.trim().replace(/^@+/, "");

  // Build cookie string from environment variables
  const cookieObj = JSON.parse(process.env.TIKTOK_COOKIES || "{}");
  const cookieString = Object.entries(cookieObj)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  if (!cookieString) {
    throw new Error("TIKTOK_COOKIES not configured - add TikTok session cookies to environment");
  }

  console.log(`🎵 TikTok API: Fetching @${handle} with cookie authentication`);

  try {
    // Step 1: Get user info to obtain secUid
    console.log("🎵 TikTok API: Getting user secUid...");

    const userInfoResult = await proxyManager.makeRequest(
      `https://www.tiktok.com/api/user/detail/?uniqueId=${handle}`,
      {
        headers: {
          Cookie: cookieString,
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: `https://www.tiktok.com/@${handle}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        maxRetries: 2,
        retryStrategies: true,
      }
    );

    let userInfo;
    if (typeof userInfoResult.data === "string") {
      try {
        userInfo = JSON.parse(userInfoResult.data);
      } catch (e) {
        throw new Error("Failed to parse user info response");
      }
    } else {
      userInfo = userInfoResult.data;
    }

    const secUid = userInfo?.userInfo?.user?.secUid;
    if (!secUid) {
      console.log("User info response:", JSON.stringify(userInfo).substring(0, 500));
      throw new Error(`Could not find secUid for @${handle} - user may not exist or cookies may be invalid`);
    }

    console.log(`🎵 TikTok API: Got secUid: ${secUid.substring(0, 20)}...`);

    // Step 2: Get user's videos using secUid
    console.log("🎵 TikTok API: Fetching videos...");

    const videosResult = await proxyManager.makeRequest(
      `https://www.tiktok.com/api/post/item_list/?secUid=${secUid}&count=30&cursor=0`,
      {
        headers: {
          Cookie: cookieString,
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: `https://www.tiktok.com/@${handle}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        maxRetries: 2,
        retryStrategies: true,
      }
    );

    let videosData;
    if (typeof videosResult.data === "string") {
      if (videosResult.data.length === 0) {
        throw new Error("Empty response from TikTok videos API - cookies may be invalid or IP may be blocked");
      }
      try {
        videosData = JSON.parse(videosResult.data);
      } catch (e) {
        console.log("Videos response:", videosResult.data.substring(0, 500));
        throw new Error("Failed to parse videos response");
      }
    } else {
      videosData = videosResult.data;
    }

    const itemList = videosData?.itemList || [];

    if (itemList.length === 0) {
      console.log("Videos response:", JSON.stringify(videosData).substring(0, 500));
      throw new Error(`No videos found for @${handle} - profile may be private, have no videos, or cookies may be expired`);
    }

    console.log(`🎵 TikTok API: Found ${itemList.length} videos`);

    // Step 3: Transform to standard format
    const videos: TikTokVideo[] = itemList.slice(0, 15).map((item: any) => ({
      video_id: item.id,
      url: `https://www.tiktok.com/@${handle}/video/${item.id}`,
      title: item.desc || item.title || `TikTok video by @${handle}`,
      description: item.desc || item.title || `TikTok video by @${handle}`,
      views: item.stats?.playCount ?? null,
      likes: item.stats?.diggCount ?? null,
      comments: item.stats?.commentCount ?? null,
      shares: item.stats?.shareCount ?? null,
      duration: item.video?.duration ?? null,
      published: item.createTime ? new Date(item.createTime * 1000).toISOString() : undefined,
      channel: handle,
      author_name: item.author || handle,
      thumbnail_url: item.video?.cover ?? item.video?.dynamicCover ?? item.video?.originCover,
    }));

    return {
      meta: {
        username: handle,
        page: 1,
        total_pages: 1,
        total_posts: videos.length,
        fetch_method: "tiktok_api_cookie_auth",
        status: "success",
      },
      data: videos,
      status: "success",
    };
  } catch (error: any) {
    console.error("🎵 TikTok API error:", error.message);
    throw error;
  }
}
