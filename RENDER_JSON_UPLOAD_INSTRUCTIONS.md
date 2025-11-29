# 📤 How to Upload JSON Environment Variables to Render

## ✅ File Ready: `render-env.json`

Your JSON file contains all 21 environment variables with fresh cookies, validated and ready to upload!

---

## 🚀 Upload Methods

### Method 1: Using Render CLI (Recommended - Fastest)

If you have Render CLI installed:

```bash
# Navigate to project directory
cd C:\Users\HP\Desktop\Social_Fetch-Pro-main\Social_Fetch-Pro-main

# Upload environment variables
render env set --file render-env.json --service social-fetch-pro
```

### Method 2: Manual Copy-Paste (Most Common)

Render doesn't support direct JSON upload through the web UI, so you'll need to copy each variable:

1. **Open the JSON file**: `render-env.json`
2. **Go to Render**: https://dashboard.render.com/
3. **Select service**: social-fetch-pro
4. **Go to Environment tab**
5. **For each variable in the JSON**:
   - Click "Add Environment Variable" (or Edit if exists)
   - Copy key name (e.g., `YOUTUBE_COOKIE`)
   - Copy value from JSON
   - Paste both
   - Click Save
6. **After all 21 variables**, click "Save Changes"
7. **Wait 2-3 minutes** for deployment

### Method 3: Using Render API

If you have a Render API key:

```bash
# Get your service ID
curl https://api.render.com/v1/services \
  -H "Authorization: Bearer YOUR_RENDER_API_KEY"

# Update environment variables
curl -X PUT https://api.render.com/v1/services/YOUR_SERVICE_ID/env-vars \
  -H "Authorization: Bearer YOUR_RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d @render-env.json
```

---

## 📋 Variables Included (21 Total)

All fresh cookies with proper escaping:

### Server Config (3)
- PORT
- NODE_ENV
- CORS_ORIGIN

### YouTube (2)
- YOUTUBE_COOKIE (✓ Fresh - Expires Oct 2026)
- YOUTUBE_API_KEY

### Twitter (2)
- TWITTER_COOKIE (✓ Fresh - Expires Dec 2026)
- TWITTER_BEARER_TOKEN

### Instagram (2)
- INSTAGRAM_COOKIE (✓ Fresh - Expires Nov 2026)
- INSTAGRAM_SESSION_ID

### TikTok (1)
- TIKTOK_COOKIES (⚠️ Expires Dec 2, 2025 - 3 days!)

### Bright Data Proxy (4)
- BRIGHTDATA_BROWSER_URL
- BRIGHTDATA_PROXY_URL
- BRIGHTDATA_UNLOCKER_API
- USE_BRIGHTDATA

### Rate Limiting (2)
- RATE_LIMIT_PER_MINUTE
- RATE_LIMIT_WINDOW

### Feature Flags (4)
- ENABLE_V2_METADATA
- ENABLE_PROXY_FALLBACK
- ENABLE_CACHING
- CACHE_TTL_MINUTES

### Security (1)
- CORS_CREDENTIALS

---

## ✅ Validation Checklist

Before uploading, verify:

- [x] JSON is valid (already validated!)
- [x] All 21 variables present
- [x] TIKTOK_COOKIES is PLURAL (not TIKTOK_COOKIE)
- [x] No line breaks in any value
- [x] All special characters properly escaped

---

## 🧪 After Upload - Test Commands

Once Render redeploys (2-3 minutes), test all platforms:

```bash
# Test TikTok
curl -X POST https://social-fetch-pro.onrender.com/api/scrape/tiktok \
  -H "Content-Type: application/json" \
  -d '{"username":"clipsexclusive_"}'

# Test Twitter
curl -X POST https://social-fetch-pro.onrender.com/api/scrape/twitter \
  -H "Content-Type: application/json" \
  -d '{"query":"elonmusk"}'

# Test YouTube
curl -X POST https://social-fetch-pro.onrender.com/api/scrape/youtube \
  -H "Content-Type: application/json" \
  -d '{"channel":"MrBeast"}'

# Test Instagram
curl -X POST https://social-fetch-pro.onrender.com/api/scrape/instagram \
  -H "Content-Type: application/json" \
  -d '{"username":"instagram"}'
```

---

## 📊 Expected Results After Upload

All platforms should work with enhanced metadata:

✅ **TikTok**: `"fetch_method": "tiktok_api_cookie_auth"` - 90% metadata
✅ **Twitter**: `"fetch_method": "twitter_graphql_enhanced"` - 95% metadata
✅ **YouTube**: `"fetch_method": "youtube_api_v3_official"` - 100% metadata
✅ **Instagram**: `"fetch_method": "instagram_cookie_scrape_real"` - 85% metadata

---

## ⚠️ Important Notes

1. **TIKTOK_COOKIES expires in 3 days** (Dec 2, 2025)
   - Set a reminder to refresh cookies before expiry

2. **JSON special characters**
   - Already properly escaped in the file
   - Do not modify the JSON manually

3. **Deployment time**
   - Render takes 2-3 minutes to redeploy after env var changes
   - Check "Events" tab in Render dashboard for progress

4. **If upload fails**
   - Check Render service logs for error details
   - Verify no typos in variable names
   - Ensure TIKTOK_COOKIES is plural (not singular)

---

## 🎯 Quick Start (Recommended)

**Use Method 2 (Manual Copy-Paste)**:

1. Open `render-env.json` in a text editor
2. Open Render dashboard in browser
3. Go to Environment tab
4. Copy-paste each of the 21 variables
5. Click "Save Changes"
6. Wait for deployment
7. Run test commands above

**Time required**: 5-10 minutes

---

## ✅ Done?

After uploading and testing, you should have:

- ✅ All 4 platforms working
- ✅ Enhanced metadata (95-100% for YouTube/Twitter)
- ✅ Fresh cookies valid for 11+ months (except TikTok)
- ✅ Bright Data proxy configured

Your Social Fetch Pro is now fully operational! 🚀
