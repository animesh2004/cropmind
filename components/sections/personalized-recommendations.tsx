"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Droplet, Thermometer, Wind, Zap, CheckCircle2, TrendingUp } from "lucide-react"
import { findBestCrop, getCropData, CROP_DATABASE } from "@/lib/crop-data"
import { getTranslation } from "@/lib/translations"

type RecommendationResponse = {
  recommendations: string[]
  confidence?: number
  source?: string
  crop?: string
  soilType?: string
  npkRatio?: string
  fertilizer?: string
  irrigationSchedule?: string
  conditionMatch?: string
  matchCount?: number
  idealConditions?: {
    moisture: string
    temperature: string
    humidity: string
  }
}

export default function PersonalizedRecommendations({ language = "en" }: { language?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null)
  const [values, setValues] = useState({
    moisture: "55.3",
    temperature: "24.5",
    humidity: "62.1",
  })
  const [currentLanguage, setCurrentLanguage] = useState(language)

  useEffect(() => {
    // Update current language when prop changes
    setCurrentLanguage(language)

    // Listen for language changes from profile
    const handleLanguageChange = (event: CustomEvent) => {
      const newLang = (event as CustomEvent<{ language: string }>).detail.language
      setCurrentLanguage(newLang)
    }

    window.addEventListener("languageChanged", handleLanguageChange as EventListener)

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChange as EventListener)
    }
  }, [language])

  // Auto-fetch current sensor values and listen for updates
  useEffect(() => {
    const fetchCurrentValues = async () => {
      try {
        const token = localStorage.getItem("cropMind_blynkToken")
        const url = token ? `/api/sensors?token=${encodeURIComponent(token)}` : "/api/sensors"
        const res = await fetch(url, { cache: "no-store" })
        if (res.ok) {
          const data = (await res.json()) as {
            soilMoisture: number
            temperature: number
            humidity: number
          }
          setValues({
            moisture: data.soilMoisture.toFixed(1),
            temperature: data.temperature.toFixed(1),
            humidity: data.humidity.toFixed(1),
          })
        }
      } catch (e) {
        // Silently fail - use default values
      }
    }

    // Listen for sensor data updates from environmental monitoring
    const handleSensorUpdate = (event: CustomEvent) => {
      const data = (event as CustomEvent<{
        soilMoisture: number
        temperature: number
        humidity: number
      }>).detail
      setValues({
        moisture: data.soilMoisture.toFixed(1),
        temperature: data.temperature.toFixed(1),
        humidity: data.humidity.toFixed(1),
      })
    }

    // Initial fetch
    fetchCurrentValues()

    // Listen for updates from environmental monitoring
    window.addEventListener("sensorDataUpdated", handleSensorUpdate as EventListener)

    // Also refresh every 10 seconds to stay in sync
    const interval = setInterval(fetchCurrentValues, 10000)

    return () => {
      clearInterval(interval)
      window.removeEventListener("sensorDataUpdated", handleSensorUpdate as EventListener)
    }
  }, [])

  // Validate conditions before getting recommendations
  const validateConditions = (moisture: number, temperature: number, humidity: number): { valid: boolean; message: string } => {
    // Critical: Zero or negative soil moisture
    if (moisture <= 0) {
      return {
        valid: false,
        message: "🚨 CRITICAL ALERT: Soil moisture is 0% or below. This is impossible for plant growth! Please check your soil moisture sensor immediately. No crop can survive without water. Immediate irrigation required if this reading is accurate.",
      }
    }

    // Critical: Extremely low soil moisture
    if (moisture < 5) {
      return {
        valid: false,
        message: "🚨 CRITICAL ALERT: Soil moisture is critically low (" + moisture.toFixed(1) + "%). Plants cannot survive at this level. Immediate irrigation is required within the next hour to prevent crop failure. Check sensor if reading seems incorrect.",
      }
    }

    // Warning: Very low soil moisture
    if (moisture < 20) {
      return {
        valid: true,
        message: "⚠️ WARNING: Soil moisture is very low (" + moisture.toFixed(1) + "%). Most crops require at least 30-40% moisture for healthy growth. Schedule irrigation immediately (within 2-4 hours) to prevent crop stress.",
      }
    }

    // Critical: Extreme temperatures
    if (temperature > 50 || temperature < -10) {
      return {
        valid: false,
        message: "🚨 CRITICAL ALERT: Temperature reading is extreme (" + temperature.toFixed(1) + "°C). This is outside the survival range for all crops. Please verify your temperature sensor is functioning correctly.",
      }
    }

    // Critical: Freezing temperatures
    if (temperature < 0) {
      return {
        valid: false,
        message: "🚨 CRITICAL ALERT: Freezing temperatures detected (" + temperature.toFixed(1) + "°C). Most crops cannot survive freezing conditions. Immediate protective measures required: use row covers, greenhouse protection, or consider crop varieties suitable for cold climates.",
      }
    }

    // Critical: Extreme heat
    if (temperature > 45) {
      return {
        valid: false,
        message: "🚨 CRITICAL ALERT: Extreme heat detected (" + temperature.toFixed(1) + "°C). This temperature will cause severe crop damage. Implement emergency cooling measures: shade nets, increased irrigation frequency (3-4 times daily), and consider heat-tolerant crop varieties only.",
      }
    }

    // Invalid humidity
    if (humidity < 0 || humidity > 100) {
      return {
        valid: false,
        message: "⚠️ WARNING: Humidity reading is invalid (" + humidity.toFixed(1) + "%). Humidity must be between 0-100%. Please check your humidity sensor.",
      }
    }

    return { valid: true, message: "" }
  }

  const handleGetRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)
      setRecommendations(null)

      const moisture = Number(values.moisture)
      const temperature = Number(values.temperature)
      const humidity = Number(values.humidity)

      // Validate conditions first
      const validation = validateConditions(moisture, temperature, humidity)

      if (!validation.valid) {
        setError(validation.message)
        setLoading(false)
        return
      }

      // Show warning if applicable
      if (validation.message) {
        setError(validation.message)
      }

      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moisture: moisture,
          temperature: temperature,
          humidity: humidity,
        }),
      })
      if (!res.ok) throw new Error("Failed to get recommendations")
      const json = (await res.json()) as RecommendationResponse

      // Enhance response with crop recommendation and details
      const enhanced = enhanceRecommendations(json, {
        moisture: moisture,
        temperature: temperature,
        humidity: humidity,
      })

      setRecommendations(enhanced)
      
      // Wait 2 seconds after data is updated before hiding loading
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (e) {
      setError("Failed to get recommendations. Please try again.")
      // Wait 2 seconds even on error
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } finally {
      setLoading(false)
    }
  }

  // Enhance recommendations with crop and detailed parameters
  // Now uses the complete Kaggle dataset with 22+ crops and data_core.csv dataset
  const enhanceRecommendations = (
    data: RecommendationResponse,
    conditions: { moisture: number; temperature: number; humidity: number }
  ): RecommendationResponse => {
    // If dataset source, use dataset data directly
    if (data.source === "dataset" && data.crop && data.soilType && data.fertilizer) {
      const crop = data.crop
      const cropData = getCropData(crop)
      
      // Use dataset fertilizer as NPK ratio
      const npkRatio = data.fertilizer || (cropData ? cropData.npkRatio : "80-40-40")
      
      // Determine irrigation schedule from crop data
      const irrigationSchedule = cropData 
        ? cropData.irrigationSchedule 
        : determineIrrigationSchedule(crop, conditions.moisture, conditions.temperature)
      
      // Determine condition match
      const conditionMatch = determineConditionMatch(conditions)
      
      // Ideal conditions from crop data
      const idealConditions = cropData
        ? {
            moisture: `${cropData.moisture.min}-${cropData.moisture.max}%`,
            temperature: `${cropData.temperature.min}-${cropData.temperature.max}°C`,
            humidity: `${cropData.humidity.min}-${cropData.humidity.max}%`,
          }
        : {
            moisture: getIdealMoisture(crop),
            temperature: getIdealTemperature(crop),
            humidity: getIdealHumidity(crop),
          }

      return {
        ...data,
        crop,
        soilType: data.soilType,
        npkRatio,
        fertilizer: data.fertilizer,
        irrigationSchedule,
        conditionMatch,
        idealConditions,
      }
    }

    // Fallback to Kaggle dataset logic
    // Determine recommended crop based on conditions using Kaggle dataset
    const crop = determineCrop(conditions)
    const cropData = getCropData(crop)
    
    // Determine soil type from crop data
    const soilType = cropData ? cropData.soilType : determineSoilType(crop)
    
    // Determine NPK ratio from crop data
    const npkRatio = cropData ? cropData.npkRatio : determineNPKRatio(crop)
    
    // Determine irrigation schedule from crop data
    const irrigationSchedule = cropData 
      ? cropData.irrigationSchedule 
      : determineIrrigationSchedule(crop, conditions.moisture, conditions.temperature)
    
    // Determine condition match
    const conditionMatch = determineConditionMatch(conditions)
    
    // Ideal conditions from crop data
    const idealConditions = cropData
      ? {
          moisture: `${cropData.moisture.min}-${cropData.moisture.max}%`,
          temperature: `${cropData.temperature.min}-${cropData.temperature.max}°C`,
          humidity: `${cropData.humidity.min}-${cropData.humidity.max}%`,
        }
      : {
          moisture: getIdealMoisture(crop),
          temperature: getIdealTemperature(crop),
          humidity: getIdealHumidity(crop),
        }

    return {
      ...data,
      crop,
      soilType,
      npkRatio,
      irrigationSchedule,
      conditionMatch,
      idealConditions,
    }
  }

  // Determine crop based on conditions using scoring system
  // Now uses the complete Kaggle dataset with 22+ crops
  const determineCrop = (conditions: { moisture: number; temperature: number; humidity: number }): string => {
    const { moisture, temperature, humidity } = conditions
    const result = findBestCrop(moisture, temperature, humidity)
    return result.crop.name
  }

  const determineSoilType = (crop: string): string => {
    const cropData = getCropData(crop)
    return cropData?.soilType || "Loamy Soil"
  }

  const determineNPKRatio = (crop: string): string => {
    const cropData = getCropData(crop)
    return cropData?.npkRatio || "80-40-40"
  }

  const determineIrrigationSchedule = (crop: string, moisture: number, temperature: number): string => {
    const cropData = getCropData(crop)
    if (cropData) {
      return cropData.irrigationSchedule
    }
    // Fallback logic
    if (moisture < 40) {
      return "Frequent - Every 1-2 days"
    }
    if (moisture > 70) {
      return "Minimal - Every 5-7 days"
    }
    if (temperature > 30) {
      return "Moderate - Every 2-3 days"
    }
    return "Moderate - Every 2-3 days"
  }

  const determineConditionMatch = (conditions: { moisture: number; temperature: number; humidity: number }): string => {
    const { moisture, temperature, humidity } = conditions
    const optimalMoisture = moisture >= 50 && moisture <= 70
    const optimalTemp = temperature >= 15 && temperature <= 28
    const optimalHumidity = humidity >= 50 && humidity <= 75

    if (optimalMoisture && optimalTemp && optimalHumidity) {
      return "Optimal"
    }
    if (optimalMoisture && optimalTemp) {
      return "Good"
    }
    if (optimalMoisture || optimalTemp || optimalHumidity) {
      return "Fair"
    }
    return "Needs Improvement"
  }

  // Helper functions with fallback to crop database
  const getIdealMoisture = (crop: string): string => {
    const cropData = getCropData(crop)
    if (cropData) {
      return `${cropData.moisture.min}-${cropData.moisture.max}%`
    }
    return "50-70%"
  }

  const getIdealTemperature = (crop: string): string => {
    const cropData = getCropData(crop)
    if (cropData) {
      return `${cropData.temperature.min}-${cropData.temperature.max}°C`
    }
    return "15-28°C"
  }

  const getIdealHumidity = (crop: string): string => {
    const cropData = getCropData(crop)
    if (cropData) {
      return `${cropData.humidity.min}-${cropData.humidity.max}%`
    }
    return "50-70%"
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut", delay: 0.2 }}
      className="bg-gradient-to-br from-card via-card/50 to-card border border-border/50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          >
            <TrendingUp className="w-6 h-6 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {getTranslation("recommendation.title", currentLanguage)}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">{getTranslation("recommendation.description", currentLanguage)}</p>
      </div>

      {/* Input Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <label className="block text-sm font-medium text-foreground mb-2">{getTranslation("recommendation.input.soilMoisture", currentLanguage)}</label>
          <div className="relative">
            <Droplet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
          <Input
            type="number"
            value={values.moisture}
            onChange={(e) => setValues({ ...values, moisture: e.target.value })}
              className="bg-input border-blue-200 pl-10"
            disabled
          />
          </div>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-foreground mb-2">{getTranslation("recommendation.input.temperature", currentLanguage)}</label>
          <div className="relative">
            <Thermometer className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
          <Input
            type="number"
            value={values.temperature}
            onChange={(e) => setValues({ ...values, temperature: e.target.value })}
              className="bg-input border-red-200 pl-10"
            disabled
          />
          </div>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-foreground mb-2">{getTranslation("recommendation.input.humidity", currentLanguage)}</label>
          <div className="relative">
            <Wind className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
          <Input
            type="number"
            value={values.humidity}
            onChange={(e) => setValues({ ...values, humidity: e.target.value })}
              className="bg-input border-green-200 pl-10"
            disabled
          />
          </div>
        </div>
      </div>

      {/* Get Recommendations Button */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mb-6">
        <Button
          onClick={handleGetRecommendations}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold text-lg py-7 shadow-lg hover:shadow-xl transition-all duration-300"
          disabled={loading}
          size="lg"
        >
          <Zap className="w-6 h-6 mr-2" />
                {loading ? getTranslation("button.analyzing", currentLanguage) : getTranslation("button.getRecommendations", currentLanguage)}
        </Button>
      </motion.div>

      {/* Error/Warning Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-4 rounded-lg text-sm ${
            error.includes("CRITICAL ALERT") || error.includes("impossible")
              ? "bg-red-100 dark:bg-red-900/20 border-2 border-red-500 text-red-800 dark:text-red-200"
              : error.includes("WARNING")
                ? "bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-500 text-yellow-800 dark:text-yellow-200"
                : "bg-destructive/10 border border-destructive text-destructive"
          }`}
        >
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              {error.includes("CRITICAL ALERT") ? (
                <span className="text-2xl">🚨</span>
              ) : error.includes("WARNING") ? (
                <span className="text-2xl">⚠️</span>
              ) : null}
            </div>
            <div className="flex-1">
              <p className="font-semibold mb-1">
                {error.includes("CRITICAL ALERT") ? getTranslation("alert.critical", currentLanguage) : error.includes("WARNING") ? getTranslation("alert.warning", currentLanguage) : getTranslation("alert.error", currentLanguage)}
              </p>
              <p className="whitespace-pre-line leading-relaxed">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations Output */}
      {recommendations && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Recommended Crop */}
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{getTranslation("recommendation.crop", currentLanguage)}</p>
                <h3 className="text-2xl font-bold text-foreground">{recommendations.crop || "Wheat"}</h3>
              </div>
            </div>
            {recommendations.confidence && (
              <Badge className="bg-green-500 text-white px-4 py-2 text-sm font-semibold">
                {Math.round(recommendations.confidence * 100)}% {getTranslation("recommendation.confidenceLabel", currentLanguage)}
              </Badge>
            )}
          </div>

          {/* Detailed Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-2">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{getTranslation("recommendation.soilType", currentLanguage)}</p>
                <p className="text-lg font-semibold text-foreground">{recommendations.soilType || "Loamy Soil"}</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-2">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  {recommendations.fertilizer ? getTranslation("recommendation.fertilizerLabel", currentLanguage) : getTranslation("recommendation.npkRatioLabel", currentLanguage)}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {recommendations.fertilizer || recommendations.npkRatio || "80-40-40"}
                </p>
                {recommendations.matchCount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {getTranslation("recommendation.basedOn", currentLanguage)} {recommendations.matchCount} {getTranslation("recommendation.matchingRecords", currentLanguage)}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-white border-2">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{getTranslation("recommendation.irrigation", currentLanguage)}</p>
                <p className="text-lg font-semibold text-foreground">{recommendations.irrigationSchedule || "Moderate - Every 2-3 days"}</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-2 border-green-500">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{getTranslation("recommendation.conditionMatch", currentLanguage)}</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <p className="text-lg font-semibold text-foreground">{recommendations.conditionMatch || getTranslation("sensor.status.optimal", currentLanguage)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ideal Growing Conditions */}
          {recommendations.idealConditions && (
            <Card className="bg-muted/50 border-2">
              <CardContent className="p-4">
                <h4 className="text-lg font-semibold text-foreground mb-4">{getTranslation("recommendation.idealConditions", currentLanguage)}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{getTranslation("sensor.soilMoisture", currentLanguage)}</p>
                    <p className="text-xl font-bold text-foreground">{recommendations.idealConditions.moisture}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{getTranslation("sensor.temperature", currentLanguage)}</p>
                    <p className="text-xl font-bold text-foreground">{recommendations.idealConditions.temperature}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{getTranslation("sensor.humidity", currentLanguage)}</p>
                    <p className="text-xl font-bold text-foreground">{recommendations.idealConditions.humidity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </motion.div>
      )}
    </motion.section>
  )
}
