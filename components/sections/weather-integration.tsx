"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Cloud, CloudRain, Sun, CloudSun, AlertTriangle, RefreshCw, Navigation } from "lucide-react"
import { getTranslation } from "@/lib/translations"

type WeatherData = {
  temperature: number
  condition: string
  humidity: number
  rainChance: number
  windSpeed: number
  location?: string
}

export default function WeatherIntegration({ language = "en", onWeatherUpdate }: { language?: string; onWeatherUpdate?: (data: WeatherData) => void }) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationName, setLocationName] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchWeather = async (useGeolocation: boolean = false) => {
    try {
      setLoading(true)
      setIsRefreshing(true)
      
      let locationToUse = ""
      
      if (useGeolocation && navigator.geolocation) {
        // Get current location
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            })
          })
          
          const { latitude, longitude } = position.coords
          
          // Get location name from coordinates
          try {
            const geoRes = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`)
            if (geoRes.ok) {
              const geoData = await geoRes.json()
              locationToUse = geoData.name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
              setLocationName(geoData.name || locationToUse)
            } else {
              locationToUse = `${latitude},${longitude}`
              setLocationName(locationToUse)
            }
          } catch (error) {
            locationToUse = `${latitude},${longitude}`
            setLocationName(locationToUse)
          }
        } catch (error) {
          console.error("Error getting location:", error)
          // Fallback to default location
          locationToUse = "Gorakhpur"
          setLocationName("Gorakhpur")
        }
      } else {
        // Use default location
        locationToUse = "Gorakhpur"
        setLocationName("Gorakhpur")
      }
      
      // Fetch weather using location
      const res = await fetch(`/api/weather?location=${encodeURIComponent(locationToUse)}`)
      if (res.ok) {
        const data = await res.json()
        const weatherData = { ...data, location: locationName || locationToUse }
        setWeather(weatherData)
        if (onWeatherUpdate) {
          onWeatherUpdate(weatherData)
        }
        // Dispatch event for other components
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("weatherUpdated", { detail: weatherData }))
        }
      } else {
        // Fallback to mock data
        const fallbackData = {
          temperature: 28,
          condition: "Partly Cloudy",
          humidity: 65,
          rainChance: 30,
          windSpeed: 12,
          location: locationName || locationToUse
        }
        setWeather(fallbackData)
      }
    } catch (error) {
      // Fallback to mock data on error
      const fallbackData = {
        temperature: 28,
        condition: "Partly Cloudy",
        humidity: 65,
        rainChance: 30,
        windSpeed: 12,
        location: locationName || "Gorakhpur"
      }
      setWeather(fallbackData)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Initial load without geolocation
    fetchWeather(false)
  }, [onWeatherUpdate])

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase()
    if (lower.includes("rain")) return <CloudRain className="w-6 h-6 text-blue-500" />
    if (lower.includes("cloud")) return <Cloud className="w-6 h-6 text-gray-500" />
    if (lower.includes("sun")) return <Sun className="w-6 h-6 text-yellow-500" />
    return <CloudSun className="w-6 h-6 text-gray-400" />
  }

  const getRainAdvice = (rainChance: number) => {
    if (rainChance > 70) {
      return language === "hi"
        ? "🌧️ आज बारिश की संभावना है - सिंचाई न करें"
        : "🌧️ Rain expected today - Skip irrigation"
    } else if (rainChance > 40) {
      return language === "hi"
        ? "☁️ आंशिक बारिश की संभावना - सिंचाई कम करें"
        : "☁️ Partial rain chance - Reduce irrigation"
    }
    return language === "hi"
      ? "☀️ बारिश की संभावना कम - सामान्य सिंचाई"
      : "☀️ Low rain chance - Normal irrigation"
  }

  if (loading || !weather) {
    return (
      <Card className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-2 border-sky-200 dark:border-sky-800">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-2 border-sky-200 dark:border-sky-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cloud className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>{language === "hi" ? "आज का मौसम" : "Today's Weather"}</span>
          </CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchWeather(true)}
            disabled={isRefreshing}
            className="h-8 w-8"
            title={language === "hi" ? "मौसम अपडेट करें" : "Refresh weather"}
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather.condition)}
            <div>
              <p className="text-2xl font-bold text-foreground">{weather.temperature}°C</p>
              <p className="text-xs text-muted-foreground">{weather.condition}</p>
              {locationName && (
                <p className="text-xs font-medium text-foreground mt-1">{locationName}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">{language === "hi" ? "आर्द्रता:" : "Humidity:"}</p>
            <p className="font-semibold">{weather.humidity}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">{language === "hi" ? "हवा की गति:" : "Wind:"}</p>
            <p className="font-semibold">{weather.windSpeed} km/h</p>
          </div>
        </div>

        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900 dark:text-blue-200 break-words">
              {getRainAdvice(weather.rainChance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

