# 404 Error Troubleshooting Guide

## Critical Check: GitHub Repository Structure

**The files MUST be at the ROOT of your GitHub repository, NOT in a subfolder.**

### ✅ Correct Structure (in GitHub):
```
OBS-DASHBOARD/          ← Repository root
├── index.html          ← At root level
├── dashboard.html      ← At root level
├── package.json        ← At root level
├── vercel.json         ← At root level
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

### ❌ Wrong Structure (will cause 404):
```
OBS-DASHBOARD/
└── OBS-DASHBOARD/      ← Files in subfolder (WRONG!)
    ├── index.html
    └── ...
```

## How to Check Your GitHub Repo

1. Go to your GitHub repository: `https://github.com/jacksonfairbanks/OBS-DASHBOARD`
2. Look at the file list - `index.html` should be visible at the TOP level
3. If you see a folder called `OBS-DASHBOARD` with files inside it, that's the problem!

## How to Fix

### If files are in a subfolder:
1. In GitHub, click into the subfolder
2. Select all files
3. Move them to the root (or download, reorganize, and re-upload)

### Or re-upload correctly:
1. Make sure you're uploading files to the **root** of the repo
2. Not into a subfolder

## Vercel Settings Checklist

1. ✅ Framework Preset: **"Other"** (you said this is set)
2. ✅ Root Directory: **Empty or `./`**
3. ✅ Build Command: **Empty** (no build needed)
4. ✅ Output Directory: **Empty** (files are in root)
5. ✅ Install Command: **Empty**

## Test URLs

After fixing, test these URLs:
- `https://your-project.vercel.app/` → Should show dashboard
- `https://your-project.vercel.app/test.html` → Should show test page
- `https://your-project.vercel.app/index.html` → Should show dashboard
- `https://your-project.vercel.app/api/ticker-data?ticker=BTC` → Should return JSON

## Still Not Working?

1. Check Vercel deployment logs for errors
2. Verify all files are in GitHub repo root
3. Try deleting and recreating the Vercel project
4. Make sure you're visiting the correct Vercel URL (check Domains section)

