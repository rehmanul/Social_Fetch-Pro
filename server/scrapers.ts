import axios from "axios";
import * as cheerio from "cheerio";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function sanitizeHeaderValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function buildCookieHeader(parts: Array<string | undefined>): string {
  const cleaned = parts
    .map(sanitizeHeaderValue)
    .filter(Boolean)
    .map((part) => part!)
    .filter((part) => part.length > 0);

  if (cleaned.length === 0) {
    throw new Error("Cookie header is missing or invalid after sanitization");
  }

  return cleaned.join("; ");
}

function normalizeHandle(value: string): string {
  return value.trim().replace(/^@+/, "");
}

function extractCookieValue(cookieHeader: string, key: string): string | undefined {
  const pairs = cookieHeader.split(";").map((segment) => segment.trim());
  const found = pairs.find((segment) => segment.startsWith(`${key}=`));
  if (!found) return undefined;
  const [, ...rest] = found.split("=");
  const value = rest.join("=");
  return value || undefined;
}

// ============ YOUTUBE SCRAPER (COOKIE-BASED) ============
export async function scrapeYouTube(channelName: string) {
  try {
    const channel = normalizeHandle(channelName);
    const youtubeCookie = process.env.YOUTUBE_COOKIE;
    if (!youtubeCookie) {
      throw new Error("YOUTUBE_COOKIE not configured - add it to environment secrets from a signed-in YouTube session.");
    }

    const sanitizedCookie = buildCookieHeader([youtubeCookie]);
    console.log("🎥 YouTube: Starting scrape for", channel, "with cookies:", sanitizedCookie ? "✓" : "✗");

    try {
      const response = await axios.get(`https://www.youtube.com/@${channel}/videos`, {
        headers: {
          "User-Agent": USER_AGENT,
          Cookie: sanitizedCookie,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
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
            channel,
            author_name: channel,
            thumbnail_url: thumbnail,
          };
        });

      if (videos.length === 0) {
        throw new Error(`No videos found for @${channelName} - channel may not exist or require additional cookies.`);
      }

      console.log("🎥 YouTube: Parsed", videos.length, "videos from profile");

      return {
        meta: {
          channel,
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
    const handle = normalizeHandle(username);
    const twitterCookie = process.env.TWITTER_COOKIE;
    if (!twitterCookie) {
      throw new Error("TWITTER_COOKIE not configured - add it to environment secrets from a logged-in Twitter session.");
    }

    const sanitizedCookie = buildCookieHeader([twitterCookie]);
    console.log("🐦 Twitter: Starting scrape for @" + handle, "with cookies:", sanitizedCookie ? "✓" : "✗");

    try {
      // Scrape Twitter profile
      const response = await axios.get(`https://twitter.com/${handle}`, {
        headers: {
          "User-Agent": USER_AGENT,
          Cookie: sanitizedCookie,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
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
          if (href && href.includes(`/${handle}/status/`)) {
            const tweetId = href.split("/status/")[1]?.split(/[?#]/)[0];
            if (tweetId && /^\d+$/.test(tweetId) && !tweets.some((t) => t.video_id === tweetId)) {
              tweets.push({
                video_id: tweetId,
                url: `https://twitter.com/${handle}/status/${tweetId}`,
                description: "Tweet",
                likes: null,
                comments: null,
                shares: null,
                views: null,
                author_name: handle,
              });
            }
          }
        });
      }

      // Final attempt: call Twitter timeline API using auth cookie + bearer token
      if (tweets.length === 0) {
        const ct0 = extractCookieValue(sanitizedCookie, "ct0");
        const bearerRaw = process.env.TWITTER_BEARER_TOKEN;
        if (!bearerRaw) {
          throw new Error("Twitter API rejected cookies and TWITTER_BEARER_TOKEN is not set");
        }
        const bearer = bearerRaw.startsWith("Bearer ") ? bearerRaw.slice("Bearer ".length) : bearerRaw;

        const variables = encodeURIComponent(
          JSON.stringify({
            screen_name: handle,
            count: 20,
            includePromotedContent: false,
            withVoice: false,
          }),
        );

        const features = encodeURIComponent(
          JSON.stringify({
            rweb_lists_timeline_redesign_enabled: false,
            blue_business_profile_image_shape_enabled: true,
            responsive_web_graphql_exclude_directive_enabled: true,
            responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
            verified_phone_label_enabled: false,
            responsive_web_home_pinned_timelines_enabled: true,
            tweetypie_unmention_optimization_enabled: true,
            vibe_api_enabled: true,
            responsive_web_edit_tweet_api_enabled: true,
            graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
            standardized_nudges_misinfo: true,
            tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
            interactive_text_enabled: true,
            responsive_web_text_conversations_enabled: false,
            longform_notetweets_consumption_enabled: true,
            responsive_web_enhance_cards_enabled: true,
          }),
        );

        const apiResponse = await axios.get(
          `https://twitter.com/i/api/graphql/p2KkPOGJnHOi64l-dlBo1Q/UserTweets?variables=${variables}&features=${features}`,
          {
            headers: {
              Authorization: `Bearer ${bearer}`,
              "User-Agent": USER_AGENT,
              Cookie: sanitizedCookie,
              "x-csrf-token": ct0,
              "x-twitter-active-user": "yes",
              "x-twitter-client-language": "en",
              Accept: "application/json",
            },
            timeout: 15000,
            validateStatus: () => true,
          },
        );

        if (apiResponse.status === 200) {
          const entries =
            apiResponse.data?.data?.user?.result?.timeline_response?.instructions?.flatMap((inst: any) => inst.entries || []) ||
            apiResponse.data?.data?.user?.result?.timeline?.timeline?.instructions?.flatMap((inst: any) => inst.entries || []) ||
            [];

          for (const entry of entries) {
            const tweet = entry?.content?.itemContent?.tweet_results?.result?.legacy;
            if (tweet?.id_str && !tweets.some((t) => t.video_id === tweet.id_str)) {
              tweets.push({
                video_id: tweet.id_str,
                url: `https://twitter.com/${handle}/status/${tweet.id_str}`,
                description: tweet.full_text || tweet.text || "Tweet",
                likes: tweet.favorite_count,
                comments: tweet.reply_count,
                shares: tweet.retweet_count,
                views: tweet.quote_count ?? null,
                author_name: handle,
                created_at: tweet.created_at,
              });
            }
          }
        }
      }

      if (tweets.length === 0) {
        throw new Error(`No tweets found for @${handle} - profile may be private, deleted, or cookies invalid`);
      }

      console.log("🐦 Twitter: Got", tweets.length, "tweets from profile");

      return {
        meta: {
          username: handle,
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
    const handle = normalizeHandle(username);
    const instagramCookie = process.env.INSTAGRAM_COOKIE;
    const instagramSessionId = process.env.INSTAGRAM_SESSION_ID;
    if (!instagramCookie || !instagramSessionId) {
      throw new Error("INSTAGRAM_COOKIE or INSTAGRAM_SESSION_ID not configured - add them to Replit secrets. Get from Instagram browser session.");
    }

    const combinedCookie = buildCookieHeader([`sessionid=${instagramSessionId}`, instagramCookie]);
    console.log("📷 Instagram: Starting scrape for @" + handle, "with cookies:", instagramCookie && instagramSessionId ? "✓" : "✗");

    try {
      // Use the web profile API which returns structured media data when authenticated
      const response = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`, {
        headers: {
          "User-Agent": `${USER_AGENT} Chrome/122.0.0.0 Safari/537.36`,
          Cookie: combinedCookie,
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          "X-Requested-With": "XMLHttpRequest",
          "X-IG-App-ID": "936619743392459",
          Referer: `https://www.instagram.com/${handle}/`,
        },
        timeout: 20000,
        maxRedirects: 0,
        validateStatus: (status) => status < 400,
      });

      if (response.status === 302) {
        throw new Error("Instagram redirected to login - cookies may be invalid/expired");
      }

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
          author_name: handle,
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
          username: handle,
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
    const handle = normalizeHandle(username);
    const tiktokCookie = process.env.TIKTOK_COOKIE;
    const tiktokSessionId = process.env.TIKTOK_SESSION_ID;
    if (!tiktokCookie || !tiktokSessionId) {
      throw new Error("TIKTOK_COOKIE or TIKTOK_SESSION_ID not configured - add them to Replit secrets. Get from TikTok browser session.");
    }

    const combinedCookie = buildCookieHeader([`sessionid=${tiktokSessionId}`, tiktokCookie]);
    console.log("🎵 TikTok: Starting scrape for @" + handle, "with cookies:", tiktokCookie && tiktokSessionId ? "✓" : "✗");

    try {
      // Scrape TikTok profile and parse the pre-rendered SIGI_STATE payload
      const response = await axios.get(`https://www.tiktok.com/@${handle}`, {
        headers: {
          "User-Agent": USER_AGENT,
          Cookie: combinedCookie,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://www.tiktok.com/",
        },
        timeout: 20000,
        maxRedirects: 0,
        validateStatus: (status) => status < 400,
      });

      if (response.status === 302) {
        throw new Error("TikTok redirected to login - cookies may be invalid/expired");
      }

      if (response.status !== 200) {
        throw new Error(`TikTok returned status ${response.status} - user may not exist or profile is private`);
      }

      console.log("🎵 TikTok: Response size:", response.data.length, "bytes");
      console.log("🎵 TikTok: Response preview:", response.data.substring(0, 500));

      const $ = cheerio.load(response.data);
      const scriptCount = $('script').length;
      console.log("🎵 TikTok: Found", scriptCount, "script tags");

      // Check if we got a login/blocked page
      const pageTitle = $('title').text();
      console.log("🎵 TikTok: Page title:", pageTitle);

      if (pageTitle.toLowerCase().includes('login') || response.data.includes('Please verify')) {
        throw new Error("TikTok blocked the request - cookies invalid/expired or IP blocked");
      }

      let payload: any | null = null;

      // Method 1: Try SIGI_STATE script tag
      const sigiRaw = $('script#SIGI_STATE').first().html();
      if (sigiRaw) {
        try {
          payload = JSON.parse(sigiRaw);
          console.log("🎵 TikTok: Parsed data from SIGI_STATE script tag");
        } catch (e) {
          console.log("🎵 TikTok: SIGI_STATE found but failed to parse");
        }
      }

      // Method 2: Try __UNIVERSAL_DATA_FOR_REHYDRATION__ with improved regex
      if (!payload) {
        const patterns = [
          /__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/,
          /window\['SIGI_STATE'\]\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/,
          /SIGI_STATE\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/,
        ];

        for (const pattern of patterns) {
          const match = response.data.match(pattern);
          if (match && match[1]) {
            try {
              payload = JSON.parse(match[1]);
              console.log("🎵 TikTok: Parsed data from window script pattern");
              break;
            } catch (e) {
              console.log("🎵 TikTok: Pattern matched but JSON parse failed");
            }
          }
        }
      }

      // Method 3: Try to find any script with ItemModule data
      if (!payload) {
        $('script').each((_, elem) => {
          const scriptContent = $(elem).html() || '';
          if (scriptContent.includes('ItemModule') && scriptContent.includes('{')) {
            const jsonMatch = scriptContent.match(/(\{[\s\S]*ItemModule[\s\S]*\})/);
            if (jsonMatch && jsonMatch[1]) {
              try {
                payload = JSON.parse(jsonMatch[1]);
                console.log("🎵 TikTok: Parsed data from ItemModule script search");
                return false; // break out of each loop
              } catch (e) {
                // continue searching
              }
            }
          }
        });
      }

      if (!payload) {
        console.error("🎵 TikTok: Failed to parse payload. Available script tags:");
        $('script').each((i, elem) => {
          const scriptId = $(elem).attr('id');
          const scriptContent = $(elem).html() || '';
          if (scriptId || scriptContent.length < 5000) {
            console.error(`  - Script ${i}: id="${scriptId || 'none'}", length=${scriptContent.length}`);
          }
        });
        throw new Error("Unable to parse TikTok metadata payload from profile page");
      }

      const items = Object.values(payload?.ItemModule || {}) as any[];
      const videos = items.slice(0, 15).map((item) => ({
        video_id: item.id,
        url: `https://www.tiktok.com/@${handle}/video/${item.id}`,
        description: item.desc || item.title || `TikTok video by @${handle}`,
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
          username: handle,
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
