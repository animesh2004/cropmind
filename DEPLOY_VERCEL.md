# Vercel Deployment Guide

## Quick Deploy Steps

1. **Login to Vercel CLI:**
   ```bash
   vercel login
   ```
   - Visit the URL shown in terminal
   - Sign in/up to Vercel
   - Authorize the CLI

2. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

3. **Or Deploy to Preview:**
   ```bash
   vercel
   ```

## Environment Variables (Optional)

If needed, set these in Vercel Dashboard:
- `NEXT_PUBLIC_APP_URL` - Auto-set by Vercel
- `BLYNK_SERVER` - Optional (defaults to "blynk.cloud")

## Build Configuration

- **Framework:** Next.js (auto-detected)
- **Build Command:** `npm run build`
- **Install Command:** `npm install --legacy-peer-deps`
- **Output Directory:** `.next` (auto)

## After Deployment

Your app will be available at: `https://your-project-name.vercel.app`

