# 🚀 Render.com Setup Guide for Social Fetch Pro

## Quick Setup (5 minutes)

### Step 1: Add MINIMUM Required Environment Variables

Go to [Render Dashboard](https://dashboard.render.com/) → Your Service → **Environment** Tab

Add these variables:

| Variable Name | Value | Required? |
|--------------|-------|-----------|
| `PORT` | `5000` | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `YOUTUBE_COOKIE` | Your YouTube cookies | ✅ Yes |
| `TWITTER_COOKIE` | Your Twitter cookies | ✅ Yes |
| `TWITTER_BEARER_TOKEN` | Public token (see below) | ✅ Yes |
| `INSTAGRAM_COOKIE` | Your Instagram cookies | ✅ Yes |
| `INSTAGRAM_SESSION_ID` | Your Instagram session ID | ✅ Yes |
| `TIKTOK_COOKIES` | Your TikTok cookies JSON | ✅ Yes |

---

## 🎵 TikTok Configuration (CRITICAL)

### TIKTOK_COOKIES

**Copy this EXACT value:**

```json
{"tt_session_tlb_tag_ads":"sttt%7C3%7C-r6SSgRamTr_qc2FRDnci__________JQoZjn6-jTZwl-eZvT_DdoWAjXnSDd-ZXT3buIqmTcbg%3D","tt_ticket_guard_client_data":"eyJ0dC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwidHQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJ0dC10aWNrZXQtZ3VhcmQtc2NlbmUiOiJ0dDRiX2FkcyIsInR0LXRpY2tldC1ndWFyZC1vcmlnaW4tY3J5cHQiOiJ7XCJlY19wcml2YXRlS2V5XCI6XCItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cXG5NSUdIQWdFQU1CTUdCeXFHU000OUFnRUdDQ3FHU000OUF3RUhCRzB3YXdJQkFRUWdiSTdpU3p3emJjZUNLVkpmQ3BhZHJ0ODZQTTBxQlRCRjh0UlNjcUVOZ1F5aFJBTkNBQVFvTW80TnFKbVFKcFgxQ1F5VjVyTmhycHNyTHM5KzJIY09sZnREVUc2N1Q3Q0dqSnFZS081L1BnMWRUQ044bXdyYjVldC9IOU43K0hxTE5uZERCU0lzXFxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVwiLFwiZWNfcHVibGljS2V5XCI6XCItLS0tLUJFR0lOIFBVQkxJQyBLRVktLS0tLVxcbk1Ga3dFd1lIS29aSXpqMENBUVlJS29aSXpqMERBUWNEUWdBRUtES09EYWlaa0NhVjlRa01sZWF6WWE2Ykt5N1BmdGgzRHBYN1ExQnV1MCt3aG95YW1DanVmejROWFV3amZKc0syK1hyZngvVGUvaDZpelozUXdVaUxBPT1cXG4tLS0tLUVORCBQVUJMSUMgS0VZLS0tLS1cIixcImVjX2NzclwiOlwiXCJ9IiwidHQtdGlja2V0LWd1YXJkLXB1YmxpYy1rZXkiOiJCQ2d5amcyb21aQW1sZlVKREpYbXMyR3VteXN1ejM3WWR3NlYrME5RYnJ0UHNJYU1tcGdvN244K0RWMU1JM3liQ3R2bDYzOGYwM3Y0ZW9zMmQwTUZJaXc9IiwidHQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoxfQ%3D%3D","tt_ticket_guard_client_web_domain":"2","tta_attr_id_mirror":"0.1763842693.7575646680445943825","ttwid":"1%7C215pKB07QN-sbbH5_Y8ckGWcV9GC8d8Ld5sLgcTAYdo%7C1764440983%7C64366df2e03ba11ae3a65859d41ba66e839c5a99ea6dc1aa370e45e727cfa62d","uid_tt":"149b54bc3258f2a85f1eebc7da9b7abedb8558de704ff858686e3d7944bdc6c7","uid_tt_ads":"d5c6c24f7370d2bdf752187bca748d91b5b9f4845893c93fef792cba32efccde","uid_tt_ss":"149b54bc3258f2a85f1eebc7da9b7abedb8558de704ff858686e3d7944bdc6c7","uid_tt_ss_ads":"d5c6c24f7370d2bdf752187bca748d91b5b9f4845893c93fef792cba32efccde"}
```

⚠️ **IMPORTANT**: Copy the ENTIRE line including `{` and `}` - it's one long JSON string!

**Expires**: December 2, 2025

---

## 🐦 Twitter Bearer Token

Use this public Twitter web app bearer token:

```
AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA
```

This is extracted from Twitter's web app and is safe to use for cookie-based scraping.

---

## 🔧 Optional but Recommended

### Bright Data Proxy (for better reliability)

Add these for enhanced scraping with residential IPs:

| Variable | Value |
|----------|-------|
| `BRIGHTDATA_PROXY_URL` | `http://brd-customer-hl_4a6f8ccb-zone-scraping_browser1:207rpgif22p1@brd.superproxy.io:22225` |
| `BRIGHTDATA_BROWSER_URL` | `wss://brd-customer-hl_4a6f8ccb-zone-scraping_browser1:207rpgif22p1@brd.superproxy.io:9222` |
| `BRIGHTDATA_UNLOCKER_API` | `f6698ae3-f609-4f80-82e1-7fa42f3c897a` |
| `USE_BRIGHTDATA` | `true` |

---

## 📋 How to Get Cookies for Each Platform

### YouTube Cookies

1. Open Chrome and go to https://youtube.com
2. Make sure you're logged in
3. Press `F12` → `Application` tab → `Cookies` → `https://www.youtube.com`
4. Copy ALL cookie values as one string:
   ```
   VISITOR_INFO1_LIVE=xxxxx; PREF=xxxxx; YSC=xxxxx; LOGIN_INFO=xxxxx; ...
   ```

### Twitter Cookies

1. Go to https://twitter.com and login
2. Press `F12` → `Application` → `Cookies` → `https://twitter.com`
3. Find and copy: `auth_token`, `ct0`, `twid`, `kdt`
4. Format as: `auth_token=xxxxx; ct0=xxxxx; twid=xxxxx; kdt=xxxxx`

### Instagram Cookies

1. Go to https://instagram.com and login
2. Press `F12` → `Application` → `Cookies` → `https://www.instagram.com`
3. Find `sessionid` cookie
4. Copy entire cookie string including `sessionid`
5. For `INSTAGRAM_SESSION_ID`: Copy ONLY the sessionid value

### TikTok Cookies (MOST COMPLEX)

1. Go to https://tiktok.com and login
2. Press `F12` → `Application` → `Cookies` → `https://www.tiktok.com`
3. Find these 9 cookies:
   - `tt_session_tlb_tag_ads`
   - `tt_ticket_guard_client_data`
   - `tt_ticket_guard_client_web_domain`
   - `tta_attr_id_mirror`
   - `ttwid`
   - `uid_tt`
   - `uid_tt_ads`
   - `uid_tt_ss`
   - `uid_tt_ss_ads`

4. Format as JSON:
   ```json
   {"tt_session_tlb_tag_ads":"value1","tt_ticket_guard_client_data":"value2",...}
   ```

---

## ✅ Verification Steps

### After Adding All Variables:

1. **Save Changes** in Render (triggers auto-deploy)
2. **Wait 2-3 minutes** for deployment
3. **Check Logs** for errors
4. **Test API**:

```bash
# Test YouTube
curl -X POST https://social-fetch-pro.onrender.com/api/scrape/youtube \
  -H "Content-Type: application/json" \
  -d '{"channelName":"MrBeast"}'

# Test Twitter
curl -X POST https://social-fetch-pro.onrender.com/api/scrape/twitter \
  -H "Content-Type: application/json" \
  -d '{"username":"elonmusk"}'

# Test Instagram
curl -X POST https://social-fetch-pro.onrender.com/api/scrape/instagram \
  -H "Content-Type: application/json" \
  -d '{"username":"instagram"}'

# Test TikTok
curl -X POST https://social-fetch-pro.onrender.com/api/scrape/tiktok \
  -H "Content-Type: application/json" \
  -d '{"username":"clipsexclusive_"}'
```

---

## 🔍 Expected Response Format

All platforms return data in this format:

```json
{
  "meta": {
    "username": "example",
    "page": 1,
    "total_pages": 1,
    "total_posts": 15,
    "fetch_method": "platform_api_method",
    "status": "success"
  },
  "data": [
    {
      "video_id": "12345",
      "url": "https://...",
      "title": "Video title",
      "description": "Video description",
      "views": 100000,
      "likes": 5000,
      "comments": 200,
      "shares": 50,
      "duration": 120,
      "published": "2024-11-20T10:00:00.000Z",
      "channel": "example",
      "author_name": "Example User",
      "thumbnail_url": "https://..."
    }
  ],
  "status": "success"
}
```

---

## 🚨 Troubleshooting

### Error: "Cookie invalid or expired"

**Solution**: Get fresh cookies from your browser (repeat steps above)

### Error: "Unable to parse TikTok metadata"

**Solution**:
1. Verify `TIKTOK_COOKIES` is valid JSON
2. Check all 9 cookies are present
3. Make sure cookies aren't expired

### Error: "Proxy connection failed"

**Solution**:
1. Verify Bright Data credentials
2. Try setting `USE_BRIGHTDATA=false` temporarily
3. Check proxy URL format

### Error: "Rate limited"

**Solution**:
1. Wait a few minutes
2. Use Bright Data proxy (residential IPs)
3. Adjust `RATE_LIMIT_PER_MINUTE` if needed

---

## 📊 Metadata Quality by Platform

| Platform | Current Method | Completeness | Upgrade Option |
|----------|---------------|--------------|----------------|
| **YouTube** | Cookie scraping | 70% | YouTube Data API v3 (100%) |
| **Twitter** | Cookie + GraphQL | 70% | Twitter API v2 (100%) |
| **Instagram** | Cookie API | 85% | No official API |
| **TikTok** | Cookie API | 90% | Display API (requires KYC) |

---

## 🔐 Security Notes

- ✅ Render encrypts environment variables
- ✅ Never commit .env files to git
- ✅ Rotate cookies every 30-90 days
- ✅ Monitor for unauthorized access
- ⚠️ Don't share cookies publicly
- ⚠️ Use API keys when available (more secure)

---

## 🎉 You're Done!

Once all environment variables are added and Render finishes deploying, your Social Fetch Pro API will be fully operational for all 4 platforms!

**API Base URL**: `https://social-fetch-pro.onrender.com`

**Available Endpoints**:
- `/api/scrape/youtube` - POST with `{"channelName":"..."}`
- `/api/scrape/twitter` - POST with `{"username":"..."}`
- `/api/scrape/instagram` - POST with `{"username":"..."}`
- `/api/scrape/tiktok` - POST with `{"username":"..."}`
- `/api/health` - GET (health check)
- `/api/proxy/stats` - GET (proxy statistics)

For detailed API documentation, see `README.md` in the repository.
