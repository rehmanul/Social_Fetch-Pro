# OmniFetchPro

## Overview
OmniFetchPro is a full-stack TypeScript application that orchestrates cookie-based scrapers for YouTube, Twitter, Instagram, and TikTok. The Express API persists scraping jobs and account pools to local JSON files (via the `server/storage.ts` file) while the Vite React client renders dashboards and controls for triggering jobs.

## Contributor Guide
See [AGENTS.md](AGENTS.md) for contributor rules and production standards.

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and fill in cookie/session values pulled from authenticated browser sessions:
   ```bash
   cp .env.example .env
   # populate YOUTUBE_COOKIE, TWITTER_COOKIE, TWITTER_BEARER_TOKEN, INSTAGRAM_COOKIE, INSTAGRAM_SESSION_ID, TIKTOK_COOKIE, TIKTOK_SESSION_ID
   ```
3. Start the development server (API + client):
   ```bash
   npm run dev
   ```

## TikTok Business API (official)
- Populate `TIKTOK_APP_ID`, `TIKTOK_APP_SECRET`, `TIKTOK_REDIRECT_URI`, and optionally `TIKTOK_ADVERTISER_ID` in `.env`. Set `TIKTOK_USE_SANDBOX=true` to call the sandbox host or override with `TIKTOK_API_BASE`.
- Get the portal link from `GET /api/tiktok/auth-url` (supports an optional `state` query). Complete consent and the `/oauth-callback` route will exchange the `auth_code` and cache tokens to `.data/tiktok_tokens.json`.
- Check the stored token with `GET /api/tiktok/status`, refresh with `POST /api/tiktok/token/refresh`, and pull advertiser details via `POST /api/tiktok/advertiser/info` with an optional `advertiserId` in the JSON body.
- Keep the `.data/` folder on a persistent disk in production; never commit tokens or app secrets to Git.

## Production build
```bash
npm run build
npm start
```
This bundles the Vite client and serves it alongside the Express API. The server will listen on `process.env.PORT` when provided (Render sets this automatically) and falls back to `5000` locally.

## Deploying to Render
You can deploy manually from the dashboard or by using the included Render Blueprint file (`render.yaml`).

### Quick deploy with the dashboard
1. Push your code to a Git repository accessible to Render.
2. Create a Web Service with the following:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node 20 or newer
3. Set the environment variables from `.env.example` in the Render dashboard so scrapers can authenticate.
4. Mount a persistent disk at `/opt/render/project/src/.data` to retain jobs and credential storage between deploys.

### Automated deploy with the Render CLI + Blueprint
1. Ensure the Render CLI is installed and that `render.yaml` is present in the repository root.
2. Export your API token (do **not** commit the token):
   ```bash
   export RENDER_API_TOKEN="<your_render_api_token>"
   render login --api-key "$RENDER_API_TOKEN"
   ```
3. Deploy using the blueprint to provision the service, environment variables, and disk mount in one step:
   ```bash
   render blueprint deploy render.yaml
   ```
4. Future changes can be rolled out via the same Blueprint deploy command or by pushing to the tracked Git branch if auto-deploy is enabled.

## Data storage
Runtime data (jobs, platform stats, and credentials) are stored under `.data/` on disk. When deploying to Render, mount a persistent disk to retain this folder between deploys.
