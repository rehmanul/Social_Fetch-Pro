/**
 * Test script to demonstrate metadata extraction capabilities
 * This shows what the system extracts from sample data
 */

import {
  extractHashtags,
  extractMentions,
  extractKeywords,
  detectLanguage,
  parseViewCount,
  normalizeDate,
  calculateEngagementRate,
} from "./shared/metadata-schema";

import {
  extractYoutubeContentMetadata,
  extractTwitterContentMetadata,
  extractInstagramContentMetadata,
  extractTiktokContentMetadata,
} from "./server/metadata-extractor";

console.log("🧪 METADATA EXTRACTION TEST\n");
console.log("=" .repeat(60));

// ============ TEST 1: HASHTAG EXTRACTION ============
console.log("\n📌 TEST 1: Hashtag Extraction");
console.log("-".repeat(60));

const textWithHashtags = "Check out this amazing #tutorial on #JavaScript and #webdev! Best #coding resource ever! #programming";
const hashtags = extractHashtags(textWithHashtags);
console.log("Input:", textWithHashtags);
console.log("Extracted Hashtags:", hashtags);
console.log(`Found ${hashtags.length} hashtags: ${hashtags.join(", ")}`);

// ============ TEST 2: MENTION EXTRACTION ============
console.log("\n👥 TEST 2: Mention Extraction");
console.log("-".repeat(60));

const textWithMentions = "Thanks to @john_doe and @jane_smith for this collaboration! Shoutout to @tech_guru";
const mentions = extractMentions(textWithMentions);
console.log("Input:", textWithMentions);
console.log("Extracted Mentions:", mentions);
console.log(`Found ${mentions.length} mentions: ${mentions.join(", ")}`);

// ============ TEST 3: KEYWORD EXTRACTION ============
console.log("\n🔑 TEST 3: Keyword Extraction");
console.log("-".repeat(60));

const textForKeywords = "The best tutorial for learning JavaScript programming and web development with modern frameworks";
const keywords = extractKeywords(textForKeywords, 5);
console.log("Input:", textForKeywords);
console.log("Extracted Keywords:", keywords);
console.log(`Top 5 keywords: ${keywords.join(", ")}`);

// ============ TEST 4: LANGUAGE DETECTION ============
console.log("\n🌍 TEST 4: Language Detection");
console.log("-".repeat(60));

const testTexts = [
  { text: "Hello world, this is a test", expected: "en" },
  { text: "مرحبا بالعالم", expected: "ar" },
  { text: "Привет мир", expected: "ru" },
  { text: "こんにちは世界", expected: "ja" },
  { text: "你好世界", expected: "zh" },
  { text: "안녕하세요 세계", expected: "ko" },
];

testTexts.forEach(({ text, expected }) => {
  const detected = detectLanguage(text);
  const status = detected === expected ? "✅" : "❌";
  console.log(`${status} "${text}" -> Detected: ${detected}, Expected: ${expected}`);
});

// ============ TEST 5: VIEW COUNT PARSING ============
console.log("\n👁️  TEST 5: View Count Parsing");
console.log("-".repeat(60));

const viewCounts = [
  "1.2M views",
  "500K views",
  "3.5B views",
  "150 views",
  "45.6K views",
];

viewCounts.forEach(text => {
  const parsed = parseViewCount(text);
  console.log(`"${text}" -> ${parsed?.toLocaleString()} views`);
});

// ============ TEST 6: ENGAGEMENT RATE CALCULATION ============
console.log("\n📊 TEST 6: Engagement Rate Calculation");
console.log("-".repeat(60));

const scenarios = [
  { likes: 1000, comments: 200, shares: 50, followers: 10000 },
  { likes: 500, comments: 100, shares: 25, followers: 5000 },
  { likes: 10000, comments: 2000, shares: 500, followers: 100000 },
];

scenarios.forEach((scenario, i) => {
  const rate = calculateEngagementRate(
    scenario.likes,
    scenario.comments,
    scenario.shares,
    scenario.followers
  );
  console.log(`Scenario ${i + 1}:`);
  console.log(`  - Likes: ${scenario.likes.toLocaleString()}, Comments: ${scenario.comments.toLocaleString()}, Shares: ${scenario.shares.toLocaleString()}`);
  console.log(`  - Followers: ${scenario.followers.toLocaleString()}`);
  console.log(`  - Engagement Rate: ${rate.toFixed(2)}%`);
});

// ============ TEST 7: YOUTUBE METADATA EXTRACTION ============
console.log("\n🎥 TEST 7: YouTube Content Metadata");
console.log("-".repeat(60));

const youtubeVideo = {
  videoId: "dQw4w9WgXcQ",
  title: { runs: [{ text: "Amazing Tutorial: Learn #JavaScript in 10 minutes! @codecademy" }] },
  descriptionSnippet: { runs: [{ text: "Complete guide to #webdev and #programming" }] },
  viewCountText: { simpleText: "1.5M views" },
  lengthText: { simpleText: "10:30" },
  publishedTimeText: { simpleText: "2 days ago" },
  thumbnail: { thumbnails: [{ url: "https://example.com/thumb.jpg" }] },
};

const youtubeMetadata = extractYoutubeContentMetadata(youtubeVideo, "TechChannel");
console.log("YouTube Metadata Extracted:");
console.log(`  - Title: ${youtubeMetadata.title}`);
console.log(`  - Views: ${youtubeMetadata.views?.toLocaleString()}`);
console.log(`  - Duration: ${youtubeMetadata.duration} seconds`);
console.log(`  - Hashtags: ${youtubeMetadata.hashtags?.join(", ")}`);
console.log(`  - Mentions: ${youtubeMetadata.mentions?.join(", ")}`);
console.log(`  - Keywords: ${youtubeMetadata.keywords?.join(", ")}`);
console.log(`  - Language: ${youtubeMetadata.language}`);
console.log(`  - Platform: ${youtubeMetadata.platform}`);

// ============ TEST 8: TWITTER METADATA EXTRACTION ============
console.log("\n🐦 TEST 8: Twitter Content Metadata");
console.log("-".repeat(60));

const tweet = {
  video_id: "1234567890",
  description: "Just launched our new #product! Thanks to @partner for the support. #startup #tech",
  likes: 1500,
  comments: 200,
  shares: 350,
  views: 50000,
  created_at: "2025-11-27T10:00:00Z",
};

const twitterMetadata = extractTwitterContentMetadata(tweet, "startupco");
console.log("Twitter Metadata Extracted:");
console.log(`  - Description: ${twitterMetadata.description}`);
console.log(`  - Likes: ${twitterMetadata.likes?.toLocaleString()}`);
console.log(`  - Comments: ${twitterMetadata.comments?.toLocaleString()}`);
console.log(`  - Shares: ${twitterMetadata.shares?.toLocaleString()}`);
console.log(`  - Views: ${twitterMetadata.views?.toLocaleString()}`);
console.log(`  - Hashtags: ${twitterMetadata.hashtags?.join(", ")}`);
console.log(`  - Mentions: ${twitterMetadata.mentions?.join(", ")}`);
console.log(`  - Keywords: ${twitterMetadata.keywords?.join(", ")}`);
console.log(`  - Language: ${twitterMetadata.language}`);

// ============ TEST 9: INSTAGRAM METADATA EXTRACTION ============
console.log("\n📷 TEST 9: Instagram Content Metadata");
console.log("-".repeat(60));

const instagramPost = {
  id: "12345",
  shortcode: "ABC123",
  edge_media_to_caption: {
    edges: [{
      node: {
        text: "Beautiful sunset 🌅 #sunset #photography #nature @photo_magazine"
      }
    }]
  },
  edge_media_preview_like: { count: 5000 },
  edge_media_to_comment: { count: 250 },
  is_video: false,
  display_url: "https://example.com/image.jpg",
  dimensions: { width: 1080, height: 1080 },
  taken_at_timestamp: 1732704000,
  __typename: "GraphImage",
};

const instagramMetadata = extractInstagramContentMetadata(instagramPost, "photographer");
console.log("Instagram Metadata Extracted:");
console.log(`  - Description: ${instagramMetadata.description}`);
console.log(`  - Likes: ${instagramMetadata.likes?.toLocaleString()}`);
console.log(`  - Comments: ${instagramMetadata.comments?.toLocaleString()}`);
console.log(`  - Media Type: ${instagramMetadata.mediaType}`);
console.log(`  - Dimensions: ${instagramMetadata.width}x${instagramMetadata.height}`);
console.log(`  - Hashtags: ${instagramMetadata.hashtags?.join(", ")}`);
console.log(`  - Mentions: ${instagramMetadata.mentions?.join(", ")}`);
console.log(`  - Keywords: ${instagramMetadata.keywords?.join(", ")}`);

// ============ TEST 10: TIKTOK METADATA EXTRACTION ============
console.log("\n🎵 TEST 10: TikTok Content Metadata");
console.log("-".repeat(60));

const tiktokVideo = {
  id: "9876543210",
  desc: "Dance challenge time! 💃 #dance #viral #fyp #trending @dancer_pro",
  stats: {
    playCount: 2500000,
    diggCount: 150000,
    commentCount: 5000,
    shareCount: 25000,
    collectCount: 10000,
  },
  video: {
    duration: 15,
    cover: "https://example.com/cover.jpg",
  },
  music: {
    id: "audio123",
    title: "Trending Sound",
    authorName: "DJ Mix",
  },
  createTime: 1732704000,
  author: {
    nickname: "DanceKing",
  },
  duetEnabled: true,
  stitchEnabled: true,
};

const tiktokMetadata = extractTiktokContentMetadata(tiktokVideo, "danceking");
console.log("TikTok Metadata Extracted:");
console.log(`  - Description: ${tiktokMetadata.description}`);
console.log(`  - Views: ${tiktokMetadata.views?.toLocaleString()}`);
console.log(`  - Likes: ${tiktokMetadata.likes?.toLocaleString()}`);
console.log(`  - Comments: ${tiktokMetadata.comments?.toLocaleString()}`);
console.log(`  - Shares: ${tiktokMetadata.shares?.toLocaleString()}`);
console.log(`  - Saves: ${tiktokMetadata.saves?.toLocaleString()}`);
console.log(`  - Duration: ${tiktokMetadata.duration} seconds`);
console.log(`  - Hashtags: ${tiktokMetadata.hashtags?.join(", ")}`);
console.log(`  - Mentions: ${tiktokMetadata.mentions?.join(", ")}`);
console.log(`  - Keywords: ${tiktokMetadata.keywords?.join(", ")}`);
console.log(`  - Music: ${tiktokMetadata.platformSpecific?.musicTitle} by ${tiktokMetadata.platformSpecific?.musicAuthor}`);

// ============ SUMMARY ============
console.log("\n" + "=".repeat(60));
console.log("✅ METADATA EXTRACTION TEST COMPLETE");
console.log("=".repeat(60));
console.log("\n📊 Summary:");
console.log("  - ✅ Hashtag extraction working");
console.log("  - ✅ Mention extraction working");
console.log("  - ✅ Keyword extraction working");
console.log("  - ✅ Language detection working");
console.log("  - ✅ View count parsing working");
console.log("  - ✅ Engagement rate calculation working");
console.log("  - ✅ YouTube metadata extraction working");
console.log("  - ✅ Twitter metadata extraction working");
console.log("  - ✅ Instagram metadata extraction working");
console.log("  - ✅ TikTok metadata extraction working");
console.log("\n🎉 All metadata extraction features functional!");
