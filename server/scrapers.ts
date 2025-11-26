import axios from "axios";
import * as cheerio from "cheerio";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

// ============ YOUTUBE SCRAPER (COOKIE-BASED) ============
export async function scrapeYouTube(channelName: string) {
  try {
    const youtubeCookie = process.env.YOUTUBE_COOKIE;
    console.log("🎥 YouTube: Starting scrape for", channelName, "with cookies:", youtubeCookie ? "✓" : "✗");

    if (!youtubeCookie) {
      throw new Error("YOUTUBE_COOKIE not configured - add it to environment secrets from a signed-in YouTube session.");
    }

    try {
      const response = await axios.get(`https://www.youtube.com/@${channelName}/videos`, {
        headers: {
          "User-Agent": USER_AGENT,
          Cookie: youtubeCookie,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 20000,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        throw new Error(`YouTube returned status ${response.status} - cookies may be invalid/expired`);
      }

      const initialData = extractJsonFromHtml(response.data, [
        /var ytInitialData = ({[\s\S]*?});<\/script>/,
        /"ytInitialData":({[\s\S]*?}),"ytInitialPlayerResponse"/,
      ]);

      const tabs = initialData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
      const videosTab = tabs.find((tab: any) => tab?.tabRenderer?.content?.richGridRenderer);
      const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

      const videos = contents
        .map((item: any) => item?.richItemRenderer?.content?.videoRenderer)
        .filter(Boolean)
        .slice(0, 15)
        .map((video: any) => {
          const videoId = video.videoId;
          const title = extractRunsText(video.title?.runs) || "Untitled video";
          const viewCountText = extractRunsText(video.viewCountText?.runs) || video.viewCountText?.simpleText;
          const durationText = video.lengthText?.simpleText || extractRunsText(video.lengthText?.runs);
          const description = extractRunsText(video.descriptionSnippet?.runs) || "";
          const thumbnails = video.thumbnail?.thumbnails || [];
          const thumbnail = thumbnails[thumbnails.length - 1]?.url;

          return {
            video_id: videoId,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            title,
            description,
            views: parseNumericValue(viewCountText),
            duration: parseVideoDuration(durationText),
            published: video.publishedTimeText?.simpleText || extractRunsText(video.publishedTimeText?.runs),
            channel: channelName,
            author_name: channelName,
            thumbnail_url: thumbnail,
          };
        });

      if (videos.length === 0) {
        throw new Error(`No videos found for @${channelName} - channel may not exist or require additional cookies.`);
      }

      console.log("🎥 YouTube: Parsed", videos.length, "videos from profile");

      return {
        meta: {
          channel: channelName,
          page: 1,
          total_pages: 1,
          total_videos: videos.length,
          fetch_method: "youtube_cookie_scrape_real",
          status: "success",
        },
        data: videos,
        status: "success",
      };
    } catch (error: any) {
      console.error("🎥 YouTube error:", error.message);
      throw error;
    }
  } catch (error: any) {
    console.error("🎥 YouTube error:", error.message);
    throw error;
  }
}

// ============ TWITTER SCRAPER (COOKIE-BASED) ============
export async function scrapeTwitter(username: string) {
  try {
    const twitterCookie = process.env.TWITTER_COOKIE;
    console.log("🐦 Twitter: Starting scrape for @" + username, "with cookies:", twitterCookie ? "✓" : "✗");

    if (!twitterCookie) {
      throw new Error("TWITTER_COOKIE not configured - add it to environment secrets from a logged-in Twitter session.");
    }

    try {
      // Scrape Twitter profile
      const response = await axios.get(`https://twitter.com/${username}`, {
        headers: {
          "User-Agent": USER_AGENT,
          Cookie: twitterCookie,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        throw new Error(`Twitter returned status ${response.status} - cookies may be invalid/expired or user not found`);
      }

      const $ = cheerio.load(response.data);
      const tweets: any[] = [];

      const nextDataRaw = $('script[id="__NEXT_DATA__"]').html();
      if (nextDataRaw) {
        try {
          const nextData = JSON.parse(nextDataRaw);
          const instructions = nextData?.props?.pageProps?.timeline?.instructions || [];

          for (const instruction of instructions) {
            const entries = instruction.addEntries?.entries || instruction.entries || [];
            for (const entry of entries) {
              const content = entry?.content?.itemContent?.tweet_results?.result;
              const tweet = content?.legacy;
              if (tweet?.id_str) {
                tweets.push({
                  video_id: tweet.id_str,
                  url: `https://twitter.com/${username}/status/${tweet.id_str}`,
                  description: tweet.full_text || tweet.text || "Tweet",
                  likes: tweet.favorite_count,
                  comments: tweet.reply_count,
                  shares: tweet.retweet_count,
                  views: tweet.quote_count ?? null,
                  author_name: tweet.user_id_str,
                  created_at: tweet.created_at,
                });
              }
            }
          }
        } catch (parseErr) {
          console.warn("🐦 Twitter: Failed to parse __NEXT_DATA__ payload", parseErr);
        }
      }

      // Fallback to href-based discovery if JSON is unavailable
      if (tweets.length === 0) {
        $('a[href*="/status/"]').each((_, elem) => {
          const href = $(elem).attr("href");
          if (href && href.includes(`/${username}/status/`)) {
            const tweetId = href.split("/status/")[1]?.split(/[?#]/)[0];
            if (tweetId && /^\d+$/.test(tweetId) && !tweets.some((t) => t.video_id === tweetId)) {
              tweets.push({
                video_id: tweetId,
                url: `https://twitter.com/${username}/status/${tweetId}`,
                description: "Tweet",
                likes: null,
                comments: null,
                shares: null,
                views: null,
                author_name: username,
              });
            }
          }
        });
      }

      if (tweets.length === 0) {
        throw new Error(`No tweets found for @${username} - profile may be private, deleted, or cookies invalid`);
      }

      console.log("🐦 Twitter: Got", tweets.length, "tweets from profile");

      return {
        meta: {
          username,
          page: 1,
          total_pages: 1,
          total_tweets: tweets.length,
          fetch_method: "twitter_cookie_scrape_real",
          status: "success",
        },
        data: tweets,
        status: "success",
      };
    } catch (error: any) {
      console.error("🐦 Twitter error:", error.message);
      throw error;
    }
  } catch (error: any) {
    console.error("🐦 Twitter error:", error.message);
    throw error;
  }
}

// ============ INSTAGRAM SCRAPER (COOKIE-BASED) ============
export async function scrapeInstagram(username: string) {
  try {
    const instagramCookie = process.env.INSTAGRAM_COOKIE;
    const instagramSessionId = process.env.INSTAGRAM_SESSION_ID;
    console.log("📷 Instagram: Starting scrape for @" + username, "with cookies:", instagramCookie && instagramSessionId ? "✓" : "✗");

    if (!instagramCookie || !instagramSessionId) {
      throw new Error("INSTAGRAM_COOKIE or INSTAGRAM_SESSION_ID not configured - add them to Replit secrets. Get from Instagram browser session.");
    }

    try {
      // Use the web profile API which returns structured media data when authenticated
      const response = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
        headers: {
          "User-Agent": USER_AGENT,
          Cookie: `sessionid=${instagramSessionId}; ${instagramCookie}`,
          Accept: "application/json",
        },
        timeout: 20000,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        throw new Error(`Instagram returned status ${response.status} - cookies may be invalid/expired`);
      }

      const user = response.data?.data?.user;
      const edges = user?.edge_owner_to_timeline_media?.edges || [];
      const posts = edges.slice(0, 15).map((edge: any) => {
        const node = edge.node;
        const description = node.edge_media_to_caption?.edges?.[0]?.node?.text || node.accessibility_caption || "Instagram post";
        return {
          video_id: node.id,
          shortcode: node.shortcode,
          url: `https://www.instagram.com/p/${node.shortcode}/`,
          description,
          views: node.is_video ? node.video_view_count ?? 0 : null,
          likes: node.edge_media_preview_like?.count ?? 0,
          comments: node.edge_media_to_comment?.count ?? 0,
          shares: null,
          author_name: username,
          thumbnail_url: node.display_url,
          is_video: node.is_video,
          timestamp: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toISOString() : undefined,
        };
      });

      if (posts.length === 0) {
        throw new Error(`No posts found for @${username} - profile may be private, deleted, or cookies invalid`);
      }

      console.log("📷 Instagram: Got", posts.length, "posts from profile");

      return {
        meta: {
          username,
          page: 1,
          total_pages: 1,
          total_posts: posts.length,
          fetch_method: "instagram_cookie_scrape_real",
          status: "success",
        },
        data: posts,
        status: "success",
      };
    } catch (error: any) {
      console.error("📷 Instagram error:", error.message);
      throw error;
    }
  } catch (error: any) {
    console.error("📷 Instagram error:", error.message);
    throw error;
  }
}

// ============ TIKTOK SCRAPER (COOKIE-BASED) ============
export async function scrapeTikTok(username: string) {
  try {
    const tiktokCookie = process.env.TIKTOK_COOKIE;
    const tiktokSessionId = process.env.TIKTOK_SESSION_ID;
    console.log("🎵 TikTok: Starting scrape for @" + username, "with cookies:", tiktokCookie && tiktokSessionId ? "✓" : "✗");

    if (!tiktokCookie || !tiktokSessionId) {
      throw new Error("TIKTOK_COOKIE or TIKTOK_SESSION_ID not configured - add them to Replit secrets. Get from TikTok browser session.");
    }

    try {
      // Scrape TikTok profile and parse the pre-rendered SIGI_STATE payload
      const response = await axios.get(`https://www.tiktok.com/@${username}`, {
        headers: {
          "User-Agent": USER_AGENT,
          Cookie: `sessionid=${tiktokSessionId}; ${tiktokCookie}`,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 20000,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        throw new Error(`TikTok returned status ${response.status} - user may not exist or profile is private`);
      }

      const sigiMatch = response.data.match(/<script id="SIGI_STATE" type="application\/json">(.*?)<\/script>/);
      if (!sigiMatch || !sigiMatch[1]) {
        throw new Error("Unable to parse TikTok metadata payload from profile page");
      }

      const sigiState = JSON.parse(sigiMatch[1]);
      const items = Object.values(sigiState?.ItemModule || {}) as any[];
      const videos = items.slice(0, 15).map((item) => ({
        video_id: item.id,
        url: `https://www.tiktok.com/@${username}/video/${item.id}`,
        description: item.desc || item.title || `TikTok video by @${username}`,
        views: item.stats?.playCount ?? null,
        likes: item.stats?.diggCount ?? null,
        comments: item.stats?.commentCount ?? null,
        shares: item.stats?.shareCount ?? null,
        duration: item.video?.duration ?? null,
        author_name: item.author,
        thumbnail_url: item.video?.cover ?? item.video?.dynamicCover,
        music: item.music?.title,
        created_at: item.createTime ? new Date(item.createTime * 1000).toISOString() : undefined,
      }));

      if (videos.length === 0) {
        throw new Error(`No videos found for @${username} - profile may be private, deleted, or cookies invalid/expired`);
      }

      console.log("🎵 TikTok: Got", videos.length, "videos from profile");

      return {
        meta: {
          username,
          page: 1,
          total_pages: 1,
          posts_per_page: videos.length,
          total_posts: videos.length,
          fetched_posts: videos.length,
          fetch_method: "tiktok_cookie_scrape_real",
          status: "success",
          has_more: false,
        },
        data: videos,
        status: "success",
      };
    } catch (error: any) {
      console.error("🎵 TikTok error:", error.message);
      throw error;
    }
  } catch (error: any) {
    console.error("🎵 TikTok error:", error.message);
    throw error;
  }
}

// ============ HELPER FUNCTIONS ============

function extractJsonFromHtml(html: string, patterns: RegExp[]): any {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (error) {
        console.warn("Failed to parse JSON chunk", error);
      }
    }
  }
  throw new Error("Unable to locate JSON metadata in response body");
}

function extractRunsText(runs?: Array<{ text?: string }>): string {
  if (!runs || !Array.isArray(runs)) return "";
  return runs.map((r) => r?.text || "").join("").trim();
}

function parseNumericValue(value?: string): number | null {
  if (!value) return null;
  const numeric = value.replace(/[^0-9]/g, "");
  if (!numeric) return null;
  return Number.parseInt(numeric, 10);
}

function parseVideoDuration(duration?: string): number | null {
  if (!duration) return null;
  if (duration.startsWith("PT")) {
    return parseIsoDuration(duration);
  }

  const segments = duration.split(":").map((s) => Number.parseInt(s, 10));
  if (segments.some((n) => Number.isNaN(n))) return null;

  let seconds = 0;
  for (const segment of segments) {
    seconds = seconds * 60 + segment;
  }
  return seconds;
}

function parseIsoDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number.parseInt(match[1] || "0", 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  const seconds = Number.parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}
