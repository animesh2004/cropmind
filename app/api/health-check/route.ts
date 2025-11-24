import { NextRequest, NextResponse } from "next/server"
import {
  isGeminiConfigured,
  hasOpenWeatherKey,
  hasAccuWeatherKey,
  isKaggleConfigured,
  getConfigSummary,
  validateEnvironmentVariables,
  getOpenWeatherApiKey,
  getAccuWeatherApiKey,
  OPENWEATHER_API_URL,
  ACCUWEATHER_API_URL,
  getBlynkServer,
} from "@/lib/ai"
import { getActiveNodeToken } from "@/lib/blynk-nodes"

interface ApiTestResult {
  name: string
  status: "success" | "error" | "skipped" | "warning"
  message: string
  responseTime?: number
  details?: any
}

export async function GET(request: NextRequest) {
  const results: ApiTestResult[] = []
  const startTime = Date.now()

  // ============================================================================
  // 1. Environment Configuration Check
  // ============================================================================
  const configSummary = getConfigSummary()
  const validation = validateEnvironmentVariables()

  results.push({
    name: "Environment Configuration",
    status: validation.valid ? "success" : validation.missing.length > 0 ? "error" : "warning",
    message: validation.valid
      ? "All required environment variables are configured"
      : validation.missing.length > 0
      ? `Missing: ${validation.missing.join(", ")}`
      : `Warnings: ${validation.warnings.join(", ")}`,
    details: {
      config: configSummary,
      validation,
    },
  })

  // ============================================================================
  // 2. Gemini TTS API Test
  // ============================================================================
  if (isGeminiConfigured()) {
    try {
      const testStart = Date.now()
      const response = await fetch(`${request.nextUrl.origin}/api/tts/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "Test",
          language: "en",
          speaker: "Callirrhoe",
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      const responseTime = Date.now() - testStart

      if (response.ok) {
        const blob = await response.blob()
        results.push({
          name: "Gemini TTS API",
          status: blob.size > 100 ? "success" : "warning",
          message: blob.size > 100
            ? `Working - Audio generated (${blob.size} bytes)`
            : "Response received but audio size is too small",
          responseTime,
          details: {
            status: response.status,
            contentType: response.headers.get("content-type"),
            audioSize: blob.size,
          },
        })
      } else {
        const errorText = await response.text().catch(() => "Unknown error")
        results.push({
          name: "Gemini TTS API",
          status: "error",
          message: `Failed - ${response.status}: ${errorText.substring(0, 100)}`,
          responseTime,
          details: {
            status: response.status,
            error: errorText,
          },
        })
      }
    } catch (error) {
      results.push({
        name: "Gemini TTS API",
        status: "error",
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
        },
      })
    }
  } else {
    results.push({
      name: "Gemini TTS API",
      status: "skipped",
      message: "Skipped - GEMINI_API_KEY not configured",
    })
  }

  // ============================================================================
  // 3. OpenWeatherMap API Test
  // ============================================================================
  if (hasOpenWeatherKey()) {
    try {
      const testStart = Date.now()
      const response = await fetch(
        `${OPENWEATHER_API_URL}/weather?q=Delhi&appid=${getOpenWeatherApiKey()}&units=metric`,
        {
          signal: AbortSignal.timeout(10000),
        }
      )

      const responseTime = Date.now() - testStart

      if (response.ok) {
        const data = await response.json()
        results.push({
          name: "OpenWeatherMap API",
          status: "success",
          message: `Working - Location: ${data.name || "Unknown"}`,
          responseTime,
          details: {
            status: response.status,
            location: data.name,
            temperature: data.main?.temp,
          },
        })
      } else {
        const errorText = await response.text().catch(() => "Unknown error")
        results.push({
          name: "OpenWeatherMap API",
          status: "error",
          message: `Failed - ${response.status}: ${errorText.substring(0, 100)}`,
          responseTime,
          details: {
            status: response.status,
            error: errorText,
          },
        })
      }
    } catch (error) {
      results.push({
        name: "OpenWeatherMap API",
        status: "error",
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
        },
      })
    }
  } else {
    results.push({
      name: "OpenWeatherMap API",
      status: "skipped",
      message: "Skipped - OPENWEATHER_API_KEY not configured",
    })
  }

  // ============================================================================
  // 4. AccuWeather API Test
  // ============================================================================
  if (hasAccuWeatherKey()) {
    try {
      const testStart = Date.now()
      const response = await fetch(
        `${ACCUWEATHER_API_URL}/locations/v1/cities/search?apikey=${getAccuWeatherApiKey()}&q=Delhi`,
        {
          signal: AbortSignal.timeout(10000),
        }
      )

      const responseTime = Date.now() - testStart

      if (response.ok) {
        const data = await response.json()
        results.push({
          name: "AccuWeather API",
          status: data.length > 0 ? "success" : "warning",
          message: data.length > 0
            ? `Working - Found ${data.length} location(s)`
            : "Response OK but no locations found",
          responseTime,
          details: {
            status: response.status,
            locationsFound: data.length,
          },
        })
      } else {
        const errorText = await response.text().catch(() => "Unknown error")
        results.push({
          name: "AccuWeather API",
          status: "error",
          message: `Failed - ${response.status}: ${errorText.substring(0, 100)}`,
          responseTime,
          details: {
            status: response.status,
            error: errorText,
          },
        })
      }
    } catch (error) {
      results.push({
        name: "AccuWeather API",
        status: "error",
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
        },
      })
    }
  } else {
    results.push({
      name: "AccuWeather API",
      status: "skipped",
      message: "Skipped - ACCUWEATHER_API_KEY not configured",
    })
  }

  // ============================================================================
  // 5. Blynk API Test
  // ============================================================================
  const blynkToken = getActiveNodeToken()
  if (blynkToken) {
    try {
      const testStart = Date.now()
      const response = await fetch(
        `${request.nextUrl.origin}/api/sensors?token=${encodeURIComponent(blynkToken)}`,
        {
          signal: AbortSignal.timeout(10000),
        }
      )

      const responseTime = Date.now() - testStart

      if (response.ok) {
        const data = await response.json()
        results.push({
          name: "Blynk Sensors API",
          status: "success",
          message: `Working - Data received`,
          responseTime,
          details: {
            status: response.status,
            hasData: !!data,
            server: getBlynkServer(),
          },
        })
      } else {
        const errorText = await response.text().catch(() => "Unknown error")
        results.push({
          name: "Blynk Sensors API",
          status: "error",
          message: `Failed - ${response.status}: ${errorText.substring(0, 100)}`,
          responseTime,
          details: {
            status: response.status,
            error: errorText,
          },
        })
      }
    } catch (error) {
      results.push({
        name: "Blynk Sensors API",
        status: "error",
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
        },
      })
    }
  } else {
    results.push({
      name: "Blynk Sensors API",
      status: "skipped",
      message: "Skipped - No Blynk token configured",
    })
  }

  // ============================================================================
  // 6. Recommendations API Test
  // ============================================================================
  try {
    const testStart = Date.now()
    const response = await fetch(
      `${request.nextUrl.origin}/api/recommendations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moisture: 50,
          temperature: 25,
          humidity: 60,
        }),
        signal: AbortSignal.timeout(15000), // 15 second timeout for AI
      }
    )

    const responseTime = Date.now() - testStart

    if (response.ok) {
      const data = await response.json()
      results.push({
        name: "Recommendations API",
        status: "success",
        message: `Working - Source: ${data.source || "unknown"}`,
        responseTime,
        details: {
          status: response.status,
          source: data.source,
          hasRecommendations: !!data.recommendations,
        },
      })
    } else {
      const errorText = await response.text().catch(() => "Unknown error")
      results.push({
        name: "Recommendations API",
        status: "error",
        message: `Failed - ${response.status}: ${errorText.substring(0, 100)}`,
        responseTime,
        details: {
          status: response.status,
          error: errorText,
        },
      })
    }
  } catch (error) {
    results.push({
      name: "Recommendations API",
      status: "error",
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      details: {
        error: error instanceof Error ? error.stack : String(error),
      },
    })
  }

  // ============================================================================
  // 7. Security API Test
  // ============================================================================
  if (blynkToken) {
    try {
      const testStart = Date.now()
      const response = await fetch(
        `${request.nextUrl.origin}/api/security?token=${encodeURIComponent(blynkToken)}`,
        {
          signal: AbortSignal.timeout(10000),
        }
      )

      const responseTime = Date.now() - testStart

      if (response.ok) {
        const data = await response.json()
        results.push({
          name: "Security API",
          status: "success",
          message: `Working - Status: ${data.status || "unknown"}`,
          responseTime,
          details: {
            status: response.status,
            securityStatus: data.status,
          },
        })
      } else {
        results.push({
          name: "Security API",
          status: "error",
          message: `Failed - ${response.status}`,
          responseTime,
        })
      }
    } catch (error) {
      results.push({
        name: "Security API",
        status: "error",
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  } else {
    results.push({
      name: "Security API",
      status: "skipped",
      message: "Skipped - No Blynk token configured",
    })
  }

  // ============================================================================
  // Summary
  // ============================================================================
  const totalTime = Date.now() - startTime
  const successCount = results.filter((r) => r.status === "success").length
  const errorCount = results.filter((r) => r.status === "error").length
  const skippedCount = results.filter((r) => r.status === "skipped").length
  const warningCount = results.filter((r) => r.status === "warning").length

  return NextResponse.json(
    {
      status: "completed",
      summary: {
        total: results.length,
        success: successCount,
        error: errorCount,
        skipped: skippedCount,
        warning: warningCount,
        totalTime: `${totalTime}ms`,
      },
      results,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}

