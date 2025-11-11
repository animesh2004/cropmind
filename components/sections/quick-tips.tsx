"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react"
import { getTranslation } from "@/lib/translations"

type SensorData = {
  soilMoisture: number
  temperature: number
  humidity: number
  ph?: number
}

type WeatherData = {
  temperature: number
  condition: string
  humidity: number
  rainChance: number
  windSpeed: number
}

export default function QuickTips({ language = "en", sensorData, weatherData }: { language?: string; sensorData?: SensorData; weatherData?: WeatherData }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentData, setCurrentData] = useState<SensorData | null>(null)
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    // Listen for sensor data updates
    const handleSensorUpdate = (event: CustomEvent) => {
      const data = (event as CustomEvent<SensorData>).detail
      setCurrentData({
        soilMoisture: data.soilMoisture || 0,
        temperature: data.temperature || 0,
        humidity: data.humidity || 0,
        ph: data.ph
      })
    }

    if (sensorData) {
      setCurrentData(sensorData)
    }

    if (weatherData) {
      setCurrentWeather(weatherData)
    }

    // Listen for weather updates
    const handleWeatherUpdate = (event: CustomEvent) => {
      const data = (event as CustomEvent<WeatherData>).detail
      setCurrentWeather(data)
    }

    window.addEventListener("sensorDataUpdated", handleSensorUpdate as EventListener)
    window.addEventListener("weatherUpdated", handleWeatherUpdate as EventListener)
    return () => {
      window.removeEventListener("sensorDataUpdated", handleSensorUpdate as EventListener)
      window.removeEventListener("weatherUpdated", handleWeatherUpdate as EventListener)
    }
  }, [sensorData, weatherData])

  // Generate dynamic tips based on current conditions
  const generateDynamicTips = (): Array<{icon: string, title: string, tip: string}> => {
    const tips: Array<{icon: string, title: string, tip: string}> = []
    const data = currentData || sensorData

    if (!data) {
      // Default tips when no data available
      return [
        {
          icon: "💧",
          title: language === "hi" ? "सिंचाई का सही समय" : "Best Watering Time",
          tip: language === "hi" 
            ? "सुबह 6-8 बजे पानी दें - यह सबसे अच्छा समय है क्योंकि पानी जल्दी सोख लिया जाता है"
            : "Water between 6-8 AM - Best time as water is absorbed quickly"
        },
        {
          icon: "🌱",
          title: language === "hi" ? "मिट्टी की जांच" : "Check Soil Depth",
          tip: language === "hi"
            ? "पानी देने से पहले 2 इंच गहराई तक मिट्टी जांचें - अगर नम है तो पानी न दें"
            : "Check soil 2 inches deep before watering - Skip if still moist"
        }
      ]
    }

    // Tip 1: Based on moisture level
    if (data.soilMoisture < 20) {
      tips.push({
        icon: "🚨",
        title: language === "hi" ? "तत्काल सिंचाई आवश्यक" : "Immediate Irrigation Required",
        tip: language === "hi"
          ? `मिट्टी की नमी बहुत कम है (${data.soilMoisture.toFixed(1)}%)। तुरंत पानी दें - कम से कम 20-30 मिनट तक।`
          : `Soil moisture is very low (${data.soilMoisture.toFixed(1)}%). Water immediately for at least 20-30 minutes.`
      })
    } else if (data.soilMoisture < 30) {
      tips.push({
        icon: "⚠️",
        title: language === "hi" ? "सिंचाई की आवश्यकता" : "Irrigation Needed",
        tip: language === "hi"
          ? `मिट्टी की नमी कम है (${data.soilMoisture.toFixed(1)}%)। 2-4 घंटे के भीतर पानी दें।`
          : `Soil moisture is low (${data.soilMoisture.toFixed(1)}%). Water within 2-4 hours.`
      })
    } else if (data.soilMoisture >= 30 && data.soilMoisture <= 70) {
      tips.push({
        icon: "✅",
        title: language === "hi" ? "इष्टतम नमी स्तर" : "Optimal Moisture Level",
        tip: language === "hi"
          ? `मिट्टी की नमी इष्टतम है (${data.soilMoisture.toFixed(1)}%)। वर्तमान सिंचाई अनुसूची जारी रखें।`
          : `Soil moisture is optimal (${data.soilMoisture.toFixed(1)}%). Continue current irrigation schedule.`
      })
    } else {
      tips.push({
        icon: "💧",
        title: language === "hi" ? "अधिक नमी" : "High Moisture",
        tip: language === "hi"
          ? `मिट्टी की नमी अधिक है (${data.soilMoisture.toFixed(1)}%)। सिंचाई कम करें या बंद करें।`
          : `Soil moisture is high (${data.soilMoisture.toFixed(1)}%). Reduce or stop irrigation.`
      })
    }

    // Tip 2: Based on temperature
    if (data.temperature > 35) {
      tips.push({
        icon: "🌡️",
        title: language === "hi" ? "गर्मी से सुरक्षा" : "Heat Protection",
        tip: language === "hi"
          ? `तापमान बहुत गर्म है (${data.temperature.toFixed(1)}°C)। दिन में 2-3 बार पानी दें और छाया प्रदान करें।`
          : `Temperature is very hot (${data.temperature.toFixed(1)}°C). Water 2-3 times daily and provide shade.`
      })
    } else if (data.temperature < 10) {
      tips.push({
        icon: "❄️",
        title: language === "hi" ? "ठंड से सुरक्षा" : "Cold Protection",
        tip: language === "hi"
          ? `तापमान ठंडा है (${data.temperature.toFixed(1)}°C)। संवेदनशील फसलों को कवर करें।`
          : `Temperature is cold (${data.temperature.toFixed(1)}°C). Cover sensitive crops.`
      })
    } else {
      tips.push({
        icon: "✅",
        title: language === "hi" ? "इष्टतम तापमान" : "Optimal Temperature",
        tip: language === "hi"
          ? `तापमान इष्टतम है (${data.temperature.toFixed(1)}°C)। अधिकांश फसलों के लिए अच्छी स्थिति।`
          : `Temperature is optimal (${data.temperature.toFixed(1)}°C). Good conditions for most crops.`
      })
    }

    // Tip 3: Based on humidity
    if (data.humidity < 30) {
      tips.push({
        icon: "💨",
        title: language === "hi" ? "कम आर्द्रता" : "Low Humidity",
        tip: language === "hi"
          ? `आर्द्रता कम है (${data.humidity.toFixed(1)}%)। पानी देने की आवृत्ति बढ़ाएं।`
          : `Humidity is low (${data.humidity.toFixed(1)}%). Increase watering frequency.`
      })
    } else if (data.humidity > 80) {
      tips.push({
        icon: "⚠️",
        title: language === "hi" ? "उच्च आर्द्रता" : "High Humidity",
        tip: language === "hi"
          ? `आर्द्रता अधिक है (${data.humidity.toFixed(1)}%)। फंगल रोगों से सावधान रहें।`
          : `Humidity is high (${data.humidity.toFixed(1)}%). Be cautious of fungal diseases.`
      })
    } else {
      tips.push({
        icon: "✅",
        title: language === "hi" ? "इष्टतम आर्द्रता" : "Optimal Humidity",
        tip: language === "hi"
          ? `आर्द्रता इष्टतम है (${data.humidity.toFixed(1)}%)। अधिकांश फसलों के लिए आदर्श।`
          : `Humidity is optimal (${data.humidity.toFixed(1)}%). Ideal for most crops.`
      })
    }

    // Tip 4: Combined conditions
    if (data.soilMoisture < 30 && data.temperature > 30) {
      tips.push({
        icon: "🌡️💧",
        title: language === "hi" ? "शुष्क और गर्म" : "Dry and Hot",
        tip: language === "hi"
          ? "शुष्क और गर्म स्थितियाँ - दिन में 2-3 बार पानी दें और छाया प्रदान करें।"
          : "Dry and hot conditions - Water 2-3 times daily and provide shade."
      })
    }

    // Tip 5: Weather-based tips
    const weather = currentWeather || weatherData
    if (weather) {
      if (weather.rainChance > 70) {
        tips.push({
          icon: "🌧️",
          title: language === "hi" ? "बारिश की संभावना" : "Rain Expected",
          tip: language === "hi"
            ? `आज बारिश की उच्च संभावना है (${weather.rainChance}%)। सिंचाई न करें और पानी बचाएं।`
            : `High chance of rain today (${weather.rainChance}%). Skip irrigation and save water.`
        })
      } else if (weather.rainChance > 40) {
        tips.push({
          icon: "☁️",
          title: language === "hi" ? "आंशिक बारिश" : "Partial Rain",
          tip: language === "hi"
            ? `आंशिक बारिश की संभावना (${weather.rainChance}%)। सिंचाई कम करें।`
            : `Partial rain chance (${weather.rainChance}%). Reduce irrigation.`
        })
      } else {
        tips.push({
          icon: "☀️",
          title: language === "hi" ? "सूखा मौसम" : "Dry Weather",
          tip: language === "hi"
            ? `बारिश की संभावना कम (${weather.rainChance}%)। सामान्य सिंचाई जारी रखें।`
            : `Low rain chance (${weather.rainChance}%). Continue normal irrigation.`
        })
      }

      // Temperature comparison with weather
      if (weather.temperature && data.temperature) {
        const diff = Math.abs(weather.temperature - data.temperature)
        if (diff > 5) {
          tips.push({
            icon: "🌡️",
            title: language === "hi" ? "तापमान अंतर" : "Temperature Difference",
            tip: language === "hi"
              ? `मौसम का तापमान (${weather.temperature}°C) और मिट्टी का तापमान (${data.temperature.toFixed(1)}°C) में अंतर है। मौसम के अनुसार सिंचाई समायोजित करें।`
              : `Weather temperature (${weather.temperature}°C) differs from soil temperature (${data.temperature.toFixed(1)}°C). Adjust irrigation accordingly.`
          })
        }
      }
    }

    // Tip 6: General best practice
    tips.push({
      icon: "🌿",
      title: language === "hi" ? "मल्च का उपयोग" : "Use Mulch",
      tip: language === "hi"
        ? "मल्च लगाने से मिट्टी की नमी बनी रहती है और पानी की बचत होती है।"
        : "Apply mulch to retain soil moisture and save water."
    })

    return tips
  }

  const tips = generateDynamicTips()

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200 dark:border-yellow-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span>{language === "hi" ? "वर्तमान स्थिति के आधार पर युक्तियाँ" : "Quick Tips Based on Current Conditions"}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 space-y-3">
              {tips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50"
                >
                  <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground mb-1">{tip.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed break-words">{tip.tip}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
