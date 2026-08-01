<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# RailMitra AI

Indian Railway assistant for live train status, trains between stations, station board, PNR, and AI chat.

View your app in AI Studio: https://ai.studio/apps/f603b3ce-4398-4d3d-a40d-aa5eaaa83513

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy env template and set keys:
   `cp .env.example .env.local`
3. Set `RAPIDAPI_KEY` in `.env.local`
4. Optionally set `GEMINI_API_KEY` for AI chat
5. Run the app:
   `npm run dev`

### RapidAPI setup (irctc27)

Primary host (as configured):

```bash
RAPIDAPI_KEY="your_rapidapi_key_here"
RAPIDAPI_IRCTC_HOST="irctc27.p.rapidapi.com"
```

Subscribe on RapidAPI: [GatiMan / irctc27](https://rapidapi.com/GatiMan/api/irctc27)

Used endpoints:

| Feature | Method | Path |
|--------|--------|------|
| Live train status | POST | `/train-running-status.php` |
| Train schedule | POST | `/train-schedule.php` |
| PNR status | POST | `/pnr-status.php` |
| Trains between | POST | `/search.php` |

Headers:

```
x-rapidapi-key: <your key>
x-rapidapi-host: irctc27.p.rapidapi.com
Content-Type: application/x-www-form-urlencoded
```

If irctc27 quota is exceeded, the server falls back to `irctc1` / `rail-info-api-india1` / public scrapers where available.
