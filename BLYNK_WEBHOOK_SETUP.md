# 🔗 Blynk Webhook Setup Guide

## Overview

The project now supports **Blynk Webhooks** for real-time data updates. When sensor values change, Blynk automatically sends data to your server, eliminating the need for constant polling.

## How It Works

### Current System (Hybrid)
1. **Webhook (Primary)**: Real-time data when sensors change
2. **Polling (Fallback)**: Fetches data every 5-10 seconds if webhook data unavailable

### Benefits
- ✅ **Real-time updates** - Instant data when sensors change
- ✅ **More efficient** - No constant API polling
- ✅ **Lower API usage** - Only sends data when values change
- ✅ **Automatic fallback** - Uses polling if webhooks not configured

## Webhook Endpoint

**URL**: `https://your-domain.com/api/webhooks/blynk`

**Methods**: Both `GET` and `POST` are supported

**Format**:
```
POST /api/webhooks/blynk
Content-Type: application/json

{
  "token": "your_blynk_token",
  "pin": "V0",
  "value": "55.3"
}
```

Or URL parameters:
```
GET /api/webhooks/blynk?token=your_token&pin=V0&value=55.3
```

## Setting Up Webhooks in Blynk.Console

### Step-by-Step Guide

1. **Access Blynk.Console**
   - Go to [Blynk.Console](https://blynk.cloud)
   - Log in to your account

2. **Navigate to Webhooks**
   - Click **Settings** (gear icon) in the top right
   - Go to **Developers** section
   - Click **Webhooks**

3. **Create New Webhook**
   - Click **Create New Webhook** button
   - Fill in the details:

   **Basic Configuration:**
   - **Name**: `Soil Moisture V0` (or descriptive name)
   - **Trigger Event**: Select `Device Datastream Update`
   - **Device/Template**: Select your device or template
   - **Datastream**: Select `V0` (Soil Moisture)

   **Webhook Configuration:**
   - **URL**: `https://your-domain.com/api/webhooks/blynk`
   - **Method**: `POST` (recommended) or `GET`
   - **Content Type**: Select `Custom JSON`

   **Custom JSON Body** (for each pin):
   ```json
   {
     "token": "{DEVICE_TOKEN}",
     "pin": "V0",
     "value": "{PIN_VALUE}"
   }
   ```

   **Alternative - Web Form:**
   - **Content Type**: `Web Form`
   - Form fields:
     - `token` = `{DEVICE_TOKEN}`
     - `pin` = `V0`
     - `value` = `{PIN_VALUE}`

4. **Repeat for Each Pin**
   Create separate webhooks for:
   - **V0** (Soil Moisture)
   - **V1** (PIR/Motion)
   - **V2** (Flame)
   - **V3** (Temperature)
   - **V4** (Humidity)

5. **Test Webhook**
   - Click **Test** button in webhook settings
   - Check server logs for received data
   - Verify response is `200 OK`

6. **Enable Webhook**
   - Ensure webhook status is **Enabled**
   - Webhook will trigger automatically when datastream updates

### Blynk Variables Available

In Custom JSON, you can use:
- `{DEVICE_TOKEN}` - Device authentication token
- `{PIN_VALUE}` - Current pin value
- `{DEVICE_ID}` - Device ID
- `{DATASTREAM_ID}` - Datastream ID (e.g., "V0")
- `{TIMESTAMP}` - Timestamp of update

### Important Notes

- **Rate Limits**: Blynk webhooks have a default limit of 1 request per second
- **Error Handling**: If webhook fails 10 consecutive times, it will be disabled
- **Re-enable**: Open webhook settings and save again to re-enable
- **Testing**: Use the Test button to verify webhook without triggering real events

### Webhook Logs

Monitor webhook execution in Blynk.Console:
- Go to **Settings** > **Developers** > **Webhooks**
- Click on a webhook to view logs
- Check status: `OK`, `Waiting`, or `Failed`
- View request details and server response codes

## Webhook URL Format

### For Development (Local)
```
http://localhost:3000/api/webhooks/blynk
```

### For Production
```
https://your-domain.com/api/webhooks/blynk
```

**Note**: For local development, use a tunneling service like:
- **ngrok**: `ngrok http 3000`
- **localtunnel**: `npx localtunnel --port 3000`
- **Cloudflare Tunnel**: For production-like testing

## Testing Webhooks

### Test with cURL

```bash
# Test POST request
curl -X POST "http://localhost:3000/api/webhooks/blynk" \
  -H "Content-Type: application/json" \
  -d '{"token":"your_token","pin":"V0","value":"55.3"}'

# Test GET request
curl "http://localhost:3000/api/webhooks/blynk?token=your_token&pin=V0&value=55.3"
```

### Test from Browser

Visit:
```
http://localhost:3000/api/webhooks/blynk?token=your_token&pin=V0&value=55.3
```

### Expected Response

```json
{
  "success": true,
  "message": "Webhook data received",
  "pin": "V0",
  "value": 55.3
}
```

## Data Flow

### With Webhooks (Real-time)
```
IoT Device → Sensor Value Changes
    ↓
Blynk Cloud → Detects Change
    ↓
Webhook → POST to /api/webhooks/blynk
    ↓
blynkStorage → Stores Data
    ↓
Components → Fetch from Storage (instant)
```

### Without Webhooks (Polling)
```
Components → Poll /api/sensors every 10s
    ↓
API → Fetches from Blynk API
    ↓
Components → Display Data
```

## Pin Mappings

| Pin | Sensor | Webhook Trigger |
|-----|--------|----------------|
| V0  | Soil Moisture | When moisture % changes |
| V1  | PIR (Motion) | When motion detected/cleared |
| V2  | Flame Sensor | When flame detected/cleared |
| V3  | Temperature | When temperature changes |
| V4  | Humidity | When humidity % changes |

## Data Storage

- **Storage Type**: In-memory (resets on server restart)
- **TTL**: 60 seconds (data expires after 1 minute)
- **Auto-cleanup**: Expired data removed every 30 seconds

## Troubleshooting

### Webhook Not Receiving Data

1. **Check Webhook URL**: Ensure it's publicly accessible
2. **Check Blynk Configuration**: Verify webhook is enabled in Blynk app
3. **Check Server Logs**: Look for webhook requests in console
4. **Test Manually**: Use cURL to test the endpoint

### Data Not Updating

1. **Check Token**: Ensure Blynk token matches
2. **Check Pin Format**: Must be V0, V1, V2, V3, or V4
3. **Check Data Age**: Webhook data expires after 60 seconds
4. **Fallback to Polling**: System automatically falls back if webhook data unavailable

### Webhook Returns 400 Error

- **Missing Parameters**: Ensure `token`, `pin`, and `value` are provided
- **Invalid Pin**: Pin must be in format `V0`, `V1`, `V2`, `V3`, or `V4`
- **Invalid Value**: Value must be a number or string

## API Response Source

The API now returns a `source` field indicating data origin:

- `"webhook"` - Data from webhook (real-time)
- `"polling"` - Data from polling (fallback)
- `"mock"` - Mock data (no token provided)

## Next Steps

1. **Configure Webhooks in Blynk** using one of the methods above
2. **Test Webhook** using cURL or browser
3. **Monitor Logs** to see webhook data being received
4. **Check Dashboard** - Data should update in real-time

## Production Deployment

For production:
1. Deploy your app to Vercel/Netlify
2. Get your production URL: `https://your-app.vercel.app`
3. Update Blynk webhooks with production URL
4. Test webhook from production URL

## Benefits Summary

✅ **Real-time Updates**: Instant data when sensors change
✅ **Efficient**: No constant polling
✅ **Reliable**: Automatic fallback to polling
✅ **Scalable**: Works with multiple devices/tokens
✅ **Flexible**: Supports both GET and POST methods

