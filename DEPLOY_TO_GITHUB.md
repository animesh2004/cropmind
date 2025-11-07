# 🚀 Deploy to GitHub Codespaces - Step by Step

## Quick Deployment Guide

### Step 1: Initialize Git Repository

Open PowerShell or Command Prompt in the project directory:

```bash
cd "c:\Users\Animesh\Desktop\FINAL YEAR PRO\code"

# Initialize git (if not already done)
git init

# Check status
git status
```

### Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click **+** (top right) → **New repository**
3. Repository name: `cropmind` (or your preferred name)
4. Description: "Intelligent IoT Agriculture Dashboard"
5. Visibility: **Private** (recommended) or **Public**
6. **Don't** check "Initialize with README" (we already have one)
7. Click **Create repository**

### Step 3: Add Remote and Push

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: CropMind Agriculture Dashboard"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/cropmind.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/cropmind.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: You'll need to authenticate with GitHub (use Personal Access Token or SSH key)

### Step 4: Open in GitHub Codespaces

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/cropmind`
2. Click the green **Code** button
3. Click the **Codespaces** tab
4. Click **Create codespace on main**
5. Wait for Codespace to start (2-3 minutes)

### Step 5: Install Dependencies in Codespace

Once Codespace is ready, in the terminal:

```bash
npm install --legacy-peer-deps
```

### Step 6: Start Development Server

```bash
npm run dev
```

### Step 7: Access Your App

1. GitHub Codespaces automatically forwards port 3000
2. Look for the **Ports** tab in the bottom panel
3. Find port 3000
4. Right-click → **Port Visibility** → **Public**
5. Click **Open in Browser** or copy the URL

Your app will be accessible at: `https://YOUR_CODESPACE-3000.preview.app.github.dev`

## 🔧 Codespace Features

The `.devcontainer/devcontainer.json` file automatically:
- ✅ Sets up Node.js 18
- ✅ Installs dependencies on creation
- ✅ Forwards port 3000
- ✅ Configures VS Code extensions

## 📋 Manual Commands (If Needed)

If auto-setup doesn't work:

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔐 Environment Variables (Optional)

If you need environment variables in Codespace:

1. Create `.env.local`:
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

## 🌐 Port Forwarding

GitHub Codespaces automatically forwards ports. To access:

1. **Ports** tab → Find port 3000
2. Right-click → **Port Visibility** → **Public**
3. Click **Open in Browser**

## 📝 Git Commands Reference

```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "Your message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main
```

## 🔍 Troubleshooting

### Authentication Issues
- Use GitHub Personal Access Token (Settings → Developer settings → Personal access tokens)
- Or set up SSH keys

### Port Not Accessible
- Check **Ports** tab
- Make port **Public**
- Try restarting Codespace

### Dependencies Not Installing
- Use `--legacy-peer-deps` flag
- Clear cache: `npm cache clean --force`

### Build Errors
- Check Node.js version: `node --version` (should be 18+)
- Clear `.next`: `rm -rf .next`
- Rebuild: `npm run build`

## ✅ Success Checklist

- [ ] Git repository initialized
- [ ] Code pushed to GitHub
- [ ] Codespace created
- [ ] Dependencies installed
- [ ] Dev server running
- [ ] App accessible via port forwarding

## 🎉 Next Steps

1. ✅ Code is on GitHub
2. ✅ Codespace is running
3. ✅ App is accessible
4. 🔄 Configure Blynk webhooks (see `BLYNK_WEBHOOK_SETUP.md`)
5. 🔄 Test all features
6. 🚀 Deploy to production (Vercel/Netlify)

## 📚 Additional Resources

- `README.md` - Project overview
- `BLYNK_WEBHOOK_SETUP.md` - Blynk configuration
- `GITHUB_DEPLOYMENT.md` - Detailed deployment guide
- `RUN_LOCALHOST.md` - Local development guide

---

**Your CropMind dashboard is ready for GitHub Codespaces!** 🚀

