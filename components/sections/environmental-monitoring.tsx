"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import SensorCard from "../sensor-card"
import { Droplet, Thermometer, Wind, Beaker, Volume2, VolumeX } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getTranslation } from "@/lib/translations"

type SensorResponse = {
  timestamp: string
  soilMoisture: number
  temperature: number
  humidity: number
  ph: number
  status: string
}

export default function EnvironmentalMonitoring({ language = "en" }: { language?: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SensorResponse | null>(null)
  const [phValue, setPhValue] = useState(0)
  const [phStatus, setPhStatus] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
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

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem("cropMind_blynkToken")
        const url = token ? `/api/sensors?token=${encodeURIComponent(token)}` : "/api/sensors"
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load sensors")
        const json = (await res.json()) as SensorResponse
        setData(json)
        setPhValue(json.ph)
        
        // Dispatch event to notify other components of data update
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("sensorDataUpdated", { detail: json }))
        }
      } catch (e) {
        setError("Could not fetch sensor data")
      } finally {
        setLoading(false)
      }
    }
    load()
    // Refresh every 10 seconds
    const interval = setInterval(load, 10000)
      return () => {
        clearInterval(interval)
        window.removeEventListener("languageChanged", handleLanguageChange as EventListener)
      }
  }, [language])

  useEffect(() => {
    if (phValue < 6.5) setPhStatus(getTranslation("ph.acidic", currentLanguage))
    else if (phValue > 7.5) setPhStatus(getTranslation("ph.basic", currentLanguage))
    else setPhStatus(getTranslation("ph.neutral", currentLanguage))
  }, [phValue, currentLanguage])

  // Check for critical conditions
  const getCriticalAlert = () => {
    if (!data) return null

    // Critical: Zero soil moisture
    if (data.soilMoisture <= 0) {
      return {
        type: "critical",
        message: "🚨 CRITICAL: Soil moisture is 0% - This is impossible for plant growth! Check sensor immediately. No crop can survive without water.",
      }
    }

    // Critical: Extremely low soil moisture
    if (data.soilMoisture < 5) {
      return {
        type: "critical",
        message: "🚨 CRITICAL: Soil moisture is critically low (" + data.soilMoisture.toFixed(1) + "%). Immediate irrigation required within 1 hour to prevent crop failure.",
      }
    }

    // Warning: Very low soil moisture
    if (data.soilMoisture < 20) {
      return {
        type: "warning",
        message: "⚠️ WARNING: Soil moisture is very low (" + data.soilMoisture.toFixed(1) + "%). Most crops need 30-40% minimum. Schedule irrigation within 2-4 hours.",
      }
    }

    // Critical: Extreme temperatures
    if (data.temperature > 50 || data.temperature < -10) {
      return {
        type: "critical",
        message: "🚨 CRITICAL: Extreme temperature (" + data.temperature.toFixed(1) + "°C) detected. This is outside survival range for all crops. Verify sensor.",
      }
    }

    // Critical: Freezing
    if (data.temperature < 0) {
      return {
        type: "critical",
        message: "🚨 CRITICAL: Freezing temperature (" + data.temperature.toFixed(1) + "°C) detected. Most crops cannot survive. Immediate protection required.",
      }
    }

    // Critical: Extreme heat
    if (data.temperature > 45) {
      return {
        type: "critical",
        message: "🚨 CRITICAL: Extreme heat (" + data.temperature.toFixed(1) + "°C) will cause severe crop damage. Implement emergency cooling measures immediately.",
      }
    }

    return null
  }

  const getPhColor = () => {
    if (phValue < 6.5) return "bg-red-500 hover:bg-red-600"
    if (phValue > 7.5) return "bg-blue-500 hover:bg-blue-600"
    return "bg-green-500 hover:bg-green-600"
  }

  // Text-to-Speech function using Web Speech API
  const speakEnvironmentalData = () => {
    if (!data) return

    // Stop any ongoing speech
    if (isSpeaking) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
      return
    }

    // Check if Web Speech API is available
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Text-to-speech is not supported in your browser.")
      return
    }

    // Generate speech text in selected language
    const speechText = generateSpeechText(data, currentLanguage)

    try {
      setIsSpeaking(true)

      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(speechText)
      
      // Set language code for speech synthesis
      const languageCode = getLanguageCode(currentLanguage)
      utterance.lang = languageCode
      
      // Set voice properties
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // Handle speech events
      utterance.onend = () => {
        setIsSpeaking(false)
      }

      utterance.onerror = (error) => {
        console.error("Speech synthesis error:", error)
        setIsSpeaking(false)
        alert("Failed to generate speech. Please try again.")
      }

      // Speak
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("TTS error:", error)
      setIsSpeaking(false)
      alert("Failed to generate speech. Please try again.")
    }
  }

  // Generate speech text in selected language
  const generateSpeechText = (sensorData: SensorResponse, lang: string): string => {
    const t = (key: string) => getTranslation(key, lang)

    const soilMoistureText = `${t("speech.soilMoisture")} ${sensorData.soilMoisture.toFixed(1)} ${t("speech.percent")}`
    const temperatureText = `${t("speech.temperature")} ${sensorData.temperature.toFixed(1)} ${t("speech.degrees")}`
    const humidityText = `${t("speech.humidity")} ${sensorData.humidity.toFixed(1)} ${t("speech.percent")}`
    const phText = `${t("speech.ph")} ${sensorData.ph.toFixed(1)}`

    return `${t("speech.currentReadings")} ${soilMoistureText}, ${t("speech.and")} ${temperatureText}, ${t("speech.and")} ${humidityText}, ${t("speech.and")} ${phText}.`
  }

  // Get language code for speech synthesis (only Hindi and English supported)
  const getLanguageCode = (lang: string): string => {
    const langMap: Record<string, string> = {
      en: "en-IN",
      hi: "hi-IN",
    }
    return langMap[lang] || "en-IN"
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeInOut",
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  }

  return (
    <motion.section 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="space-y-6 bg-gradient-to-br from-background via-card/30 to-background rounded-2xl p-8 border border-border/50 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {getTranslation("nav.environmental", currentLanguage)}
          </h2>
          <p className="text-sm text-muted-foreground">{getTranslation("sensor.realTimeData", currentLanguage)}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Text-to-Speech Button */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            animate={isSpeaking ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={isSpeaking ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
          >
            <Button
              size="lg"
              onClick={speakEnvironmentalData}
              disabled={!data || loading}
              className={`
                relative overflow-hidden
                ${isSpeaking 
                  ? "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-lg shadow-purple-500/50 border-2 border-purple-400" 
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/50 border-2 border-blue-400 hover:border-blue-300"
                }
                font-semibold text-base px-6 py-3
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title={isSpeaking ? getTranslation("button.stopTitle", currentLanguage) : getTranslation("button.listenTitle", currentLanguage)}
            >
              {/* Animated background gradient when speaking */}
              {isSpeaking && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: "200% 200%",
                  }}
                />
              )}
              
              <span className="relative z-10 flex items-center gap-2">
                {isSpeaking ? (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 15, -15, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <VolumeX className="w-5 h-5" />
                    </motion.div>
                    <span>{getTranslation("button.stop", currentLanguage)}</span>
                    <motion.span
                      className="ml-1"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ●
                    </motion.span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    <span>{getTranslation("button.listen", currentLanguage)}</span>
                  </>
                )}
              </span>
            </Button>
          </motion.div>
          <Dialog>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                className={`text-white font-medium ${getPhColor()} transition-all shadow-lg hover:shadow-xl`} 
                variant="default"
                size="lg"
              >
                <Beaker className="w-5 h-5 mr-2" />
                pH: {phValue.toFixed(1)} - {phStatus}
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">{getTranslation("ph.soilInfo", currentLanguage)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center">
                <motion.div
                  className={`w-24 h-24 rounded-full ${getPhColor()} text-white flex items-center justify-center mx-auto mb-4 shadow-lg`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <span className="text-3xl font-bold">{phValue.toFixed(1)}</span>
                </motion.div>
                <p className="text-xl font-semibold text-foreground">{getTranslation("ph.soilIs", currentLanguage)} {phStatus}</p>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20">
                {phValue < 6.5 ? (
                  <p className="text-sm text-foreground leading-relaxed">
                    🔴 <strong>Acidic soil.</strong> Consider adding lime to raise pH. Best for acid-loving crops like
                    blueberries.
                  </p>
                ) : phValue > 7.5 ? (
                  <p className="text-sm text-foreground leading-relaxed">
                    🔵 <strong>Basic soil.</strong> Consider adding sulfur to lower pH. Good for legumes and brassicas.
                  </p>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">
                    🟢 <strong>Neutral soil — optimal for most crops!</strong> This pH range is ideal for majority of
                    agricultural plants. 🌾
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-center mb-6">
          {error}
        </div>
      )}

      {/* Critical Alerts */}
      {getCriticalAlert() && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg border-2 ${
            getCriticalAlert()?.type === "critical"
              ? "bg-red-100 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200"
              : "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <span className="text-2xl">
                {getCriticalAlert()?.type === "critical" ? "🚨" : "⚠️"}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold mb-1">
                {getCriticalAlert()?.type === "critical" ? "Critical Alert" : "Warning"}
              </p>
              <p className="text-sm leading-relaxed">{getCriticalAlert()?.message}</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={containerVariants}>
        <motion.div variants={itemVariants}>
          <SensorCard
            title={getTranslation("sensor.soilMoisture", currentLanguage)}
            value={data ? data.soilMoisture.toFixed(1) : "55.3"}
            unit="%"
            icon={Droplet}
            status={data ? (data.soilMoisture < 35 ? "warning" : data.soilMoisture > 80 ? "critical" : "optimal") : "optimal"}
            language={currentLanguage}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <SensorCard
            title={getTranslation("sensor.temperature", currentLanguage)}
            value={data ? data.temperature.toFixed(1) : "24.5"}
            unit="°C"
            icon={Thermometer}
            status={data ? (data.temperature > 35 ? "warning" : data.temperature < 5 ? "critical" : "optimal") : "optimal"}
            language={currentLanguage}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <SensorCard
            title={getTranslation("sensor.humidity", currentLanguage)}
            value={data ? data.humidity.toFixed(1) : "62.1"}
            unit="%"
            icon={Wind}
            status={data ? (data.humidity < 25 ? "warning" : data.humidity > 90 ? "critical" : "optimal") : "optimal"}
            language={currentLanguage}
          />
          </motion.div>
      </motion.div>
    </motion.section>
  )
}
