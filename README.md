<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# RailMitra AI

Indian Railway assistant for live train status, trains between stations, station board, and AI chat.

View your app in AI Studio: https://ai.studio/apps/f603b3ce-4398-4d3d-a40d-aa5eaaa83513

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy env template and set keys:
   `cp .env.example .env.local`
3. Set `RAPIDAPI_KEY` in `.env.local` (required for live RapidAPI railway data)
4. Optionally set `GEMINI_API_KEY` for AI chat
5. Run the app:
   `npm run dev`

### RapidAPI setup

1. Create a RapidAPI account and get your API key
2. Subscribe to these APIs (same key works for both):
   - **IRCTC** host: `irctc1.p.rapidapi.com` — live train status
   - **Rail Info API India** host: `rail-info-api-india1.p.rapidapi.com` — train/station search & trains between
3. Put the key in `.env.local`:

```bash
RAPIDAPI_KEY="your_rapidapi_key_here"
```

Without `RAPIDAPI_KEY`, the server falls back to public scrapers/cache where available.
