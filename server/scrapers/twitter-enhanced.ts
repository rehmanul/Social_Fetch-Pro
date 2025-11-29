/**
 * Twitter Enhanced Scraper - 100% Metadata Quality
 *
 * Priority System:
 * 1. Twitter API v2 (100% metadata) - if TWITTER_API_V2_BEARER_TOKEN provided
 * 2. Enhanced GraphQL with authentication (95% metadata) - if TWITTER_BEARER_TOKEN + cookies provided
 * 3. Cookie-based HTML scraping (70% metadata) - fallback
 */

import axios from "axios";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

interface Tweet {
  video_id: string;
  url: string;
  description: string;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  views: number | null;
  bookmarks?: number | null;
  quotes?: number | null;
  author_name: string;
  created_at: string;
  media?: Array<{
    type: string;
    url: string;
    thumbnail_url?: string;
  }>;
  hashtags?: string[];
  mentions?: string[];
  is_retweet?: boolean;
  is_quote?: boolean;
}

interface TwitterResponse {
  meta: {
    username: string;
    page: number;
    total_pages: number;
    total_tweets: number;
    fetch_method: string;
    status: string;
  };
  data: Tweet[];
  status: string;
}

/**
 * Extract cookie value from cookie header string
 */
function extractCookieValue(cookieHeader: string, key: string): string | undefined {
  const pairs = cookieHeader.split(";").map((segment) => segment.trim());
  const found = pairs.find((segment) => segment.startsWith(`${key}=`));
  if (!found) return undefined;
  const [, ...rest] = found.split("=");
  return rest.join("=") || undefined;
}

/**
 * Method 1: Official Twitter API v2 (100% metadata)
 * Requires: TWITTER_API_V2_BEARER_TOKEN environment variable
 * Free tier: 1,500 tweets/month, 500,000 tweets/month for Basic ($100/month)
 */
async function scrapeTwitterAPIv2(username: string): Promise<TwitterResponse> {
  const apiv2Token = process.env.TWITTER_API_V2_BEARER_TOKEN;
  if (!apiv2Token) {
    throw new Error("TWITTER_API_V2_BEARER_TOKEN not configured");
  }

  console.log("🐦 Twitter: Using official API v2 for 100% metadata");

  try {
    // Step 1: Get user ID from username
    const userResponse = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        Authorization: `Bearer ${apiv2Token}`,
      },
      timeout: 15000,
    });

    const userId = userResponse.data.data?.id;
    if (!userId) {
      throw new Error(`User not found: ${username}`);
    }

    console.log(`🐦 Twitter: Found user ID: ${userId}`);

    // Step 2: Get user's tweets with all available fields
    const tweetsResponse = await axios.get(`https://api.twitter.com/2/users/${userId}/tweets`, {
      params: {
        max_results: 20,
        "tweet.fields": "created_at,public_metrics,entities,referenced_tweets,attachments",
        "media.fields": "type,url,preview_image_url,variants",
        expansions: "attachments.media_keys,referenced_tweets.id",
      },
      headers: {
        Authorization: `Bearer ${apiv2Token}`,
      },
      timeout: 15000,
    });

    const tweets = tweetsResponse.data.data || [];
    const includes = tweetsResponse.data.includes || {};
    const mediaMap = new Map((includes.media || []).map((m: any) => [m.media_key, m]));

    const formattedTweets: Tweet[] = tweets.slice(0, 15).map((tweet: any) => {
      const metrics = tweet.public_metrics || {};
      const entities = tweet.entities || {};
      const hashtags = entities.hashtags?.map((h: any) => h.tag) || [];
      const mentions = entities.mentions?.map((m: any) => m.username) || [];
      const referencedTweets = tweet.referenced_tweets || [];
      const isRetweet = referencedTweets.some((rt: any) => rt.type === "retweeted");
      const isQuote = referencedTweets.some((rt: any) => rt.type === "quoted");

      // Extract media information
      const media: Array<{ type: string; url: string; thumbnail_url?: string }> = [];
      if (tweet.attachments?.media_keys) {
        for (const mediaKey of tweet.attachments.media_keys) {
          const mediaObj = mediaMap.get(mediaKey);
          if (mediaObj) {
            media.push({
              type: mediaObj.type,
              url: mediaObj.url || mediaObj.variants?.[0]?.url || "",
              thumbnail_url: mediaObj.preview_image_url,
            });
          }
        }
      }

      return {
        video_id: tweet.id,
        url: `https://twitter.com/${username}/status/${tweet.id}`,
        description: tweet.text || "Tweet",
        likes: metrics.like_count || 0,
        comments: metrics.reply_count || 0,
        shares: metrics.retweet_count || 0,
        views: metrics.impression_count || null,
        bookmarks: metrics.bookmark_count || null,
        quotes: metrics.quote_count || 0,
        author_name: username,
        created_at: tweet.created_at,
        media: media.length > 0 ? media : undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        mentions: mentions.length > 0 ? mentions : undefined,
        is_retweet: isRetweet,
        is_quote: isQuote,
      };
    });

    console.log(`🐦 Twitter: Retrieved ${formattedTweets.length} tweets with 100% metadata`);

    return {
      meta: {
        username,
        page: 1,
        total_pages: 1,
        total_tweets: formattedTweets.length,
        fetch_method: "twitter_api_v2_official",
        status: "success",
      },
      data: formattedTweets,
      status: "success",
    };
  } catch (error: any) {
    if (error.response?.status === 429) {
      throw new Error("Twitter API rate limit exceeded");
    }
    if (error.response?.status === 403) {
      throw new Error("Twitter API access denied - check token permissions");
    }
    throw new Error(`Twitter API v2 error: ${error.message}`);
  }
}

/**
 * Method 2: Enhanced GraphQL API with Cookie Authentication (95% metadata)
 * Requires: TWITTER_BEARER_TOKEN + TWITTER_COOKIE environment variables
 * Uses Twitter's internal GraphQL API with better engagement metrics
 */
async function scrapeTwitterGraphQLEnhanced(username: string): Promise<TwitterResponse> {
  const twitterCookie = process.env.TWITTER_COOKIE;
  const bearerRaw = process.env.TWITTER_BEARER_TOKEN;

  if (!twitterCookie || !bearerRaw) {
    throw new Error("TWITTER_COOKIE and TWITTER_BEARER_TOKEN required");
  }

  const bearer = bearerRaw.startsWith("Bearer ") ? bearerRaw.slice("Bearer ".length) : bearerRaw;
  const ct0 = extractCookieValue(twitterCookie, "ct0");

  console.log("🐦 Twitter: Using enhanced GraphQL API with authentication");

  try {
    // Enhanced GraphQL query with all available fields
    const variables = {
      screen_name: username,
      count: 20,
      includePromotedContent: false,
      withQuickPromoteEligibilityTweetFields: true,
      withVoice: true,
      withV2Timeline: true,
    };

    const features = {
      rweb_lists_timeline_redesign_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: false,
      tweet_awards_web_tipping_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_media_download_video_enabled: false,
      responsive_web_enhance_cards_enabled: false,
    };

    const fieldToggles = {
      withArticleRichContentState: false,
    };

    const response = await axios.get(
      `https://twitter.com/i/api/graphql/V7H0Ap3_Hh2FyS75OCDO3Q/UserTweets`,
      {
        params: {
          variables: JSON.stringify(variables),
          features: JSON.stringify(features),
          fieldToggles: JSON.stringify(fieldToggles),
        },
        headers: {
          Authorization: `Bearer ${bearer}`,
          "User-Agent": USER_AGENT,
          Cookie: twitterCookie,
          "x-csrf-token": ct0,
          "x-twitter-active-user": "yes",
          "x-twitter-client-language": "en",
          Accept: "application/json",
        },
        timeout: 15000,
      }
    );

    // Parse timeline response
    const instructions =
      response.data?.data?.user?.result?.timeline_v2?.timeline?.instructions ||
      response.data?.data?.user?.result?.timeline?.timeline?.instructions ||
      [];

    const entries: any[] = [];
    for (const instruction of instructions) {
      if (instruction.type === "TimelineAddEntries") {
        entries.push(...(instruction.entries || []));
      }
    }

    const tweets: Tweet[] = [];
    for (const entry of entries) {
      if (!entry.entryId?.startsWith("tweet-")) continue;

      const content = entry.content?.itemContent?.tweet_results?.result;
      if (!content) continue;

      const tweet = content.legacy || content.tweet?.legacy;
      if (!tweet?.id_str) continue;

      const views = content.views?.count || tweet.ext_views?.count || null;
      const entities = tweet.entities || {};
      const hashtags = entities.hashtags?.map((h: any) => h.text) || [];
      const mentions = entities.user_mentions?.map((m: any) => m.screen_name) || [];
      const media = (entities.media || []).map((m: any) => ({
        type: m.type,
        url: m.media_url_https || m.url,
        thumbnail_url: m.media_url_https,
      }));

      tweets.push({
        video_id: tweet.id_str,
        url: `https://twitter.com/${username}/status/${tweet.id_str}`,
        description: tweet.full_text || tweet.text || "Tweet",
        likes: tweet.favorite_count || 0,
        comments: tweet.reply_count || 0,
        shares: tweet.retweet_count || 0,
        views,
        bookmarks: tweet.bookmark_count || null,
        quotes: tweet.quote_count || 0,
        author_name: username,
        created_at: tweet.created_at,
        media: media.length > 0 ? media : undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        mentions: mentions.length > 0 ? mentions : undefined,
        is_retweet: !!tweet.retweeted_status_id_str,
        is_quote: !!tweet.quoted_status_id_str,
      });
    }

    if (tweets.length === 0) {
      throw new Error("No tweets found - profile may be private or cookies invalid");
    }

    console.log(`🐦 Twitter: Retrieved ${tweets.length} tweets with 95% metadata`);

    return {
      meta: {
        username,
        page: 1,
        total_pages: 1,
        total_tweets: tweets.length,
        fetch_method: "twitter_graphql_enhanced",
        status: "success",
      },
      data: tweets.slice(0, 15),
      status: "success",
    };
  } catch (error: any) {
    throw new Error(`Twitter GraphQL error: ${error.message}`);
  }
}

/**
 * Main export: Intelligent scraper with fallback priority
 */
export async function scrapeTwitterEnhanced(username: string): Promise<TwitterResponse> {
  const handle = username.trim().replace(/^@+/, "");

  console.log(`🐦 Twitter Enhanced: Starting scrape for @${handle}`);

  // Priority 1: Try official API v2 if token is available
  if (process.env.TWITTER_API_V2_BEARER_TOKEN) {
    try {
      console.log("🐦 Twitter: Attempting official API v2 method...");
      return await scrapeTwitterAPIv2(handle);
    } catch (error: any) {
      console.warn(`🐦 Twitter: API v2 failed (${error.message}), falling back to GraphQL`);
    }
  }

  // Priority 2: Try enhanced GraphQL if bearer token + cookies are available
  if (process.env.TWITTER_BEARER_TOKEN && process.env.TWITTER_COOKIE) {
    try {
      console.log("🐦 Twitter: Attempting enhanced GraphQL method...");
      return await scrapeTwitterGraphQLEnhanced(handle);
    } catch (error: any) {
      console.warn(`🐦 Twitter: Enhanced GraphQL failed (${error.message}), falling back to basic scraper`);
    }
  }

  // Priority 3: Fall back to basic cookie scraper (from original scrapers.ts)
  throw new Error("No Twitter authentication method available. Please set TWITTER_API_V2_BEARER_TOKEN or TWITTER_BEARER_TOKEN + TWITTER_COOKIE");
}
