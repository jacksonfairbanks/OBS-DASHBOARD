# OBS Stream Overlay Dashboard

A dashboard for managing OBS stream overlay components including ticker tape, header text, and name tags.

## Structure

```
obs-overlay/
├── dashboard.html          # Main dashboard (open this first)
├── components/
│   ├── ticker.html        # Ticker tape component
│   ├── header.html        # Header text component
│   └── nametag.html       # Name tag component (use ?id=0, ?id=1, etc.)
├── js/
│   ├── dashboard.js       # Dashboard logic
│   └── ticker.js          # Ticker component logic
└── api/
    └── ticker-data.js     # Backend API endpoint (Vercel serverless function)
```

## Setup

1. **Open the dashboard**: Open `dashboard.html` in your browser
2. **Configure your overlay**:
   - **Ticker Settings**: Add/remove tickers, upload custom logos
   - **Header Text**: Edit the header text
   - **Name Tags**: Create and manage name tags for different scenes
3. **Add to OBS**: Copy the Browser Source URLs from each tab and add them to OBS

## API Setup

The `api/ticker-data.js` file is a Vercel serverless function. 

**For Vercel deployment:**
- If deploying `obs-overlay` as a separate project, the API folder structure is correct
- If using your existing Vercel project, you may need to move `api/ticker-data.js` to the root `api/` folder
- Set the `MASSIVE_API_KEY` environment variable in Vercel

**For local development:**
- You'll need a local server (like `http-server` or `python -m http.server`)
- The API endpoint won't work locally unless you set up a local serverless function environment

## Features

- ✅ Real-time ticker data from MASSIVE API (stocks) and CoinGecko (crypto)
- ✅ Automatic logo fetching from MASSIVE API branding endpoints
- ✅ Custom logo upload per ticker
- ✅ Separate OBS browser source URLs for each component
- ✅ localStorage persistence (settings saved in browser)
- ✅ Real-time updates (ticker updates every minute)

## Usage

1. Open `dashboard.html`
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


