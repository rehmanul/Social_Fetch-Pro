/**
 * Enhanced Metadata Extraction Module
 *
 * This module provides functions to extract rich metadata from social media platforms
 * It enhances the basic scrapers with additional profile and content information
 */

import * as cheerio from "cheerio";
import {
  ProfileMetadata,
  ContentMetadata,
  ScrapingSessionMetadata,
  YoutubeMetadata,
  TwitterMetadata,
  InstagramMetadata,
  TiktokMetadata,
  extractHashtags,
  extractMentions,
  calculateEngagementRate,
  normalizeDate,
  parseViewCount,
  detectLanguage,
  cleanText,
  extractKeywords,
} from "@shared/metadata-schema";

// ============ YOUTUBE METADATA EXTRACTION ============

export function extractYoutubeProfileMetadata(ytInitialData: any, channelName: string): ProfileMetadata | null {
  try {
    const metadata = ytInitialData?.metadata?.channelMetadataRenderer;
    const header = ytInitialData?.header?.c4TabbedHeaderRenderer;

    if (!metadata && !header) return null;

    return {
      username: channelName,
      displayName: metadata?.title || header?.title || channelName,
      bio: metadata?.description || "",
      website: metadata?.externalId ? `https://www.youtube.com/channel/${metadata.externalId}` : undefined,
      profilePictureUrl: header?.avatar?.thumbnails?.[0]?.url,
      bannerImageUrl: header?.banner?.thumbnails?.[0]?.url,
      isVerified: header?.badges?.some((b: any) => b?.metadataBadgeRenderer?.style === "BADGE_STYLE_TYPE_VERIFIED") || false,
      followersCount: parseViewCount(header?.subscriberCountText?.simpleText || "") || undefined,
      postsCount: undefined, // YouTube doesn't expose video count in initial data
    };
  } catch (error) {
    console.warn("Failed to extract YouTube profile metadata:", error);
    return null;
  }
}

export function extractYoutubeContentMetadata(video: any, channelName: string): ContentMetadata {
  const videoId = video.videoId;
  const title = extractRunsText(video.title?.runs) || "Untitled video";
  const description = extractRunsText(video.descriptionSnippet?.runs) || "";
  const viewCountText = extractRunsText(video.viewCountText?.runs) || video.viewCountText?.simpleText;
  const durationText = video.lengthText?.simpleText || extractRunsText(video.lengthText?.runs);
  const thumbnails = video.thumbnail?.thumbnails || [];
  const thumbnail = thumbnails[thumbnails.length - 1]?.url;

  const hashtags = extractHashtags(title + " " + description);
  const mentions = extractMentions(description);
  const keywords = extractKeywords(title + " " + description, 5);

  return {
    id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title,
    description,
    caption: description,
    mediaType: "video",
    duration: parseVideoDuration(durationText),
    thumbnailUrl: thumbnail,
    views: parseViewCount(viewCountText) || undefined,
    publishedAt: video.publishedTimeText?.simpleText || extractRunsText(video.publishedTimeText?.runs),
    authorUsername: channelName,
    authorName: channelName,
    hashtags,
    mentions,
    keywords,
    language: detectLanguage(title),
    platform: "youtube",
    platformSpecific: {
      videoId,
      channelName,
      viewCountText,
      durationText,
    },
  };
}

// ============ TWITTER METADATA EXTRACTION ============

export function extractTwitterProfileMetadata($: cheerio.CheerioAPI, username: string): ProfileMetadata | null {
  try {
    // Try to extract from meta tags
    const displayName = $('meta[property="og:title"]').attr("content")?.split(" (@")[0];
    const bio = $('meta[property="og:description"]').attr("content");
    const profileImage = $('meta[property="og:image"]').attr("content");

    // Try to extract from JSON-LD
    const jsonLd = $('script[type="application/ld+json"]').html();
    let structuredData: any = null;
    if (jsonLd) {
      try {
        structuredData = JSON.parse(jsonLd);
      } catch {}
    }

    return {
      username,
      displayName: displayName || structuredData?.name,
      bio: bio || structuredData?.description,
      profilePictureUrl: profileImage || structuredData?.image,
      website: structuredData?.url,
      isVerified: false, // Need API or deeper scraping
    };
  } catch (error) {
    console.warn("Failed to extract Twitter profile metadata:", error);
    return null;
  }
}

export function extractTwitterContentMetadata(tweet: any, username: string): ContentMetadata {
  const tweetId = tweet.video_id || tweet.id_str;
  const text = tweet.description || tweet.full_text || tweet.text || "";

  const hashtags = extractHashtags(text);
  const mentions = extractMentions(text);
  const keywords = extractKeywords(text, 5);

  return {
    id: tweetId,
    url: tweet.url || `https://twitter.com/${username}/status/${tweetId}`,
    description: text,
    caption: text,
    mediaType: "text",
    likes: tweet.likes || tweet.favorite_count,
    comments: tweet.comments || tweet.reply_count,
    shares: tweet.shares || tweet.retweet_count,
    views: tweet.views || tweet.quote_count,
    createdAt: tweet.created_at ? normalizeDate(tweet.created_at) : undefined,
    authorUsername: username,
    authorName: username,
    hashtags,
    mentions,
    keywords,
    language: detectLanguage(text),
    platform: "twitter",
    platformSpecific: {
      tweetId,
      isRetweet: tweet.retweeted || false,
      source: tweet.source,
    },
  };
}

// ============ INSTAGRAM METADATA EXTRACTION ============

export function extractInstagramProfileMetadata(user: any): ProfileMetadata | null {
  try {
    if (!user) return null;

    return {
      username: user.username,
      displayName: user.full_name,
      bio: user.biography,
      website: user.external_url,
      profilePictureUrl: user.profile_pic_url_hd || user.profile_pic_url,
      isVerified: user.is_verified || false,
      isProfessional: user.is_professional_account || false,
      isPrivate: user.is_private || false,
      isBusiness: user.is_business_account || false,
      category: user.category_name || user.category,
      followersCount: user.edge_followed_by?.count,
      followingCount: user.edge_follow?.count,
      postsCount: user.edge_owner_to_timeline_media?.count,
      contactEmail: user.business_email,
      phoneNumber: user.business_phone_number,
    };
  } catch (error) {
    console.warn("Failed to extract Instagram profile metadata:", error);
    return null;
  }
}

export function extractInstagramContentMetadata(node: any, username: string): ContentMetadata {
  const description = node.edge_media_to_caption?.edges?.[0]?.node?.text ||
                     node.accessibility_caption ||
                     "Instagram post";

  const hashtags = extractHashtags(description);
  const mentions = extractMentions(description);
  const keywords = extractKeywords(description, 5);

  let mediaType: "video" | "image" | "carousel" = "image";
  if (node.__typename === "GraphVideo") mediaType = "video";
  if (node.__typename === "GraphSidecar") mediaType = "carousel";

  return {
    id: node.id,
    shortcode: node.shortcode,
    url: `https://www.instagram.com/p/${node.shortcode}/`,
    description,
    caption: description,
    mediaType,
    thumbnailUrl: node.display_url,
    mediaUrl: node.is_video ? node.video_url : node.display_url,
    width: node.dimensions?.width,
    height: node.dimensions?.height,
    likes: node.edge_media_preview_like?.count || node.edge_liked_by?.count,
    comments: node.edge_media_to_comment?.count,
    views: node.is_video ? node.video_view_count : undefined,
    publishedAt: node.taken_at_timestamp ? normalizeDate(node.taken_at_timestamp) : undefined,
    authorUsername: username,
    authorName: username,
    hashtags,
    mentions,
    keywords,
    language: detectLanguage(description),
    location: node.location?.name,
    platform: "instagram",
    isPinned: node.pinned_for_users?.length > 0,
    platformSpecific: {
      shortcode: node.shortcode,
      isVideo: node.is_video,
      locationId: node.location?.id,
      productTags: node.edge_media_to_tagged_user?.edges?.length || 0,
    },
  };
}

// ============ TIKTOK METADATA EXTRACTION ============

export function extractTiktokProfileMetadata(userInfo: any): ProfileMetadata | null {
  try {
    if (!userInfo) return null;

    const stats = userInfo.stats || userInfo.statsV2 || {};

    return {
      username: userInfo.uniqueId || userInfo.id,
      displayName: userInfo.nickname,
      bio: userInfo.signature,
      profilePictureUrl: userInfo.avatarLarger || userInfo.avatarMedium,
      isVerified: userInfo.verified || false,
      isPrivate: userInfo.privateAccount || false,
      followersCount: stats.followerCount,
      followingCount: stats.followingCount,
      postsCount: stats.videoCount,
    };
  } catch (error) {
    console.warn("Failed to extract TikTok profile metadata:", error);
    return null;
  }
}

export function extractTiktokContentMetadata(item: any, username: string): ContentMetadata {
  const desc = item.desc || item.description || "";
  const hashtags = item.challenges?.map((c: any) => c.title) || extractHashtags(desc);
  const mentions = extractMentions(desc);
  const keywords = extractKeywords(desc, 5);

  const stats = item.stats || item.statsV2 || {};

  return {
    id: item.id,
    url: `https://www.tiktok.com/@${username}/video/${item.id}`,
    description: desc,
    caption: desc,
    mediaType: "video",
    duration: item.video?.duration,
    thumbnailUrl: item.video?.cover || item.video?.dynamicCover,
    mediaUrl: item.video?.downloadAddr || item.video?.playAddr,
    views: stats.playCount,
    likes: stats.diggCount,
    comments: stats.commentCount,
    shares: stats.shareCount,
    saves: stats.collectCount,
    publishedAt: item.createTime ? normalizeDate(item.createTime) : undefined,
    authorUsername: username,
    authorName: item.author?.nickname || username,
    hashtags,
    mentions,
    keywords,
    language: detectLanguage(desc),
    platform: "tiktok",
    platformSpecific: {
      musicId: item.music?.id,
      musicTitle: item.music?.title,
      musicAuthor: item.music?.authorName,
      effectIds: item.effectStickers?.map((e: any) => e.id),
      duetEnabled: item.duetEnabled,
      stitchEnabled: item.stitchEnabled,
    },
  };
}

// ============ UTILITY FUNCTIONS ============

function extractRunsText(runs: any): string {
  if (!runs || !Array.isArray(runs)) return "";
  return runs.map((r: any) => r.text).join("");
}

function parseVideoDuration(durationText: string | undefined): number | undefined {
  if (!durationText) return undefined;

  const parts = durationText.split(":").map(Number);
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }
  return undefined;
}

// ============ SESSION METADATA BUILDER ============

export function createScrapingSession(
  platform: "youtube" | "twitter" | "instagram" | "tiktok",
  targetType: "user" | "hashtag" | "search" | "trending" | "url",
  targetIdentifier: string,
  scrapeMethod: "cookie_scrape" | "api_official" | "api_unofficial" | "rss_feed" | "html_parse",
  page: number = 1,
  perPage: number = 10
): Omit<ScrapingSessionMetadata, "status" | "itemsScraped" | "completedAt" | "duration"> {
  return {
    sessionId: `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    platform,
    scrapeMethod,
    targetType,
    targetIdentifier,
    page,
    perPage,
    startedAt: new Date().toISOString(),
  };
}

export function completeScrapingSession(
  session: Partial<ScrapingSessionMetadata>,
  status: "success" | "partial_success" | "failed",
  itemsScraped: number,
  errors?: string[]
): ScrapingSessionMetadata {
  const now = new Date();
  const startTime = new Date(session.startedAt || now);
  const duration = now.getTime() - startTime.getTime();

  return {
    ...session,
    status,
    itemsScraped,
    itemsFailed: errors?.length || 0,
    errors,
    completedAt: now.toISOString(),
    duration,
    dataCompleteness: itemsScraped > 0 ? 100 : 0, // Can be enhanced with actual checks
  } as ScrapingSessionMetadata;
}

// ============ ENGAGEMENT CALCULATOR ============

export function calculateContentEngagement(content: ContentMetadata, followerCount?: number): number {
  if (!followerCount || followerCount === 0) return 0;

  const likes = content.likes || 0;
  const comments = content.comments || 0;
  const shares = content.shares || 0;

  return calculateEngagementRate(likes, comments, shares, followerCount);
}

// ============ DATA COMPLETENESS CHECKER ============

export function calculateDataCompleteness(content: ContentMetadata): number {
  const fields = [
    'id',
    'url',
    'description',
    'mediaType',
    'thumbnailUrl',
    'likes',
    'comments',
    'views',
    'publishedAt',
    'authorUsername',
    'hashtags',
  ];

  const presentFields = fields.filter(field => {
    const value = content[field as keyof ContentMetadata];
    return value !== undefined && value !== null && value !== '';
  });

  return Math.round((presentFields.length / fields.length) * 100);
}
