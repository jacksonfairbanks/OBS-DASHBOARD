# OBS Stream Overlay Dashboard

A dashboard for managing OBS stream overlay components including ticker tape, header text, and name tags.

## Structure

```
OBS-DASHBOARD/
├── index.html          # Main dashboard (served at root)
├── dashboard.html      # Alternative dashboard URL
├── components/
│   ├── ticker.html    # Ticker tape component
│   ├── header.html    # Header text component
│   └── nametag.html   # Name tag component (use ?id=0, ?id=1, etc.)
├── js/
│   ├── dashboard.js   # Dashboard logic
│   └── ticker.js      # Ticker component logic
└── api/
    └── ticker-data.js # Backend API endpoint (Vercel serverless function)
```

## Setup

1. **Deploy to Vercel**: Connect this repository to Vercel
2. **Add API Key**: In Vercel project settings, add `MASSIVE_API_KEY` environment variable
3. **Access Dashboard**: Visit your Vercel URL (e.g., `https://obs-dashboard.vercel.app`)

## Features

- ✅ Real-time ticker data from MASSIVE API (stocks) and CoinGecko (crypto)
- ✅ Automatic logo fetching from MASSIVE API branding endpoints
- ✅ Custom logo upload per ticker
- ✅ Separate OBS browser source URLs for each component
- ✅ localStorage persistence (settings saved in browser)
- ✅ Real-time updates (ticker updates every minute)

## Usage

1. Open the dashboard at your Vercel URL
2. Configure your tickers, header, and name tags
3. Copy the OBS Browser Source URLs
4. In OBS, add Browser Sources:
   - Set dimensions to 1920x1080 (you can scale in OBS)
   - Enable "Shutdown source when not visible" for performance
   - Position and resize as needed

## Notes

- All settings are stored in browser localStorage
- Ticker updates every 60 seconds
- Components automatically read from localStorage
- Name tags use query parameters: `nametag.html?id=0`, `nametag.html?id=1`, etc.



