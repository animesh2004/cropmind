import { NextRequest, NextResponse } from "next/server"

/**
 * Test Weather APIs Endpoint
 * Tests both OpenWeatherMap and AccuWeather APIs
 * Usage: /api/test-weather?location=Gorakhpur
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get("location") || "Gorakhpur"
    const testResults: any = {
      location,
      timestamp: new Date().toISOString(),
      tests: {},
    }

  // Get and trim API keys to remove any whitespace
  const openWeatherKey = (process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "").trim()
  const accuWeatherKey = (process.env.ACCUWEATHER_API_KEY || "").trim()
  
  // Validate API keys are not empty
  const hasOpenWeatherKey = openWeatherKey.length > 0
  const hasAccuWeatherKey = accuWeatherKey.length > 0

  // Test 1: OpenWeatherMap API
  testResults.tests.openweathermap = {
    configured: hasOpenWeatherKey,
    status: "not_tested",
    error: null,
    data: null,
  }

  if (hasOpenWeatherKey) {
    try {
      const startTime = Date.now()
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${openWeatherKey}&units=metric`
      
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent": "CropMind/1.0",
        },
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        testResults.tests.openweathermap = {
          configured: true,
          status: "success",
          responseTime: `${responseTime}ms`,
          statusCode: response.status,
          data: {
            temperature: data.main?.temp,
            condition: data.weather?.[0]?.main,
            description: data.weather?.[0]?.description,
            humidity: data.main?.humidity,
            windSpeed: data.wind?.speed,
            location: data.name,
            country: data.sys?.country,
          },
          raw: {
            main: data.main,
            weather: data.weather,
            wind: data.wind,
          },
        }
      } else {
        const errorText = await response.text().catch(() => "")
        testResults.tests.openweathermap = {
          configured: true,
          status: "failed",
          statusCode: response.status,
          responseTime: `${responseTime}ms`,
          error: errorText || `HTTP ${response.status}`,
        }
      }
    } catch (error) {
      testResults.tests.openweathermap = {
        configured: true,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  } else {
    testResults.tests.openweathermap.error = "API key not configured (OPENWEATHER_API_KEY)"
  }

  // Test 2: AccuWeather API
  testResults.tests.accuweather = {
    configured: hasAccuWeatherKey,
    status: "not_tested",
    error: null,
    data: null,
  }

  if (hasAccuWeatherKey) {
    try {
      // Step 1: Get location key
      const startTime = Date.now()
      const locationUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${accuWeatherKey}&q=${encodeURIComponent(location)}`
      
      const locationResponse = await fetch(locationUrl, {
        cache: "no-store",
        headers: {
          "User-Agent": "CropMind/1.0",
        },
      })

      if (locationResponse.ok) {
        const locationData = await locationResponse.json()
        
        if (locationData && locationData.length > 0) {
          const locationKey = locationData[0].Key
          const locationName = locationData[0].LocalizedName || location

          // Step 2: Get current conditions
          const conditionsUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${accuWeatherKey}&details=true`
          const conditionsResponse = await fetch(conditionsUrl, {
            cache: "no-store",
            headers: {
              "User-Agent": "CropMind/1.0",
            },
          })

          const totalResponseTime = Date.now() - startTime

          if (conditionsResponse.ok) {
            const conditionsData = await conditionsResponse.json()
            
            if (conditionsData && conditionsData.length > 0) {
              const weather = conditionsData[0]
              testResults.tests.accuweather = {
                configured: true,
                status: "success",
                responseTime: `${totalResponseTime}ms`,
                statusCode: conditionsResponse.status,
                data: {
                  temperature: weather.Temperature?.Metric?.Value,
                  condition: weather.WeatherText,
                  humidity: weather.RelativeHumidity,
                  windSpeed: weather.Wind?.Speed?.Metric?.Value,
                  location: locationName,
                  hasPrecipitation: weather.HasPrecipitation,
                  cloudCover: weather.CloudCover,
                },
                raw: {
                  WeatherText: weather.WeatherText,
                  Temperature: weather.Temperature,
                  RelativeHumidity: weather.RelativeHumidity,
                  Wind: weather.Wind,
                },
              }
            } else {
              testResults.tests.accuweather = {
                configured: true,
                status: "failed",
                error: "No weather data returned",
              }
            }
          } else {
            const errorText = await conditionsResponse.text().catch(() => "")
            testResults.tests.accuweather = {
              configured: true,
              status: "failed",
              statusCode: conditionsResponse.status,
              error: errorText || `HTTP ${conditionsResponse.status}`,
            }
          }
        } else {
          testResults.tests.accuweather = {
            configured: true,
            status: "failed",
            error: `Location "${location}" not found`,
          }
        }
      } else {
        const errorText = await locationResponse.text().catch(() => "")
        testResults.tests.accuweather = {
          configured: true,
          status: "failed",
          statusCode: locationResponse.status,
          error: errorText || `HTTP ${locationResponse.status}`,
        }
      }
    } catch (error) {
      testResults.tests.accuweather = {
        configured: true,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  } else {
    testResults.tests.accuweather.error = "API key not configured (ACCUWEATHER_API_KEY)"
  }

  // Summary
  const openWeatherSuccess = testResults.tests.openweathermap.status === "success"
  const accuWeatherSuccess = testResults.tests.accuweather.status === "success"
  
  testResults.summary = {
    openweathermap: {
      configured: hasOpenWeatherKey,
      working: openWeatherSuccess,
    },
    accuweather: {
      configured: hasAccuWeatherKey,
      working: accuWeatherSuccess,
    },
    recommendation: openWeatherSuccess
      ? "✅ OpenWeatherMap is working - use this in production"
      : accuWeatherSuccess
      ? "✅ AccuWeather is working - use this in production"
      : "❌ Neither API is working - check API keys and configuration",
  }

    return NextResponse.json(testResults, {
      status: openWeatherSuccess || accuWeatherSuccess ? 200 : 500,
    })
  } catch (error) {
    console.error("Test weather API error:", error)
    return NextResponse.json(
      {
        error: "Failed to run weather API tests",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

