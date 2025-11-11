import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get("location") || searchParams.get("q") // Location name (e.g., "Gorakhpur")
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")
    
    // Try OpenWeatherMap first (more reliable and free)
    const openWeatherKey = process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ""
    const accuWeatherKey = process.env.ACCUWEATHER_API_KEY || ""
    
    // Try OpenWeatherMap API first (better free tier)
    if (openWeatherKey) {
      try {
        const openWeatherUrl = lat && lon
          ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherKey}&units=metric`
          : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location || "Gorakhpur")}&appid=${openWeatherKey}&units=metric`
        
        const owResponse = await fetch(openWeatherUrl, {
          cache: "no-store",
          headers: {
            "User-Agent": "CropMind/1.0",
          },
        })
        
        if (owResponse.ok) {
          const owData = await owResponse.json()
          
          // Map OpenWeatherMap data to our format
          const condition = owData.weather?.[0]?.main || "Unknown"
          const description = owData.weather?.[0]?.description || condition
          const temperature = owData.main?.temp || 28
          const humidity = owData.main?.humidity || 65
          const windSpeed = (owData.wind?.speed || 0) * 3.6 // Convert m/s to km/h
          const rainChance = owData.rain ? 70 : (owData.clouds?.all > 70 ? 50 : owData.clouds?.all > 40 ? 30 : 10)
          
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
          console.error("OpenWeatherMap API error:", owResponse.status, await owResponse.text().catch(() => ""))
        }
      } catch (error) {
        console.error("OpenWeatherMap fetch error:", error)
        // Continue to try AccuWeather
      }
    }
    
    // Fallback to AccuWeather API if OpenWeatherMap fails or not configured
    const apiKey = accuWeatherKey || openWeatherKey // Use AccuWeather key if available
    
    if (!apiKey) {
      // Return mock data if no API key
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
    if (location && accuWeatherKey) {
      try {
        const locationUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${accuWeatherKey}&q=${encodeURIComponent(location)}`
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
          } else {
            console.warn("AccuWeather: No location found for:", location)
          }
        } else {
          const errorText = await locationRes.text().catch(() => "")
          console.error("AccuWeather location search failed:", locationRes.status, errorText)
        }
      } catch (error) {
        console.error("AccuWeather location search error:", error)
      }
    }
    
    // Step 2: If we have lat/lon, try to get location key from coordinates (AccuWeather)
    if (!locationKey && lat && lon && accuWeatherKey) {
      try {
        const geoUrl = `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${accuWeatherKey}&q=${lat},${lon}`
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
    
    // Step 3: If still no location key, try default (Delhi) - AccuWeather
    if (!locationKey && accuWeatherKey) {
      try {
        const defaultUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${accuWeatherKey}&q=Delhi,IN`
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
    
    // Step 4: Get current conditions using location key (AccuWeather)
    if (locationKey && accuWeatherKey) {
      try {
        const conditionsUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${accuWeatherKey}&details=true`
        const response = await fetch(conditionsUrl, {
          cache: "no-store",
          headers: {
            "User-Agent": "CropMind/1.0",
          },
        })
        
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
          console.error("AccuWeather conditions API error:", response.status, errorText)
        }
      } catch (error) {
        console.error("AccuWeather conditions fetch error:", error)
      }
    }
    
    // Final fallback: Return mock data with error info
    console.warn("All weather APIs failed, returning mock data")
    return NextResponse.json({
      temperature: 28,
      condition: "Partly Cloudy",
      humidity: 65,
      rainChance: 30,
      windSpeed: 12,
      description: "Partly cloudy with light winds",
      location: location || "Gorakhpur",
      _fallback: true,
      _error: "Weather API unavailable. Please check API keys: OPENWEATHER_API_KEY or ACCUWEATHER_API_KEY",
      _debug: {
        hasOpenWeatherKey: !!openWeatherKey,
        hasAccuWeatherKey: !!accuWeatherKey,
        location: location || "Gorakhpur"
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
