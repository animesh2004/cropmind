# 🚀 Deployment Fixes & Setup Guide

## ✅ Issues Fixed

### 1. **Weather API Fixed**
- ✅ Changed all HTTP calls to HTTPS for AccuWeather API
- ✅ Added proper headers and cache control
- ✅ Improved error handling with fallback to mock data

### 2. **Blynk Integration Fixed**
- ✅ Prioritized direct polling over webhook storage (works in serverless)
- ✅ Added timeout handling (10 seconds)
- ✅ Improved error handling with Promise.allSettled
- ✅ Better validation of sensor data
- ✅ Graceful fallback when webhook storage unavailable

## 📋 Environment Variables Setup

### For Vercel/Netlify/Other Platforms:

Add these environment variables in your deployment platform:

```env
# Weather API (AccuWeather)
OPENWEATHER_API_KEY=your_accuweather_api_key_here

# Blynk (Optional - defaults to blynk.cloud)
BLYNK_SERVER=blynk.cloud

# App URL (for internal API calls)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### How to Get AccuWeather API Key:

1. Go to https://developer.accuweather.com/
2. Sign up for a free account
3. Create a new app
4. Copy your API Key
5. Add it to your deployment platform's environment variables

## 🔧 Blynk Webhook Configuration

### For Production Deployment:

1. **Get your production URL:**
   - Vercel: `https://your-app.vercel.app`
   - Netlify: `https://your-app.netlify.app`
   - Custom domain: `https://your-domain.com`

2. **Configure Blynk Webhooks:**
   - Go to Blynk Console: https://blynk.cloud
   - Select your device
   - Go to Webhooks section
   - Add webhook URL: `https://your-domain.com/api/webhooks/blynk`
   - Method: POST or GET (both supported)
   - Format: JSON or URL parameters

3. **Webhook URL Format:**
   ```
   https://your-domain.com/api/webhooks/blynk?token=YOUR_TOKEN&pin=V0&value=55.3
   ```

4. **Or JSON Format:**
   ```json
   {
     "token": "YOUR_TOKEN",
     "pin": "V0",
     "value": 55.3
   }
   ```

## 🔍 Testing After Deployment

### 1. Test Weather API:
```bash
curl https://your-domain.com/api/weather?location=Gorakhpur
```

Should return weather data or mock data if API key not set.

### 2. Test Blynk Sensors API:
```bash
curl https://your-domain.com/api/sensors?token=YOUR_BLYNK_TOKEN
```

Should return sensor data from Blynk.

### 3. Test Blynk Webhook:
```bash
curl -X POST https://your-domain.com/api/webhooks/blynk \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN","pin":"V0","value":55.3}'
```

Should return: `{"success":true,"message":"Webhook data received"}`

## 🐛 Troubleshooting

### Weather API Not Working:

1. **Check API Key:**
   - Verify `OPENWEATHER_API_KEY` is set in environment variables
   - Check deployment logs for API errors
   - API will fallback to mock data if key is missing

2. **Check Logs:**
   - Look for "AccuWeather API error" in deployment logs
   - Common issues: Invalid API key, Rate limit exceeded

### Blynk Data Not Updating:

1. **Check Token:**
   - Verify Blynk token is correct in user profile
   - Token should be set in localStorage: `cropMind_blynkToken`

2. **Check Device Connection:**
   - Ensure IoT device is online and connected to Blynk
   - Check Blynk Console to see if device is online

3. **Check Webhook Configuration:**
   - Verify webhook URL is correct in Blynk Console
   - Test webhook manually using curl (see above)
   - Check deployment logs for webhook errors

4. **Check Polling:**
   - The app now prioritizes direct polling (more reliable)
   - Webhook storage is bonus but not required
   - If polling fails, check Blynk API status

5. **Common Issues:**
   - **All zeros returned**: Device not sending data to Blynk
   - **Timeout errors**: Blynk server slow or device offline
   - **401 errors**: Invalid Blynk token
   - **No data**: Check if device is connected to Blynk cloud

## 📝 Deployment Checklist

- [ ] Set `OPENWEATHER_API_KEY` environment variable
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production URL
- [ ] Configure Blynk webhooks with production URL
- [ ] Test weather API endpoint
- [ ] Test sensors API endpoint
- [ ] Test webhook endpoint
- [ ] Verify Blynk device is online
- [ ] Check deployment logs for errors

## 🔄 After Deployment

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Set Blynk token** in user profile
3. **Wait 15-30 seconds** for first data fetch
4. **Check browser console** for any errors
5. **Check network tab** to see API calls

## 📞 Support

If issues persist:
1. Check deployment platform logs
2. Check browser console for errors
3. Verify environment variables are set
4. Test API endpoints directly using curl
5. Check Blynk Console for device status

---

**Note:** The app now works better in production because:
- Direct polling is prioritized (works in serverless)
- Webhook storage is optional bonus
- Better error handling and timeouts
- HTTPS for all external API calls

