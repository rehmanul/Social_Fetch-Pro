import { z } from "zod";

/**
 * Comprehensive metadata schemas for social media scraping
 * These schemas define the structure for rich metadata extraction across all platforms
 */

// ============ PROFILE METADATA ============

export const profileMetadataSchema = z.object({
  // Basic Info
  username: z.string(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional(),
  profilePictureUrl: z.string().optional(),
  bannerImageUrl: z.string().optional(),

  // Verification & Status
  isVerified: z.boolean().optional(),
  isProfessional: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  isBusiness: z.boolean().optional(),
  category: z.string().optional(),

  // Follower Stats
  followersCount: z.number().optional(),
  followingCount: z.number().optional(),
  postsCount: z.number().optional(),

  // Additional Info
  location: z.string().optional(),
  joinedDate: z.string().optional(),
  externalLinks: z.array(z.string()).optional(),
  contactEmail: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export type ProfileMetadata = z.infer<typeof profileMetadataSchema>;

// ============ CONTENT METADATA ============

export const contentMetadataSchema = z.object({
  // Identifiers
  id: z.string(),
  shortcode: z.string().optional(),
  url: z.string(),

  // Content
  title: z.string().optional(),
  description: z.string().optional(),
  caption: z.string().optional(),

  // Media Info
  mediaType: z.enum(["video", "image", "carousel", "text", "link", "reels", "story"]).optional(),
  duration: z.number().optional(), // seconds
  thumbnailUrl: z.string().optional(),
  mediaUrl: z.string().optional(),

  // Dimensions (for images/videos)
  width: z.number().optional(),
  height: z.number().optional(),
  aspectRatio: z.string().optional(),

  // Engagement Metrics
  likes: z.number().optional(),
  comments: z.number().optional(),
  shares: z.number().optional(),
  saves: z.number().optional(),
  views: z.number().optional(),
  plays: z.number().optional(),

  // Timestamps
  publishedAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),

  // Author Info
  authorId: z.string().optional(),
  authorUsername: z.string().optional(),
  authorName: z.string().optional(),
  authorProfileUrl: z.string().optional(),

  // Content Analysis
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  language: z.string().optional(),

  // Location
  location: z.string().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),

  // Platform Specific
  platform: z.enum(["youtube", "twitter", "instagram", "tiktok"]),
  platformSpecific: z.record(z.any()).optional(),

  // Engagement Rate (calculated)
  engagementRate: z.number().optional(),
  isSponsored: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

export type ContentMetadata = z.infer<typeof contentMetadataSchema>;

// ============ SCRAPING SESSION METADATA ============

export const scrapingSessionMetadataSchema = z.object({
  // Session Info
  sessionId: z.string(),
  platform: z.enum(["youtube", "twitter", "instagram", "tiktok"]),
  scrapeMethod: z.enum([
    "cookie_scrape",
    "api_official",
    "api_unofficial",
    "rss_feed",
    "html_parse",
  ]),

  // Target Info
  targetType: z.enum(["user", "hashtag", "search", "trending", "url"]),
  targetIdentifier: z.string(),

  // Pagination
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number().optional(),
  totalItems: z.number().optional(),
  hasNextPage: z.boolean().optional(),

  // Timestamps
  startedAt: z.string(),
  completedAt: z.string().optional(),
  duration: z.number().optional(), // milliseconds

  // Status
  status: z.enum(["success", "partial_success", "failed"]),
  itemsScraped: z.number(),
  itemsFailed: z.number().optional(),
  errors: z.array(z.string()).optional(),

  // Rate Limiting
  rateLimitRemaining: z.number().optional(),
  rateLimitReset: z.string().optional(),

  // Quality Metrics
  dataCompleteness: z.number().optional(), // 0-100%
  averageResponseTime: z.number().optional(), // milliseconds

  // Cookies/Auth
  authMethod: z.enum(["cookie", "bearer_token", "oauth", "none"]).optional(),
  cookieExpiry: z.string().optional(),
});

export type ScrapingSessionMetadata = z.infer<typeof scrapingSessionMetadataSchema>;

// ============ YOUTUBE SPECIFIC METADATA ============

export const youtubeMetadataSchema = z.object({
  videoId: z.string(),
  channelId: z.string().optional(),
  channelName: z.string().optional(),
  channelUrl: z.string().optional(),
  subscriberCount: z.number().optional(),

  // Video Stats
  viewCount: z.number().optional(),
  likeCount: z.number().optional(),
  dislikeCount: z.number().optional(),
  commentCount: z.number().optional(),
  duration: z.number().optional(),

  // Video Info
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isLive: z.boolean().optional(),
  isShort: z.boolean().optional(),
  ageRestricted: z.boolean().optional(),

  // Thumbnails
  thumbnails: z.object({
    default: z.string().optional(),
    medium: z.string().optional(),
    high: z.string().optional(),
    maxres: z.string().optional(),
  }).optional(),
});

export type YoutubeMetadata = z.infer<typeof youtubeMetadataSchema>;

// ============ TWITTER/X SPECIFIC METADATA ============

export const twitterMetadataSchema = z.object({
  tweetId: z.string(),
  conversationId: z.string().optional(),

  // Tweet Type
  isRetweet: z.boolean().optional(),
  isReply: z.boolean().optional(),
  isQuote: z.boolean().optional(),
  isThread: z.boolean().optional(),

  // Referenced Tweets
  replyToTweetId: z.string().optional(),
  replyToUserId: z.string().optional(),
  quotedTweetId: z.string().optional(),
  retweetedTweetId: z.string().optional(),

  // Engagement
  retweetCount: z.number().optional(),
  replyCount: z.number().optional(),
  likeCount: z.number().optional(),
  quoteCount: z.number().optional(),
  bookmarkCount: z.number().optional(),
  impressionCount: z.number().optional(),

  // Media
  hasMedia: z.boolean().optional(),
  mediaTypes: z.array(z.enum(["photo", "video", "animated_gif"])).optional(),
  mediaUrls: z.array(z.string()).optional(),

  // Entities
  urls: z.array(z.object({
    url: z.string(),
    expandedUrl: z.string().optional(),
    displayUrl: z.string().optional(),
  })).optional(),

  // Tweet Metadata
  source: z.string().optional(), // Device/app used
  lang: z.string().optional(),
  possiblySensitive: z.boolean().optional(),
});

export type TwitterMetadata = z.infer<typeof twitterMetadataSchema>;

// ============ INSTAGRAM SPECIFIC METADATA ============

export const instagramMetadataSchema = z.object({
  postId: z.string(),
  shortcode: z.string(),
  postType: z.enum(["photo", "video", "carousel", "reels", "igtv"]).optional(),

  // Owner Info
  ownerId: z.string().optional(),
  ownerUsername: z.string().optional(),
  ownerIsVerified: z.boolean().optional(),

  // Engagement
  likeCount: z.number().optional(),
  commentCount: z.number().optional(),
  videoViewCount: z.number().optional(),
  videoPlayCount: z.number().optional(),

  // Media
  displayUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  carouselMedia: z.array(z.object({
    url: z.string(),
    type: z.enum(["photo", "video"]),
  })).optional(),

  // Post Info
  caption: z.string().optional(),
  locationName: z.string().optional(),
  locationId: z.string().optional(),
  isAd: z.boolean().optional(),
  isPaidPartnership: z.boolean().optional(),
  commentsDisabled: z.boolean().optional(),

  // Timestamps
  takenAt: z.string().optional(),
});

export type InstagramMetadata = z.infer<typeof instagramMetadataSchema>;

// ============ TIKTOK SPECIFIC METADATA ============

export const tiktokMetadataSchema = z.object({
  videoId: z.string(),
  authorId: z.string().optional(),
  authorName: z.string().optional(),
  authorUniqueId: z.string().optional(),

  // Video Stats
  playCount: z.number().optional(),
  likeCount: z.number().optional(),
  commentCount: z.number().optional(),
  shareCount: z.number().optional(),
  collectCount: z.number().optional(),

  // Video Info
  duration: z.number().optional(),
  musicInfo: z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    authorName: z.string().optional(),
    duration: z.number().optional(),
  }).optional(),

  // Challenge/Hashtag
  challenges: z.array(z.object({
    id: z.string(),
    title: z.string(),
    desc: z.string().optional(),
  })).optional(),

  // Effects
  effectStickers: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).optional(),

  // Media
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  dynamicCoverUrl: z.string().optional(),
  originCoverUrl: z.string().optional(),

  // Flags
  isAd: z.boolean().optional(),
  isCover: z.boolean().optional(),
  duetEnabled: z.boolean().optional(),
  stitchEnabled: z.boolean().optional(),
  privateAccount: z.boolean().optional(),
});

export type TiktokMetadata = z.infer<typeof tiktokMetadataSchema>;

// ============ UNIFIED RESPONSE SCHEMA ============

export const unifiedScrapingResponseSchema = z.object({
  // Session Metadata
  session: scrapingSessionMetadataSchema,

  // Profile Metadata (if scraped)
  profile: profileMetadataSchema.optional(),

  // Content Items
  items: z.array(contentMetadataSchema),

  // Statistics
  stats: z.object({
    totalItems: z.number(),
    successfulItems: z.number(),
    failedItems: z.number(),
    averageEngagement: z.number().optional(),
    topHashtags: z.array(z.string()).optional(),
    dateRange: z.object({
      earliest: z.string(),
      latest: z.string(),
    }).optional(),
  }).optional(),
});

export type UnifiedScrapingResponse = z.infer<typeof unifiedScrapingResponseSchema>;

// ============ METADATA EXTRACTION UTILITIES ============

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/gi;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
}

/**
 * Extract mentions from text
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@[\w]+/gi;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(mention => mention.slice(1).toLowerCase()) : [];
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(
  likes: number = 0,
  comments: number = 0,
  shares: number = 0,
  followers: number = 1
): number {
  if (followers === 0) return 0;
  const totalEngagement = likes + comments + shares;
  return (totalEngagement / followers) * 100;
}

/**
 * Normalize date to ISO string
 */
export function normalizeDate(date: string | number | Date): string {
  try {
    if (typeof date === 'number') {
      // Unix timestamp (seconds)
      if (date < 10000000000) {
        return new Date(date * 1000).toISOString();
      }
      // Unix timestamp (milliseconds)
      return new Date(date).toISOString();
    }
    return new Date(date).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Parse view count from text (e.g., "1.2M views" -> 1200000)
 */
export function parseViewCount(viewText: string): number | null {
  if (!viewText) return null;

  const cleanText = viewText.toLowerCase().replace(/,/g, '');
  const match = cleanText.match(/([\d.]+)\s*([kmb]?)/i);

  if (!match) return null;

  const [, num, suffix] = match;
  let value = parseFloat(num);

  switch (suffix.toLowerCase()) {
    case 'k':
      value *= 1000;
      break;
    case 'm':
      value *= 1000000;
      break;
    case 'b':
      value *= 1000000000;
      break;
  }

  return Math.floor(value);
}

/**
 * Detect language from text (simple implementation)
 */
export function detectLanguage(text: string): string {
  // Simple heuristic - can be enhanced with a proper language detection library
  const charCode = text.charCodeAt(0);

  if (charCode >= 0x0600 && charCode <= 0x06FF) return 'ar'; // Arabic
  if (charCode >= 0x0400 && charCode <= 0x04FF) return 'ru'; // Cyrillic
  if (charCode >= 0x4E00 && charCode <= 0x9FFF) return 'zh'; // Chinese
  if (charCode >= 0x3040 && charCode <= 0x309F) return 'ja'; // Japanese
  if (charCode >= 0xAC00 && charCode <= 0xD7AF) return 'ko'; // Korean

  // Default to English for Latin characters
  return 'en';
}

/**
 * Clean and normalize text
 */
export function cleanText(text: string): string {
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extract keywords from text (simple implementation)
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  ]);

  const words = cleanText(text)
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // Sort by frequency and return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}
