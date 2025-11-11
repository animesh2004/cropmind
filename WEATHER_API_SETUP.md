# 🌤️ Weather API Setup Guide

## ✅ Fixed Issues

The weather API now supports **two providers** with automatic fallback:

1. **OpenWeatherMap** (Recommended - Free tier available)
2. **AccuWeather** (Fallback)

## 🔑 How to Get OpenWeatherMap API Key (Free)

### Step 1: Sign Up
1. Go to https://openweathermap.org/api
2. Click "Sign Up" (top right)
3. Create a free account
4. Verify your email

### Step 2: Get API Key
1. After login, go to: https://home.openweathermap.org/api_keys
2. Click "Generate" or use the default key
3. Copy your API key (starts with letters/numbers)

### Step 3: Add to Deployment
Add this environment variable in your deployment platform:

```env
OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

**Free Tier Limits:**
- 60 calls/minute
- 1,000,000 calls/month
- Perfect for production use!

## 🔑 How to Get AccuWeather API Key (Alternative)

### Step 1: Sign Up
1. Go to https://developer.accuweather.com/
2. Click "Sign Up"
3. Create a free account

### Step 2: Create App
1. Go to "My Apps"
2. Click "Add New App"
3. Fill in details
4. Copy your API Key

### Step 3: Add to Deployment
```env
ACCUWEATHER_API_KEY=your_accuweather_api_key_here
```

## 🚀 Quick Setup

### For Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add: `OPENWEATHER_API_KEY` = `your_key_here`
4. Redeploy

### For Netlify:
1. Go to Site settings
2. Navigate to "Environment variables"
3. Add: `OPENWEATHER_API_KEY` = `your_key_here`
4. Redeploy

## 🧪 Testing

After deployment, test the API:

```bash
curl https://your-domain.com/api/weather?location=Gorakhpur
```

**Expected Response:**
```json
{
  "temperature": 28,
  "condition": "Clear",
  "humidity": 65,
  "rainChance": 10,
  "windSpeed": 12,
  "description": "clear sky",
  "location": "Gorakhpur",
  "source": "openweathermap"
}
```

## 🐛 Troubleshooting

### Still Getting Mock Data?

1. **Check Environment Variable:**
   - Verify `OPENWEATHER_API_KEY` is set in deployment platform
   - Make sure variable name is exactly `OPENWEATHER_API_KEY`
   - Redeploy after adding the variable

2. **Check API Key:**
   - Verify key is correct (no extra spaces)
   - Check if key is activated (may take a few minutes after signup)

3. **Check Logs:**
   - Look for "OpenWeatherMap API error" in deployment logs
   - Check browser console for errors

4. **Test API Key Directly:**
   ```bash
   curl "https://api.openweathermap.org/data/2.5/weather?q=Gorakhpur&appid=YOUR_KEY&units=metric"
   ```

### Common Errors:

- **401 Unauthorized**: Invalid API key
- **429 Too Many Requests**: Rate limit exceeded (free tier: 60/min)
- **404 Not Found**: Location not found

## 📝 Notes

- OpenWeatherMap is tried first (more reliable)
- AccuWeather is used as fallback if OpenWeatherMap fails
- If both fail, mock data is returned with error info
- The `_fallback` and `_error` fields in response indicate issues

## ✅ Success Indicators

When working correctly, you'll see:
- Real-time temperature updates
- Actual weather conditions
- Location name in response
- `"source": "openweathermap"` in response (not `_fallback: true`)

---

**Need Help?** Check deployment logs for detailed error messages!

