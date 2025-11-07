# 🚀 GitHub Codespaces Deployment Guide

## Quick Start

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click **New Repository**
3. Name it: `cropmind` (or your preferred name)
4. Set visibility: **Private** (recommended) or **Public**
5. **Don't** initialize with README (we already have one)
6. Click **Create repository**

### Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
cd "c:\Users\Animesh\Desktop\FINAL YEAR PRO\code"
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: CropMind Agriculture Dashboard"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/cropmind.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Open in GitHub Codespaces

1. Go to your repository on GitHub
2. Click **Code** button (green)
3. Click **Codespaces** tab
4. Click **Create codespace on main**
5. Wait for Codespace to start (2-3 minutes)

### Step 4: Install Dependencies

Once Codespace is ready, run:

```bash
npm install --legacy-peer-deps
```

### Step 5: Start Development Server

```bash
npm run dev
```

### Step 6: Access Your App

1. Codespace will automatically forward port 3000
2. Click on the **Ports** tab in Codespace
3. Click **Open in Browser** on port 3000
4. Your app will open in a new tab!

## 🔧 Codespace Configuration

The project includes `.devcontainer/devcontainer.json` which:
- ✅ Automatically installs Node.js 18
- ✅ Installs dependencies on creation
- ✅ Forwards port 3000
- ✅ Sets up VS Code extensions

## 📋 Manual Setup (If Needed)

If auto-setup doesn't work:

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev
```

## 🌐 Port Forwarding

GitHub Codespaces automatically forwards port 3000. To access:
1. Go to **Ports** tab in Codespace
2. Find port 3000
3. Click **Open in Browser**

Or manually forward:
- Right-click on port 3000
- Select **Port Visibility** → **Public** or **Private**

## 🔐 Environment Variables

If you need environment variables:

1. In Codespace, create `.env.local`:
```bash
touch .env.local
```

2. Add variables:
```env
BLYNK_SERVER=blynk.cloud
KAGGLE_API_URL=
KAGGLE_API_KEY=
KAGGLE_USERNAME=
```

## 🚀 Production Build

To build for production in Codespace:

```bash
npm run build
npm start
```

## 📝 Useful Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```

## 🔍 Troubleshooting

### Port Not Accessible
- Check **Ports** tab in Codespace
- Ensure port 3000 is forwarded
- Try making it **Public**

### Dependencies Not Installing
- Use `--legacy-peer-deps` flag
- Clear npm cache: `npm cache clean --force`

### Build Errors
- Check Node.js version: `node --version` (should be 18+)
- Clear `.next` folder: `rm -rf .next`
- Rebuild: `npm run build`

## 📚 Next Steps

1. ✅ Code pushed to GitHub
2. ✅ Codespace created
3. ✅ Dependencies installed
4. ✅ Dev server running
5. ✅ App accessible via port forwarding

## 🎉 Success!

Your CropMind dashboard is now running in GitHub Codespaces!

Access it via the forwarded port 3000 in your browser.

