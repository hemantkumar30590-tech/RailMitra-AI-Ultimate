<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# RailMitra AI

Indian Railway assistant for live train status, trains between stations, station board, PNR, and AI chat.

## Run Locally

1. `npm install`
2. `cp .env.example .env.local`
3. Set `RAPIDAPI_KEY` in `.env.local`
4. `npm run dev`

### RapidAPI setup (irctc-api5)

```bash
RAPIDAPI_KEY="your_rapidapi_key_here"
RAPIDAPI_IRCTC_HOST="irctc-api5.p.rapidapi.com"
```

| Feature | Method | Path |
|--------|--------|------|
| Live train status | GET | `/live-status/{train_no}?date=YYYY-MM-DD&frm=HWH` |
| Trains between | GET | `/trains?frm=NDLS&to=BCT` |
| Search train | GET | `/search/train?q=...` |
| Search station | GET | `/search/station?q=...` |
| PNR status | GET | `/pnr/{pnr}` |
| Station live | GET | `/station-live/{station_code}` |

Headers:

```
x-rapidapi-key: <your key>
x-rapidapi-host: irctc-api5.p.rapidapi.com
```

Fallbacks: `irctc1` (live), `rail-info-api-india1` (search/trains-between), public scrapers.
