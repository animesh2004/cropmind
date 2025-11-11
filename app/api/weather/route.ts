import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get("location") || searchParams.get("q") // Location name (e.g., "Gorakhpur")
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")
    
    // Using AccuWeather API
    const apiKey = process.env.OPENWEATHER_API_KEY || "" // Reusing env var name for compatibility
    
    if (!apiKey) {
      // Return mock data if no API key
      return NextResponse.json({
        temperature: 28,
        condition: "Partly Cloudy",
        humidity: 65,
        rainChance: 30,
        windSpeed: 12,
        description: "Partly cloudy with light winds"
      })
    }

    // AccuWeather requires location key first, then current conditions
    let locationKey: string | null = null
    let locationName = location || "Gorakhpur"
    
    // Step 1: Get location key from location name
    if (location) {
      try {
        const locationUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${encodeURIComponent(location)}`
        const locationRes = await fetch(locationUrl, {
          cache: "no-store",
          headers: {
            "User-Agent": "CropMind/1.0",
          },
        })
        
        if (locationRes.ok) {
          const locationData = await locationRes.json()
          if (locationData && locationData.length > 0) {
            locationKey = locationData[0].Key
            locationName = locationData[0].LocalizedName || location
          }
        }
      } catch (error) {
        console.error("AccuWeather location search error:", error)
      }
    }
    
    // Step 2: If we have lat/lon, try to get location key from coordinates
    if (!locationKey && lat && lon) {
      try {
        const geoUrl = `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${apiKey}&q=${lat},${lon}`
        const geoRes = await fetch(geoUrl, {
          cache: "no-store",
          headers: {
            "User-Agent": "CropMind/1.0",
          },
        })
        
        if (geoRes.ok) {
          const geoData = await geoRes.json()
          if (geoData && geoData.Key) {
            locationKey = geoData.Key
            locationName = geoData.LocalizedName || `${lat},${lon}`
          }
        }
      } catch (error) {
        console.error("AccuWeather geocode error:", error)
      }
    }
    
    // Step 3: If still no location key, try default (Delhi)
    if (!locationKey) {
      try {
        const defaultUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=Delhi,IN`
        const defaultRes = await fetch(defaultUrl, {
          cache: "no-store",
          headers: {
            "User-Agent": "CropMind/1.0",
          },
        })
        
        if (defaultRes.ok) {
          const defaultData = await defaultRes.json()
          if (defaultData && defaultData.length > 0) {
            locationKey = defaultData[0].Key
            locationName = "Delhi"
          }
        }
      } catch (error) {
        console.error("AccuWeather default location error:", error)
      }
    }
    
    // Step 4: Get current conditions using location key
    if (!locationKey) {
      // Fallback to mock data if we can't get location key
      console.error("Could not get location key from AccuWeather")
      return NextResponse.json({
        temperature: 28,
        condition: "Partly Cloudy",
        humidity: 65,
        rainChance: 30,
        windSpeed: 12,
        description: "Partly cloudy with light winds",
        _fallback: true,
        _error: "Could not get location key"
      })
    }
    
    const conditionsUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}&details=true`
    const response = await fetch(conditionsUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "CropMind/1.0",
      },
    })
    
    if (!response.ok) {
      // Log error for debugging
      const errorData = await response.json().catch(() => ({}))
      console.error("AccuWeather API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        locationKey
      })
      
      // Fallback to mock data
      return NextResponse.json({
        temperature: 28,
        condition: "Partly Cloudy",
        humidity: 65,
        rainChance: 30,
        windSpeed: 12,
        description: "Partly cloudy with light winds",
        _fallback: true,
        _error: response.status === 401 ? "Invalid API key" : `API error: ${response.status}`
      })
    }

    const data = await response.json()
    
    if (!data || data.length === 0) {
      return NextResponse.json({
        temperature: 28,
        condition: "Partly Cloudy",
        humidity: 65,
        rainChance: 30,
        windSpeed: 12,
        description: "Partly cloudy with light winds",
        _fallback: true,
        _error: "No weather data returned"
      })
    }
    
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
      location: locationName
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
