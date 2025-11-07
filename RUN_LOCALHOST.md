# 🚀 How to Run the Site on Localhost

## Quick Start

### Step 1: Install Dependencies (First Time Only)

Open PowerShell or Command Prompt in the project directory and run:

```bash
cd "c:\Users\Animesh\Desktop\FINAL YEAR PRO\code"
npm install
```

This will install all required packages (Next.js, React, Tailwind CSS, etc.)

### Step 2: Start Development Server

Run the development server:

```bash
npm run dev
```

### Step 3: Open in Browser

Once the server starts, you'll see:

```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

Open your browser and go to:
**http://localhost:3000**

## Available Commands

### Development Mode (Hot Reload)
```bash
npm run dev
```
- Runs on `http://localhost:3000`
- Hot reload enabled (changes update automatically)
- Best for development

### Production Build
```bash
npm run build
npm start
```
- Builds optimized production version
- Runs on `http://localhost:3000`
- Best for testing production build

### Linting
```bash
npm run lint
```
- Checks code for errors

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, Next.js will automatically use the next available port (3001, 3002, etc.)

Or specify a different port:
```bash
npm run dev -- -p 3001
```

### Dependencies Not Installed

If you see errors about missing modules:
```bash
npm install
```

### Node.js Version

Make sure you have Node.js 18+ installed:
```bash
node --version
```

If not installed, download from: https://nodejs.org/

## Accessing the Site

### Main Dashboard
- **URL**: `http://localhost:3000`
- **Page**: Main dashboard with all sensors

### Test Kaggle API
- **URL**: `http://localhost:3000/test-kaggle`
- **Page**: Kaggle API testing page

### API Endpoints

All API routes are available at:
- **Sensors**: `http://localhost:3000/api/sensors?token=YOUR_TOKEN`
- **Security**: `http://localhost:3000/api/security?token=YOUR_TOKEN`
- **Recommendations**: `http://localhost:3000/api/recommendations` (POST)
- **Webhook**: `http://localhost:3000/api/webhooks/blynk` (POST/GET)
- **Test Kaggle**: `http://localhost:3000/api/test-kaggle`

## Webhook Testing (Localhost)

For local webhook testing, you need a public URL. Use one of these:

### Option 1: ngrok
```bash
# Install ngrok
npm install -g ngrok

# Start Next.js
npm run dev

# In another terminal, start ngrok
ngrok http 3000
```

Use the ngrok URL (e.g., `https://abc123.ngrok.io`) in Blynk webhook configuration.

### Option 2: localtunnel
```bash
# Install localtunnel
npm install -g localtunnel

# Start Next.js
npm run dev

# In another terminal, start tunnel
lt --port 3000
```

Use the localtunnel URL in Blynk webhook configuration.

## Environment Variables (Optional)

Create `.env.local` file in the project root:

```env
# Blynk Configuration (optional)
BLYNK_SERVER=blynk.cloud

# Kaggle API (already hardcoded, but can override)
KAGGLE_API_URL=
KAGGLE_API_KEY=
KAGGLE_USERNAME=
```

## Quick Reference

| Command | Description |
|--------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Check code quality |

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Start server: `npm run dev`
3. ✅ Open browser: `http://localhost:3000`
4. ✅ Configure Blynk token in User Profile
5. ✅ Test webhooks (use ngrok/localtunnel for local testing)

## Need Help?

- Check console for errors
- Verify Node.js version (18+)
- Make sure port 3000 is available
- Check if dependencies are installed

