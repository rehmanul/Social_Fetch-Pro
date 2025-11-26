# OmniFetchPro

## Overview
OmniFetchPro is a full-stack TypeScript application that orchestrates cookie-based scrapers for YouTube, Twitter, Instagram, and TikTok. The Express API persists scraping jobs and account pools to local JSON files (via the `server/storage.ts` file) while the Vite React client renders dashboards and controls for triggering jobs.

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and fill in cookie/session values pulled from authenticated browser sessions:
   ```bash
   cp .env.example .env
   # populate YOUTUBE_COOKIE, TWITTER_COOKIE, INSTAGRAM_COOKIE, INSTAGRAM_SESSION_ID, TIKTOK_COOKIE, TIKTOK_SESSION_ID
   ```
3. Start the development server (API + client):
   ```bash
   npm run dev
   ```

## Production build
```bash
npm run build
npm start
```
This bundles the Vite client and serves it alongside the Express API. The server will listen on `process.env.PORT` when provided (Render sets this automatically) and falls back to `5000` locally.

## Deploying to Render
1. Push your code to a Git repository accessible to Render.
2. Set the environment variables from `.env.example` in the Render dashboard (or via the Render CLI) so scrapers can authenticate.
3. Configure a Web Service with the following:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node 20 or newer
4. Optionally automate deploys with the Render CLI by exporting your Render API token (do **not** commit the token):
   ```bash
   export RENDER_API_TOKEN="<your_render_api_token>"
   render login --api-key "$RENDER_API_TOKEN"
   render services deploy <service-id>
   ```

## Data storage
Runtime data (jobs, platform stats, and credentials) are stored under `.data/` on disk. When deploying to Render, mount a persistent disk to retain this folder between deploys.
