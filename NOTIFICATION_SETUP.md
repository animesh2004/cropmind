# 🔔 Notification & SMS Alert Setup Guide

## Features Implemented ✅

### 1. Browser Notifications
- ✅ Automatic permission request
- ✅ Instant alerts for fire and animal detection
- ✅ Periodic alerts every 10 minutes
- ✅ Urgent notifications with sound

### 2. SMS Alerts
- ✅ Twilio integration
- ✅ AWS SNS support (placeholder)
- ✅ Instant SMS for fire/animal detection
- ✅ Periodic SMS every 10 minutes

### 3. Monitoring Service
- ✅ Background monitoring every 10 minutes
- ✅ Instant detection for fire (V2) and animal (V1)
- ✅ Configurable alert types
- ✅ Cooldown period to prevent spam

## Setup Instructions

### Browser Notifications
1. Click the "Notifications" button in the navbar
2. Click "Request Permission" when prompted
3. Enable "Enable Monitoring" toggle
4. Configure alert preferences

### SMS Alerts Setup

#### Option 1: Twilio (Recommended)

1. **Get Twilio Credentials:**
   - Sign up at https://www.twilio.com
   - Get your Account SID and Auth Token
   - Get a Twilio phone number

2. **Configure Environment Variables:**
   Create a `.env.local` file:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Add Phone Number:**
   - Open Notification Settings
   - Enter your phone number with country code (e.g., +1234567890)
   - Enable monitoring

#### Option 2: AWS SNS

1. **Get AWS Credentials:**
   - Set up AWS account
   - Create IAM user with SNS permissions
   - Get Access Key and Secret Key

2. **Configure Environment Variables:**
   ```env
   AWS_SNS_ACCESS_KEY=your_access_key
   AWS_SNS_SECRET_KEY=your_secret_key
   AWS_SNS_REGION=us-east-1
   ```

3. **Note:** AWS SNS requires AWS SDK installation:
   ```bash
   npm install @aws-sdk/client-sns
   ```

## How It Works

### Periodic Alerts (Every 10 Minutes)
- Monitors all sensors
- Sends browser notification
- Sends SMS if phone number configured
- Status update message

### Instant Alerts

#### Fire Detection (V2)
- Triggers when flame sensor > 0
- Immediate browser notification
- Immediate SMS alert
- 30-second cooldown to prevent spam

#### Animal Intrusion (V1)
- Triggers when PIR sensor > 0
- Immediate browser notification
- Immediate SMS alert
- 30-second cooldown to prevent spam

### Critical Conditions
- Low soil moisture (< 30%)
- High temperature (> 35°C)
- Low temperature (< 5°C)

## Configuration

### Notification Settings Component
Located in navbar - click "Notifications" button

**Settings:**
- Browser Notifications: Enable/disable
- Phone Number: For SMS alerts
- Enable Monitoring: Start/stop monitoring
- Periodic Alerts: Every 10 minutes
- Instant Alerts: Fire & Animal detection

### Storage
All settings saved in `localStorage`:
- `cropMind_phoneNumber`
- `cropMind_periodicAlerts`
- `cropMind_instantAlerts`
- `cropMind_monitoringEnabled`

## Testing

### Test Browser Notifications
1. Enable monitoring
2. Wait 10 minutes for periodic alert
3. Or trigger fire/animal detection

### Test SMS (Development)
- In development mode, SMS is logged to console
- Check browser console for SMS messages
- Format: `📱 [MOCK SMS] To: +1234567890`

### Test SMS (Production)
- Configure Twilio credentials
- Add phone number in settings
- Enable monitoring
- Wait for alert or trigger detection

## Troubleshooting

### Notifications Not Working
1. Check browser permission (Settings → Site Settings → Notifications)
2. Ensure monitoring is enabled
3. Check browser console for errors

### SMS Not Sending
1. Verify Twilio credentials in `.env.local`
2. Check phone number format (include country code)
3. Verify Twilio account has credits
4. Check server logs for errors

### Alerts Too Frequent
- Cooldown period is 30 seconds for instant alerts
- Adjust in `lib/monitoring-service.ts` if needed

## API Endpoints

### POST `/api/sms/send`
Send SMS alert

**Request:**
```json
{
  "phoneNumber": "+1234567890",
  "message": "Alert message",
  "urgent": true
}
```

**Response:**
```json
{
  "success": true,
  "provider": "twilio"
}
```

## Files Created

- `lib/notifications.ts` - Notification utilities
- `lib/monitoring-service.ts` - Background monitoring
- `app/api/sms/send/route.ts` - SMS API endpoint
- `components/notification-settings.tsx` - Settings UI

## Next Steps

1. Set up Twilio account (if using SMS)
2. Configure environment variables
3. Enable notifications in settings
4. Test with real sensors

