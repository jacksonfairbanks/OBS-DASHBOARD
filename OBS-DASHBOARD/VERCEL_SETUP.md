# Vercel Setup Instructions

## Critical Vercel Project Settings

After uploading to GitHub and connecting to Vercel, you MUST configure these settings:

### 1. Framework Preset
- Go to your Vercel project → **Settings** → **General**
- Find **Framework Preset**
- Set it to: **"Other"** (NOT auto-detect)
- This tells Vercel to serve static files

### 2. Root Directory
- In the same Settings → General page
- **Root Directory** should be: `./` (or leave empty)
- This ensures Vercel looks in the root for files

### 3. Build Settings
- Go to **Settings** → **Build & Development Settings**
- **Build Command**: Leave EMPTY (no build needed)
- **Output Directory**: Leave EMPTY (files are in root)
- **Install Command**: Leave EMPTY

### 4. Environment Variables
- Go to **Settings** → **Environment Variables**
- Add: `MASSIVE_API_KEY` = (your API key)
- Apply to: **Production, Preview, Development** (check all)

### 5. Redeploy
- After changing settings, go to **Deployments**
- Click the **three dots** on latest deployment
- Click **Redeploy**

## File Structure (should be exactly this)

```
OBS-DASHBOARD/
├── index.html          ← Root URL serves this
├── dashboard.html
├── package.json
├── vercel.json
├── README.md
├── .gitignore
├── api/
│   └── ticker-data.js
├── components/
│   ├── ticker.html
│   ├── header.html
│   └── nametag.html
└── js/
    ├── dashboard.js
    └── ticker.js
```

## Testing

After deployment:
1. Visit: `https://your-project.vercel.app/` (should show dashboard)
2. Visit: `https://your-project.vercel.app/index.html` (should also work)
3. Visit: `https://your-project.vercel.app/api/ticker-data?ticker=BTC` (should return JSON)

If you still get 404:
- Check that Framework Preset is set to "Other"
- Verify all files are in the GitHub repo
- Check Build Logs in Vercel for errors

