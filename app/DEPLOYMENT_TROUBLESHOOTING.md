# Deployment Troubleshooting Guide

## Issue: App works on localhost but shows fallback data in deployment

### Symptoms
- ✅ App runs smoothly on localhost
- ⚠️ Shows "Data Connection Warning" banner in deployment
- ⚠️ Displays fallback/mock data instead of real Blynk data

### Root Causes

#### 1. **Serverless Function Timeouts**
- **Vercel Free Tier**: 10-second timeout limit
- **Netlify**: 10-second timeout limit
- **Solution**: Blynk API calls might be timing out

#### 2. **Network/Firewall Restrictions**
- Deployment platforms may block external API calls
- Blynk API (`blynk.cloud`) might be blocked
- **Solution**: Check platform firewall rules

#### 3. **CORS Issues**
- Some platforms restrict cross-origin requests
- **Solution**: Usually not an issue for server-side API routes

#### 4. **Environment Variables**
- Missing or incorrect environment variables
- **Solution**: Verify all required env vars are set

## Diagnostic Steps

### Step 1: Test the Debug Endpoint

Visit in your deployment:
```
https://your-domain.com/api/sensors/debug?token=YOUR_BLYNK_TOKEN
```

This will show:
- ✅ Direct Blynk API connectivity test
- ✅ Helper function test
- ✅ All sensors fetch test
- ✅ Network connectivity test
- ✅ Response times and error details

### Step 2: Check Deployment Logs

**Vercel:**
1. Go to your project dashboard
2. Click on "Deployments"
3. Click on the latest deployment
4. Go to "Functions" tab
5. Check logs for `/api/sensors` function

**Netlify:**
1. Go to your site dashboard
2. Click on "Functions"
3. View logs for API routes

Look for:
- `Error fetching from Blynk`
- `Blynk API timeout`
- `Blynk API error`
- Network errors

### Step 3: Test Blynk API Directly

Test from your deployment platform's serverless function:

```bash
# Test from deployment logs or function console
curl "https://blynk.cloud/external/api/get?token=YOUR_TOKEN&V0"
```

Expected response: A number (e.g., `55.3`)

### Step 4: Verify Token

1. Check if token is stored correctly in localStorage
2. Verify token is valid in Blynk dashboard
3. Test token in Blynk mobile app

## Solutions

### Solution 1: Increase Timeout (If Platform Allows)

**Vercel:**
- Upgrade to Pro plan (60s timeout)
- Or optimize API calls to be faster

**Netlify:**
- Configure in `netlify.toml`:
```toml
[functions]
  timeout = 30
```

### Solution 2: Use Webhooks Instead of Polling

Webhooks are more reliable in serverless environments:

1. **Configure Blynk Webhook:**
   - Go to Blynk project settings
   - Add webhook URL: `https://your-domain.com/api/webhooks/blynk`
   - Set trigger: On virtual pin update

2. **Benefits:**
   - No timeout issues
   - Real-time data
   - More efficient

### Solution 3: Optimize API Calls

**Current Implementation:**
- Fetches 6 pins sequentially (can be slow)

**Optimized Version:**
- Already uses `Promise.allSettled` for parallel fetching
- 10-second timeout per pin
- Total time: ~10 seconds (if all succeed)

**Further Optimization:**
- Reduce timeout to 5 seconds per pin
- Fetch only essential pins first
- Cache results for 30 seconds

### Solution 4: Add Retry Logic

The current implementation doesn't retry. Add retry logic:

```typescript
// Example retry logic
async function fetchWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### Solution 5: Use Edge Functions (Vercel)

Edge functions have better performance:
- Lower latency
- No cold starts
- Better for API calls

**Convert to Edge Runtime:**
```typescript
export const runtime = 'edge'
```

## Quick Fixes

### Fix 1: Check Token in Deployment

1. Open browser console in deployment
2. Check localStorage: `localStorage.getItem('cropMind_blynkNodes')`
3. Verify token is present and correct

### Fix 2: Test API Endpoint

Visit: `https://your-domain.com/api/sensors?token=YOUR_TOKEN`

Should return JSON with sensor data or fallback data with warning.

### Fix 3: Enable Debug Mode

In development, the API returns debug URLs:
```json
{
  "debugUrl": "/api/sensors/debug?token=..."
}
```

Use this to diagnose issues.

## Platform-Specific Notes

### Vercel
- ✅ Free tier: 10s timeout
- ✅ Pro tier: 60s timeout
- ✅ Edge functions available
- ✅ Good for Next.js API routes

### Netlify
- ✅ Free tier: 10s timeout
- ✅ Pro tier: 26s timeout
- ✅ Functions in `netlify/functions`
- ⚠️ May need different configuration

### Railway
- ✅ No timeout limits
- ✅ Good for long-running requests
- ✅ Better for Blynk polling

### Render
- ✅ 30s timeout on free tier
- ✅ Good for API calls
- ✅ Reliable for Blynk

## Recommended Approach

### For Production Deployment:

1. **Use Webhooks (Best)**
   - Most reliable
   - Real-time
   - No timeout issues

2. **Use Edge Functions (Vercel)**
   - Better performance
   - Lower latency
   - No cold starts

3. **Optimize Polling**
   - Reduce timeout to 5s
   - Fetch only essential pins
   - Add caching

4. **Add Monitoring**
   - Track API success rate
   - Monitor response times
   - Alert on failures

## Testing Checklist

- [ ] Debug endpoint accessible: `/api/sensors/debug?token=...`
- [ ] API endpoint returns data: `/api/sensors?token=...`
- [ ] Deployment logs show no errors
- [ ] Blynk API is accessible from deployment platform
- [ ] Token is valid and device is connected
- [ ] Webhook is configured (if using webhooks)
- [ ] Timeout settings are appropriate
- [ ] Error messages are helpful

## Still Having Issues?

1. **Check Debug Endpoint Output**
   - Visit `/api/sensors/debug?token=YOUR_TOKEN`
   - Review all test results
   - Check which test is failing

2. **Review Deployment Logs**
   - Look for specific error messages
   - Check response times
   - Identify timeout issues

3. **Test Blynk API Directly**
   - Use curl or Postman
   - Verify token works
   - Check device connection

4. **Contact Support**
   - Share debug endpoint output
   - Include deployment logs
   - Provide platform details

## Success Indicators

✅ **Working Correctly:**
- Debug endpoint shows all tests passing
- API returns `source: "polling"` or `source: "webhook"`
- No warning banner in UI
- Real sensor data displayed

⚠️ **Partial Success:**
- Debug endpoint shows some tests passing
- API returns `source: "fallback"` with warning
- Warning banner shows but app is functional

❌ **Not Working:**
- Debug endpoint shows all tests failing
- API returns errors
- App shows error messages
- No data displayed

