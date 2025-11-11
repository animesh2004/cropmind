# TTS API Setup Guide

## Problem
Browser's built-in TTS doesn't have proper Hindi voice support, so it only reads numbers when trying to speak Hindi text.

## Solution
Use an external TTS API for Hindi while keeping browser TTS for English (which works great).

## Current Implementation
- **English**: Uses browser's built-in TTS (works perfectly)
- **Hindi**: Uses external TTS API (needs configuration)

## API Route
The API route is located at: `app/api/tts/route.ts`

## Supported TTS Services

### Option 1: Google Cloud Text-to-Speech
1. Get API key from Google Cloud Console
2. Add to `.env.local`:
   ```
   GOOGLE_TTS_API_KEY=your_api_key_here
   ```
3. Uncomment the Google TTS code in `app/api/tts/route.ts`

### Option 2: Azure Text-to-Speech
1. Get API key from Azure Portal
2. Add to `.env.local`:
   ```
   AZURE_TTS_API_KEY=your_api_key_here
   AZURE_TTS_REGION=eastus
   ```
3. Uncomment the Azure TTS code in `app/api/tts/route.ts`

### Option 3: Custom TTS API
1. Provide your TTS API endpoint
2. Add to `.env.local`:
   ```
   CUSTOM_TTS_ENDPOINT=https://your-tts-api.com/synthesize
   CUSTOM_TTS_API_KEY=your_api_key_here
   ```
3. Update the custom TTS code in `app/api/tts/route.ts` with your API's format

## API Response Format
The API should return one of these formats:

**Option 1: Audio URL**
```json
{
  "audioUrl": "https://example.com/audio.mp3"
}
```

**Option 2: Base64 Audio**
```json
{
  "audioBase64": "base64_encoded_audio_string"
}
```

## Testing
1. Set preferred language to Hindi in profile
2. Click "Listen" button in Environmental Monitoring
3. Should hear Hindi speech (not just numbers)

## Next Steps
Please provide:
1. Which TTS service you want to use (Google, Azure, or custom)
2. Your API key/credentials
3. Any specific requirements for your TTS API

