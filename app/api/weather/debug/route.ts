import { NextRequest, NextResponse } from "next/server"

/**
 * Weather API Debug Endpoint
 * Helps diagnose weather API issues in production
 * Usage: /api/weather/debug
 */
export async function GET(request: NextRequest) {
  try {
    // Get API keys
    const openWeatherKey = (process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "").trim()
    const accuWeatherKey = (process.env.ACCUWEATHER_API_KEY || "").trim()
    
    const hasOpenWeatherKey = openWeatherKey.length > 0
    const hasAccuWeatherKey = accuWeatherKey.length > 0
    
    // Check all possible environment variable sources
    const envCheck = {
      OPENWEATHER_API_KEY: {
        exists: !!process.env.OPENWEATHER_API_KEY,
        length: process.env.OPENWEATHER_API_KEY?.length || 0,
        firstChars: process.env.OPENWEATHER_API_KEY?.substring(0, 4) || "N/A",
        lastChars: process.env.OPENWEATHER_API_KEY?.substring(process.env.OPENWEATHER_API_KEY.length - 4) || "N/A"
      },
      NEXT_PUBLIC_OPENWEATHER_API_KEY: {
        exists: !!process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
        length: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY?.length || 0,
        firstChars: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY?.substring(0, 4) || "N/A",
        lastChars: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY?.substring(process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY.length - 4) || "N/A"
      },
      ACCUWEATHER_API_KEY: {
        exists: !!process.env.ACCUWEATHER_API_KEY,
        length: process.env.ACCUWEATHER_API_KEY?.length || 0,
        firstChars: process.env.ACCUWEATHER_API_KEY?.substring(0, 4) || "N/A",
        lastChars: process.env.ACCUWEATHER_API_KEY?.substring(process.env.ACCUWEATHER_API_KEY.length - 4) || "N/A"
      }
    }
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      platform: process.env.VERCEL ? "Vercel" : process.env.NETLIFY ? "Netlify" : "Unknown",
      region: process.env.VERCEL_REGION || process.env.AWS_REGION || "Unknown",
      apiKeys: {
        openWeather: {
          configured: hasOpenWeatherKey,
          keyLength: openWeatherKey.length,
          source: process.env.OPENWEATHER_API_KEY ? "OPENWEATHER_API_KEY" : process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ? "NEXT_PUBLIC_OPENWEATHER_API_KEY" : "None"
        },
        accuWeather: {
          configured: hasAccuWeatherKey,
          keyLength: accuWeatherKey.length,
          source: process.env.ACCUWEATHER_API_KEY ? "ACCUWEATHER_API_KEY" : "None"
        }
      },
      environmentVariables: envCheck,
      recommendations: [] as string[]
    }
    
    // Add recommendations
    if (!hasOpenWeatherKey && !hasAccuWeatherKey) {
      diagnostics.recommendations.push(
        "❌ No weather API keys found. Add ACCUWEATHER_API_KEY to your deployment platform's environment variables.",
        "📝 For Vercel: Settings → Environment Variables → Add ACCUWEATHER_API_KEY",
        "📝 For Netlify: Site configuration → Environment variables → Add ACCUWEATHER_API_KEY",
        "⚠️ Remember: .env.local files are NOT deployed. You must set variables in your platform."
      )
    } else if (hasAccuWeatherKey) {
      diagnostics.recommendations.push(
        "✅ AccuWeather API key is configured",
        "🔍 If weather API still fails, check network connectivity or API key validity",
        "🧪 Test the key: /api/test-api-key?key=YOUR_KEY"
      )
    } else if (hasOpenWeatherKey) {
      diagnostics.recommendations.push(
        "✅ OpenWeatherMap API key is configured",
        "💡 Consider adding ACCUWEATHER_API_KEY as a fallback"
      )
    }
    
    // Check if we're in a serverless environment
    if (process.env.VERCEL || process.env.NETLIFY) {
      diagnostics.recommendations.push(
        "🌐 Running in serverless environment",
        "⏱️ API calls have timeout limits (usually 10s for Vercel, 10s for Netlify)"
      )
    }
    
    return NextResponse.json(diagnostics, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate diagnostics",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

