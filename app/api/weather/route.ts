import { NextRequest, NextResponse } from "next/server"
import {
  getOpenWeatherApiKey,
  getAccuWeatherApiKey,
  hasOpenWeatherKey,
  hasAccuWeatherKey,
  hasAnyWeatherKey,
  OPENWEATHER_API_URL,
  ACCUWEATHER_API_URL,
  IS_PRODUCTION,
  getDeploymentPlatform,
} from "@/lib/ai"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get("location") || searchParams.get("q") // Location name (e.g., "Gorakhpur")
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")
    
    // Try OpenWeatherMap first (more reliable and free)
    // Get API keys from centralized config
    const openWeatherKey = getOpenWeatherApiKey()
    const accuWeatherKey = getAccuWeatherApiKey()
    
    // Validate API keys are not empty
    const hasOpenWeather = hasOpenWeatherKey()
    const hasAccuWeather = hasAccuWeatherKey()
    
    // Log in production for debugging (without exposing keys)
    if (process.env.NODE_ENV === "production") {
      console.log("Weather API - Environment check:", {
        hasOpenWeatherKey,
        hasAccuWeatherKey,
        openWeatherKeyLength: openWeatherKey.length,
        accuWeatherKeyLength: accuWeatherKey.length,
        envVarsAvailable: {
          OPENWEATHER_API_KEY: !!process.env.OPENWEATHER_API_KEY,
          NEXT_PUBLIC_OPENWEATHER_API_KEY: !!process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
          ACCUWEATHER_API_KEY: !!process.env.ACCUWEATHER_API_KEY,
        }
      })
    }
    
    // Try OpenWeatherMap API first (better free tier)
    if (hasOpenWeatherKey) {
      try {
        const openWeatherUrl = lat && lon
          ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherKey}&units=metric`
          : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location || "Gorakhpur")}&appid=${openWeatherKey}&units=metric`
        
        // Add timeout for OpenWeatherMap API
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const owResponse = await fetch(openWeatherUrl, {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "User-Agent": "CropMind/1.0",
          },
        })
        
        clearTimeout(timeoutId)
        
        if (owResponse.ok) {
          const owData = await owResponse.json()
          
          // Validate response has required data
          if (owData.main && owData.weather && owData.weather.length > 0) {
            // Map OpenWeatherMap data to our format
            const condition = owData.weather[0].main || "Unknown"
            const description = owData.weather[0].description || condition
            const temperature = owData.main.temp || 28
            const humidity = owData.main.humidity || 65
            const windSpeed = (owData.wind?.speed || 0) * 3.6 // Convert m/s to km/h
            
            // Calculate rain chance - use probability of precipitation if available, otherwise estimate from conditions
            let rainChance = 10
            if (owData.rain && (owData.rain["1h"] || owData.rain["3h"])) {
              // If rain data exists, high chance
              rainChance = 70
            } else if (condition.toLowerCase().includes("rain") || condition.toLowerCase().includes("drizzle")) {
              rainChance = 80
            } else if (condition.toLowerCase().includes("thunderstorm") || condition.toLowerCase().includes("storm")) {
              rainChance = 90
            } else if (owData.clouds?.all > 80) {
              rainChance = 60
            } else if (owData.clouds?.all > 60) {
              rainChance = 40
            } else if (owData.clouds?.all > 40) {
              rainChance = 25
            }
            
            return NextResponse.json({
              temperature: Math.round(temperature),
              condition: condition,
              humidity: humidity,
              rainChance: Math.round(rainChance),
              windSpeed: Math.round(windSpeed),
              description: description,
              location: owData.name || location || "Gorakhpur",
              source: "openweathermap"
            })
          } else {
            console.error("OpenWeatherMap: Invalid response structure", owData)
          }
        } else {
          const errorText = await owResponse.text().catch(() => "")
          const errorData = errorText ? (() => {
            try {
              return JSON.parse(errorText)
            } catch {
              return { message: errorText.substring(0, 200) }
            }
          })() : {}
          
          console.error("OpenWeatherMap API error:", {
            status: owResponse.status,
            statusText: owResponse.statusText,
            error: errorData.message || errorText.substring(0, 200),
            code: errorData.cod || errorData.code
          })
          
          // If it's an authentication error (401), don't try again
          if (owResponse.status === 401) {
            console.error("OpenWeatherMap API key is invalid or expired")
            // Continue to try AccuWeather
          }
          // Continue to try AccuWeather if OpenWeatherMap fails
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.error("OpenWeatherMap API timeout")
        } else {
          console.error("OpenWeatherMap fetch error:", error)
        }
        // Continue to try AccuWeather
      }
    }
    
    // Fallback to AccuWeather API if OpenWeatherMap fails or not configured
    // Only use AccuWeather if we have AccuWeather key (don't mix keys)
    if (!hasAccuWeatherKey && !hasOpenWeatherKey) {
      // Return mock data if no API key at all
      console.warn("No weather API key configured, returning mock data")
      return NextResponse.json({
        temperature: 28,
        condition: "Partly Cloudy",
        humidity: 65,
        rainChance: 30,
        windSpeed: 12,
        description: "Partly cloudy with light winds",
        _fallback: true,
        _error: "No API key configured. Please set OPENWEATHER_API_KEY or ACCUWEATHER_API_KEY environment variable."
      })
    }

    // AccuWeather requires location key first, then current conditions
    let locationKey: string | null = null
    let locationName = location || "Gorakhpur"
    
    // Step 1: Get location key from location name (AccuWeather)
    if (location && hasAccuWeatherKey) {
      try {
        const locationUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${accuWeatherKey}&q=${encodeURIComponent(location)}`
        // Add timeout for AccuWeather API
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const locationRes = await fetch(locationUrl, {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "User-Agent": "CropMind/1.0",
          },
        })
        
        clearTimeout(timeoutId)
        
        if (locationRes.ok) {
          const locationData = await locationRes.json()
          if (locationData && locationData.length > 0) {
            locationKey = locationData[0].Key
            locationName = locationData[0].LocalizedName || location
          } else {
            console.warn("AccuWeather: No location found for:", location)
          }
        } else {
          const errorText = await locationRes.text().catch(() => "")
          console.error("AccuWeather location search failed:", {
            status: locationRes.status,
            statusText: locationRes.statusText,
            error: errorText.substring(0, 200)
          })
          // If it's an authentication error (401), stop trying AccuWeather
          if (locationRes.status === 401) {
            console.error("AccuWeather API key is invalid or expired")
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.error("AccuWeather location search timeout")
        } else {
          console.error("AccuWeather location search error:", error)
        }
      }
    }
    
    // Step 2: If we have lat/lon, try to get location key from coordinates (AccuWeather)
    if (!locationKey && lat && lon && hasAccuWeatherKey) {
      try {
        const geoUrl = `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${accuWeatherKey}&q=${lat},${lon}`
        // Add timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const geoRes = await fetch(geoUrl, {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "User-Agent": "CropMind/1.0",
          },
        })
        
        clearTimeout(timeoutId)
        
        if (geoRes.ok) {
          const geoData = await geoRes.json()
          if (geoData && geoData.Key) {
            locationKey = geoData.Key
            locationName = geoData.LocalizedName || `${lat},${lon}`
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.error("AccuWeather geocode timeout")
        } else {
          console.error("AccuWeather geocode error:", error)
        }
      }
    }
    
    // Step 3: If still no location key, try default (Delhi) - AccuWeather
    if (!locationKey && hasAccuWeatherKey) {
      try {
        const defaultUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${accuWeatherKey}&q=Delhi,IN`
        // Add timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const defaultRes = await fetch(defaultUrl, {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "User-Agent": "CropMind/1.0",
          },
        })
        
        clearTimeout(timeoutId)
        
        if (defaultRes.ok) {
          const defaultData = await defaultRes.json()
          if (defaultData && defaultData.length > 0) {
            locationKey = defaultData[0].Key
            locationName = "Delhi"
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.error("AccuWeather default location timeout")
        } else {
          console.error("AccuWeather default location error:", error)
        }
      }
    }
    
    // Step 4: Get current conditions using location key (AccuWeather)
    if (locationKey && hasAccuWeatherKey) {
      try {
        const conditionsUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${accuWeatherKey}&details=true`
        // Add timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(conditionsUrl, {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "User-Agent": "CropMind/1.0",
          },
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          
          if (data && data.length > 0) {
            const weather = data[0]
            
            // Map AccuWeather data to our format
            const condition = weather.WeatherText || "Unknown"
            const temperature = weather.Temperature?.Metric?.Value || weather.Temperature?.Imperial?.Value || 28
            const humidity = weather.RelativeHumidity || 65
            const windSpeed = weather.Wind?.Speed?.Metric?.Value || weather.Wind?.Speed?.Imperial?.Value || 12
            
            // Calculate rain chance from precipitation
            let rainChance = 10
            if (weather.HasPrecipitation) {
              rainChance = 70
            } else if (weather.CloudCover > 70) {
              rainChance = 50
            } else if (weather.CloudCover > 40) {
              rainChance = 30
            }

            return NextResponse.json({
              temperature: Math.round(temperature),
              condition: condition,
              humidity: humidity,
              rainChance: Math.round(rainChance),
              windSpeed: Math.round(windSpeed),
              description: weather.WeatherText || condition,
              location: locationName,
              source: "accuweather"
            })
          }
        } else {
          const errorText = await response.text().catch(() => "")
          console.error("AccuWeather conditions API error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorText.substring(0, 200)
          })
          // If it's an authentication error (401), log it
          if (response.status === 401) {
            console.error("AccuWeather API key is invalid or expired")
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.error("AccuWeather conditions fetch timeout")
        } else {
          console.error("AccuWeather conditions fetch error:", error)
        }
      }
    }
    
    // Final fallback: Return mock data with error info
    console.warn("All weather APIs failed, returning mock data", {
      hasOpenWeatherKey,
      hasAccuWeatherKey,
      location: location || "Gorakhpur",
      nodeEnv: process.env.NODE_ENV
    })
    
    const errorMessage = !hasOpenWeatherKey && !hasAccuWeatherKey
      ? "Weather API keys not configured in production. IMPORTANT: .env.local files are NOT deployed. You must set environment variables in your deployment platform (Vercel/Netlify/etc). Go to: Settings > Environment Variables and add ACCUWEATHER_API_KEY with your API key value. See DEPLOYMENT_WEATHER_API_SETUP.md for details."
      : hasAccuWeatherKey && !hasOpenWeatherKey
      ? "AccuWeather API key is configured but API call failed. Check network connectivity or API key validity."
      : "Weather API unavailable. Check API keys and network connectivity."
    
    return NextResponse.json({
      temperature: 28,
      condition: "Partly Cloudy",
      humidity: 65,
      rainChance: 30,
      windSpeed: 12,
      description: "Partly cloudy with light winds",
      location: location || "Gorakhpur",
      _fallback: true,
      _error: errorMessage,
      _debug: {
        hasOpenWeatherKey: hasOpenWeatherKey,
        hasAccuWeatherKey: hasAccuWeatherKey,
        openWeatherKeyLength: openWeatherKey.length,
        accuWeatherKeyLength: accuWeatherKey.length,
        location: location || "Gorakhpur",
        nodeEnv: process.env.NODE_ENV,
        envVarsChecked: [
          "OPENWEATHER_API_KEY",
          "NEXT_PUBLIC_OPENWEATHER_API_KEY",
          "ACCUWEATHER_API_KEY"
        ],
        deploymentNote: "If this is production, ensure environment variables are set in your deployment platform (Vercel/Netlify/etc). .env.local files are NOT deployed."
      }
    })
  } catch (error) {
    // Log error for debugging
    console.error("Weather API error:", error)
    
    // Return mock data on error
    return NextResponse.json({
      temperature: 28,
      condition: "Partly Cloudy",
      humidity: 65,
      rainChance: 30,
      windSpeed: 12,
      description: "Partly cloudy with light winds",
      _fallback: true,
      _error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
