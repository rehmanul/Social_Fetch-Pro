/**
 * TikTok Scraper using Bright Data Scraping Browser
 * This is the ONLY working method since TikTok no longer includes videos in HTML
 */

import puppeteer from "puppeteer-core";

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

export async function scrapeTikTokBrowser(username: string): Promise<{
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
  const brightDataUrl = process.env.BRIGHTDATA_BROWSER_URL;

  if (!brightDataUrl) {
    throw new Error("BRIGHTDATA_BROWSER_URL not configured");
  }

  console.log(`🎵 TikTok Browser: Connecting to Bright Data for @${handle}...`);

  const browser = await puppeteer.connect({
    browserWSEndpoint: brightDataUrl,
  });

  try {
    const page = await browser.newPage();

    // Bright Data handles cookies automatically through the browser session
    // No need to set cookies manually

    console.log(`🎵 TikTok Browser: Navigating to profile...`);
    await page.goto(`https://www.tiktok.com/@${handle}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("🎵 TikTok Browser: Waiting for videos to load...");

    // Wait for video elements to appear
    await page.waitForSelector('[data-e2e="user-post-item"]', { timeout: 20000 });

    // Scroll to load more videos
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
    }

    console.log("🎵 TikTok Browser: Extracting video data...");

    // Extract video data
    const videos = await page.evaluate((username) => {
      const videoElements = Array.from(document.querySelectorAll('[data-e2e="user-post-item"]'));

      return videoElements.slice(0, 15).map((elem) => {
        // Get video link
        const link = elem.querySelector("a");
        const url = link?.href || "";
        const videoId = url.split("/video/")[1]?.split("?")[0] || "";

        // Get description from link title or aria-label
        const title = link?.getAttribute("title") || link?.getAttribute("aria-label") || "TikTok video";

        // Get thumbnail
        const img = elem.querySelector("img");
        const thumbnail = img?.src || undefined;

        // Get stats (views, likes might be in data attributes or text)
        const statsText = elem.textContent || "";
        const viewsMatch = statsText.match(/(\d+(?:\.\d+)?[KMB]?)\s*(?:views?|Views)/i);
        const likesMatch = statsText.match(/(\d+(?:\.\d+)?[KMB]?)\s*(?:likes?|Likes)/i);

        const parseCount = (str: string | null): number | null => {
          if (!str) return null;
          const num = parseFloat(str);
          if (str.includes("K")) return Math.round(num * 1000);
          if (str.includes("M")) return Math.round(num * 1000000);
          if (str.includes("B")) return Math.round(num * 1000000000);
          return Math.round(num);
        };

        return {
          video_id: videoId,
          url,
          title,
          description: title,
          views: parseCount(viewsMatch?.[1] || null),
          likes: parseCount(likesMatch?.[1] || null),
          comments: null,
          shares: null,
          duration: null,
          published: undefined,
          channel: username,
          author_name: username,
          thumbnail_url: thumbnail,
        };
      });
    }, handle);

    await browser.close();

    console.log(`🎵 TikTok Browser: Extracted ${videos.length} videos`);

    if (videos.length === 0) {
      throw new Error(`No videos found for @${username} using browser automation`);
    }

    return {
      meta: {
        username: handle,
        page: 1,
        total_pages: 1,
        total_posts: videos.length,
        fetch_method: "tiktok_browser_scrape_brightdata",
        status: "success",
      },
      data: videos,
      status: "success",
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
