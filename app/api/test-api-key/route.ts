import { NextRequest, NextResponse } from "next/server"

/**
 * Test API Key Endpoint
 * Tests a specific API key to see if it works with OpenWeatherMap or AccuWeather
 * Usage: /api/test-api-key?key=YOUR_API_KEY
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const apiKey = searchParams.get("key") || ""
    const location = searchParams.get("location") || "Delhi"
    
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "API key is required",
          usage: "Add ?key=YOUR_API_KEY to the URL",
        },
        { status: 400 }
      )
    }
    
    const trimmedKey = apiKey.trim()
    const results: any = {
      apiKey: trimmedKey.substring(0, 8) + "..." + trimmedKey.substring(trimmedKey.length - 4), // Show only first 8 and last 4 chars
      keyLength: trimmedKey.length,
      location,
      timestamp: new Date().toISOString(),
      tests: {},
    }
    
    // Test 1: OpenWeatherMap
    results.tests.openweathermap = {
      status: "testing",
      error: null,
      data: null,
    }
    
    try {
      const startTime = Date.now()
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${trimmedKey}&units=metric`
      
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent": "CropMind/1.0",
        },
        signal: AbortSignal.timeout(10000),
      })
      
      const responseTime = Date.now() - startTime
      const responseText = await response.text()
      
      if (response.ok) {
        const data = JSON.parse(responseText)
        results.tests.openweathermap = {
          status: "success",
          valid: true,
          responseTime: `${responseTime}ms`,
          data: {
            temperature: data.main?.temp,
            condition: data.weather?.[0]?.main,
            location: data.name,
            country: data.sys?.country,
          },
        }
      } else {
        const errorData = (() => {
          try {
            return JSON.parse(responseText)
          } catch {
            return { message: responseText }
          }
        })()
        
        results.tests.openweathermap = {
          status: "failed",
          valid: false,
          httpStatus: response.status,
          error: errorData.message || errorData.cod || `HTTP ${response.status}`,
          responseTime: `${responseTime}ms`,
        }
      }
    } catch (error: any) {
      results.tests.openweathermap = {
        status: "error",
        valid: false,
        error: error.name === "AbortError" ? "Request timeout (10s)" : error.message,
      }
    }
    
    // Test 2: AccuWeather
    results.tests.accuweather = {
      status: "testing",
      error: null,
      data: null,
    }
    
    try {
      const startTime = Date.now()
      const locationUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${trimmedKey}&q=${encodeURIComponent(location)}`
      
      const locationResponse = await fetch(locationUrl, {
        cache: "no-store",
        headers: {
          "User-Agent": "CropMind/1.0",
        },
        signal: AbortSignal.timeout(10000),
      })
      
      const locationResponseTime = Date.now() - startTime
      const locationResponseText = await locationResponse.text()
      
      if (locationResponse.ok) {
        const locationData = JSON.parse(locationResponseText)
        
        if (locationData && locationData.length > 0) {
          const locationKey = locationData[0].Key
          const locationName = locationData[0].LocalizedName || location
          
          // Get weather conditions
          const conditionsUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${trimmedKey}&details=true`
          const conditionsResponse = await fetch(conditionsUrl, {
            cache: "no-store",
            headers: {
              "User-Agent": "CropMind/1.0",
            },
            signal: AbortSignal.timeout(10000),
          })
          
          const totalResponseTime = Date.now() - startTime
          
          if (conditionsResponse.ok) {
            const conditionsData = await conditionsResponse.json()
            
            if (conditionsData && conditionsData.length > 0) {
              const weather = conditionsData[0]
              results.tests.accuweather = {
                status: "success",
                valid: true,
                responseTime: `${totalResponseTime}ms`,
                data: {
                  temperature: weather.Temperature?.Metric?.Value,
                  condition: weather.WeatherText,
                  humidity: weather.RelativeHumidity,
                  location: locationName,
                },
              }
            } else {
              results.tests.accuweather = {
                status: "failed",
                valid: false,
                error: "No weather data returned",
                responseTime: `${totalResponseTime}ms`,
              }
            }
          } else {
            const errorText = await conditionsResponse.text().catch(() => "")
            const errorData = (() => {
              try {
                return JSON.parse(errorText)
              } catch {
                return { Message: errorText }
              }
            })()
            
            results.tests.accuweather = {
              status: "failed",
              valid: false,
              httpStatus: conditionsResponse.status,
              error: errorData.Message || errorData.Code || `HTTP ${conditionsResponse.status}`,
              responseTime: `${totalResponseTime}ms`,
            }
          }
        } else {
          results.tests.accuweather = {
            status: "failed",
            valid: false,
            error: `Location "${location}" not found`,
            responseTime: `${locationResponseTime}ms`,
          }
        }
      } else {
        const errorData = (() => {
          try {
            return JSON.parse(locationResponseText)
          } catch {
            return { Message: locationResponseText }
          }
        })()
        
        results.tests.accuweather = {
          status: "failed",
          valid: false,
          httpStatus: locationResponse.status,
          error: errorData.Message || errorData.Code || `HTTP ${locationResponse.status}`,
          responseTime: `${locationResponseTime}ms`,
        }
      }
    } catch (error: any) {
      results.tests.accuweather = {
        status: "error",
        valid: false,
        error: error.name === "AbortError" ? "Request timeout (10s)" : error.message,
      }
    }
    
    // Summary
    const openWeatherValid = results.tests.openweathermap.valid === true
    const accuWeatherValid = results.tests.accuweather.valid === true
    
    results.summary = {
      isValid: openWeatherValid || accuWeatherValid,
      service: openWeatherValid ? "OpenWeatherMap" : accuWeatherValid ? "AccuWeather" : "None",
      message: openWeatherValid
        ? "✅ API key is VALID for OpenWeatherMap"
        : accuWeatherValid
        ? "✅ API key is VALID for AccuWeather"
        : "❌ API key is INVALID for both services",
    }
    
    return NextResponse.json(results, {
      status: openWeatherValid || accuWeatherValid ? 200 : 401,
    })
  } catch (error) {
    console.error("Test API key error:", error)
    return NextResponse.json(
      {
        error: "Failed to test API key",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

