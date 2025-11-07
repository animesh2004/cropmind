# 🌾 CropMind - Agriculture Dashboard

An intelligent IoT agriculture dashboard for real-time environmental monitoring, AI-powered crop recommendations, and security alerts.

## 🚀 Features

- **Real-time Environmental Monitoring**: Soil moisture, temperature, humidity, and pH tracking
- **AI-Powered Crop Recommendations**: Get intelligent cultivation advice based on current conditions
- **Security & Safety**: PIR motion detection and flame sensor monitoring
- **Historical Data Charts**: Visualize environmental trends over time
- **Blynk IoT Integration**: Real-time data from IoT sensors via webhooks and polling
- **Kaggle AI Integration**: Enhanced crop recommendations using AI analysis
- **Browser Notifications**: Sound alerts for critical events (fire, animal intrusion)
- **10-minute Periodic Alerts**: Automated status updates

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.0 (App Router)
- **UI**: React 19.2.0, Tailwind CSS 4.1.9
- **Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **Animations**: Framer Motion
- **IoT**: Blynk API
- **AI**: Kaggle API
- **Language**: TypeScript 5

## 📋 Prerequisites

- Node.js 18+ 
- npm or pnpm
- Blynk account and token (optional)
- Kaggle API credentials (optional)

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Or with pnpm
pnpm install
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Blynk Integration

1. Get your Blynk token from [Blynk.Console](https://blynk.cloud)
2. Enter token in User Profile settings
3. Configure webhooks in Blynk.Console (see `BLYNK_WEBHOOK_SETUP.md`)

**Pin Mappings:**
- V0 - Soil Moisture
- V1 - PIR (Motion Sensor)
- V2 - Flame Sensor
- V3 - Temperature
- V4 - Humidity

### Kaggle AI

Kaggle credentials are pre-configured. To use your own:
- Set environment variables: `KAGGLE_USERNAME`, `KAGGLE_API_KEY`

## 📁 Project Structure

```
code/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── sensors/       # Sensor data endpoints
│   │   ├── security/      # Security endpoints
│   │   ├── recommendations/ # AI recommendations
│   │   └── webhooks/      # Blynk webhook endpoint
│   ├── page.tsx           # Home page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── sections/         # Dashboard sections
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and services
│   ├── blynk.ts          # Blynk API integration
│   ├── kaggle-ai.ts      # Kaggle AI integration
│   ├── notifications.ts  # Notification service
│   └── monitoring-service.ts # Background monitoring
└── public/               # Static assets
```

## 🌐 API Endpoints

- `GET /api/sensors?token=YOUR_TOKEN` - Get sensor data
- `GET /api/security?token=YOUR_TOKEN` - Get security status
- `POST /api/recommendations` - Get AI recommendations
- `POST/GET /api/webhooks/blynk` - Blynk webhook endpoint
- `GET /api/test-kaggle` - Test Kaggle API connection

## 📚 Documentation

- `BLYNK_WEBHOOK_SETUP.md` - Blynk webhook configuration guide
- `RUN_LOCALHOST.md` - Local development guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- `FINAL_VERIFICATION.md` - Project verification status

## 🚀 Deployment

### GitHub Codespaces

1. Push code to GitHub repository
2. Open repository in GitHub Codespaces
3. Run `npm install --legacy-peer-deps`
4. Run `npm run dev`
5. Access via Codespaces port forwarding

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Deploy automatically

### Netlify

1. Push code to GitHub
2. Connect to Netlify
3. Build command: `npm run build`
4. Publish directory: `.next`

## 🔐 Environment Variables (Optional)

Create `.env.local`:

```env
# Blynk Configuration
BLYNK_SERVER=blynk.cloud

# Kaggle API (optional - already hardcoded)
KAGGLE_API_URL=
KAGGLE_API_KEY=
KAGGLE_USERNAME=
```

## 📝 License

Private project

## 👤 Author

Animesh

---

**Built with ❤️ for smart agriculture**

