# Render.com Environment Variables

## Required for TikTok Scraping

### TIKTOK_COOKIES

Copy and paste this EXACT value into Render.com environment variable:

**Variable Name:** `TIKTOK_COOKIES`

**Variable Value (Copy Below):**
```
{"tt_session_tlb_tag_ads":"sttt%7C3%7C-r6SSgRamTr_qc2FRDnci__________JQoZjn6-jTZwl-eZvT_DdoWAjXnSDd-ZXT3buIqmTcbg%3D","tt_ticket_guard_client_data":"eyJ0dC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwidHQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJ0dC10aWNrZXQtZ3VhcmQtc2NlbmUiOiJ0dDRiX2FkcyIsInR0LXRpY2tldC1ndWFyZC1vcmlnaW4tY3J5cHQiOiJ7XCJlY19wcml2YXRlS2V5XCI6XCItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cXG5NSUdIQWdFQU1CTUdCeXFHU000OUFnRUdDQ3FHU000OUF3RUhCRzB3YXdJQkFRUWdiSTdpU3p3emJjZUNLVkpmQ3BhZHJ0ODZQTTBxQlRCRjh0UlNjcUVOZ1F5aFJBTkNBQVFvTW80TnFKbVFKcFgxQ1F5VjVyTmhycHNyTHM5KzJIY09sZnREVUc2N1Q3Q0dqSnFZS081L1BnMWRUQ044bXdyYjVldC9IOU43K0hxTE5uZERCU0lzXFxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVwiLFwiZWNfcHVibGljS2V5XCI6XCItLS0tLUJFR0lOIFBVQkxJQyBLRVktLS0tLVxcbk1Ga3dFd1lIS29aSXpqMENBUVlJS29aSXpqMERBUWNEUWdBRUtES09EYWlaa0NhVjlRa01sZWF6WWE2Ykt5N1BmdGgzRHBYN1ExQnV1MCt3aG95YW1DanVmejROWFV3amZKc0syK1hyZngvVGUvaDZpelozUXdVaUxBPT1cXG4tLS0tLUVORCBQVUJMSUMgS0VZLS0tLS1cIixcImVjX2NzclwiOlwiXCJ9IiwidHQtdGlja2V0LWd1YXJkLXB1YmxpYy1rZXkiOiJCQ2d5amcyb21aQW1sZlVKREpYbXMyR3VteXN1ejM3WWR3NlYrME5RYnJ0UHNJYU1tcGdvN244K0RWMU1JM3liQ3R2bDYzOGYwM3Y0ZW9zMmQwTUZJaXc9IiwidHQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoxfQ%3D%3D","tt_ticket_guard_client_web_domain":"2","tta_attr_id_mirror":"0.1763842693.7575646680445943825","ttwid":"1%7C215pKB07QN-sbbH5_Y8ckGWcV9GC8d8Ld5sLgcTAYdo%7C1764440983%7C64366df2e03ba11ae3a65859d41ba66e839c5a99ea6dc1aa370e45e727cfa62d","uid_tt":"149b54bc3258f2a85f1eebc7da9b7abedb8558de704ff858686e3d7944bdc6c7","uid_tt_ads":"d5c6c24f7370d2bdf752187bca748d91b5b9f4845893c93fef792cba32efccde","uid_tt_ss":"149b54bc3258f2a85f1eebc7da9b7abedb8558de704ff858686e3d7944bdc6c7","uid_tt_ss_ads":"d5c6c24f7370d2bdf752187bca748d91b5b9f4845893c93fef792cba32efccde"}
```

## How to Add to Render:

1. Go to your Render dashboard: https://dashboard.render.com/
2. Select your "social-fetch-pro" service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Name: `TIKTOK_COOKIES`
6. Value: Paste the entire JSON string above (including quotes)
7. Click **Save Changes**
8. Render will automatically redeploy with the new variable

## Cookie Details

Your TikTok session includes:

- **tt_session_tlb_tag_ads**: Primary session identifier
- **tt_ticket_guard_client_data**: Authentication ticket (includes cryptographic keys)
- **tt_ticket_guard_client_web_domain**: Web domain indicator
- **tta_attr_id_mirror**: Attribution tracking ID
- **ttwid**: TikTok web ID (unique device identifier)
- **uid_tt**: User ID for tracking
- **uid_tt_ads**: User ID for advertising
- **uid_tt_ss**: User ID for server-side tracking
- **uid_tt_ss_ads**: User ID for server-side advertising

**Session Expiry**: Your cookies expire on December 2, 2025. You'll need to refresh them after that date.

## Cookie Security Notes

⚠️ **IMPORTANT**: These cookies provide authenticated access to your TikTok account. DO NOT:
- Share these cookies publicly
- Commit them to version control (they're in .env.local which is gitignored)
- Use them on untrusted servers

✅ **Safe Usage**:
- Store only in Render.com environment variables (encrypted)
- Store locally in .env.local for testing (gitignored)
- Rotate cookies if compromised

## Testing Locally

To test locally before deploying:

1. Create `.env.local` file in project root
2. Add: `TIKTOK_COOKIES='{"tt_session_tlb_tag_ads":"...","ttwid":"...",...}'`
3. Run: `npm run build`
4. Run: `tsx test-tiktok-cookies.ts`
5. Verify you get video metadata with 90%+ quality

## Verification After Deployment

Once Render finishes deploying (check https://dashboard.render.com/), test the API:

```bash
curl -X POST https://social-fetch-pro.onrender.com/api/scrape/tiktok \
  -H "Content-Type: application/json" \
  -d '{"username":"clipsexclusive_"}'
```

Expected response:
```json
{
  "meta": {
    "username": "clipsexclusive_",
    "page": 1,
    "total_pages": 1,
    "total_posts": 15,
    "fetch_method": "tiktok_api_cookie_auth",
    "status": "success"
  },
  "data": [
    {
      "video_id": "...",
      "url": "https://www.tiktok.com/@clipsexclusive_/video/...",
      "title": "...",
      "views": 12345,
      "likes": 678,
      "comments": 90,
      "shares": 12,
      "thumbnail_url": "https://...",
      ...
    }
  ]
}
```

## Troubleshooting

If TikTok scraping fails:

1. **Cookies Expired**: Get fresh cookies from your browser (F12 → Application → Cookies → www.tiktok.com)
2. **Formatting Error**: Ensure JSON is valid (use https://jsonlint.com/)
3. **Missing Cookies**: Verify all 9 cookies are present
4. **IP Blocked**: Enable BRIGHTDATA_PROXY_URL if available
5. **Profile Private**: Test with public profiles only

## Next Steps

After adding `TIKTOK_COOKIES` to Render:

1. Wait for automatic deployment (2-3 minutes)
2. Check deployment logs for errors
3. Test API endpoint with curl command above
4. Verify metadata quality is 90%+
5. If successful, TikTok scraping is fully operational! 🎉
