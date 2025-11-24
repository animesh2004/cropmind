"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import SensorCard from "../sensor-card"
import { Droplet, Thermometer, Wind, Beaker, Volume2, VolumeX, Share2, MessageCircle, Facebook, Twitter, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getTranslation } from "@/lib/translations"
import { getActiveNodeToken } from "@/lib/blynk-nodes"

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
  // Initialize currentLanguage from localStorage if available, otherwise use prop
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cropMind_language") || language || "en"
    }
    return language || "en"
  })
  
  // Refs to track audio and prevent overlapping
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // Get initial language from localStorage
    const savedLang = typeof window !== "undefined" 
      ? (localStorage.getItem("cropMind_language") || language || "en")
      : (language || "en")
    setCurrentLanguage(savedLang)

    // Listen for language changes from profile
    const handleLanguageChange = (event: CustomEvent) => {
      const newLang = (event as CustomEvent<{ language: string }>).detail.language
      setCurrentLanguage(newLang)
    }

    // Listen for active node changes
    const handleNodeChange = () => {
      load() // Reload sensor data when node changes
    }

    if (typeof window !== "undefined") {
      window.addEventListener("languageChanged", handleLanguageChange as EventListener)
      window.addEventListener("activeNodeChanged", handleNodeChange as EventListener)
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = getActiveNodeToken()
        const url = token ? `/api/sensors?token=${encodeURIComponent(token)}` : "/api/sensors"
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load sensors")
        const json = (await res.json()) as SensorResponse
        setData(json)
        // Ensure pH is properly parsed and updated
        const phValue = typeof json.ph === 'number' ? json.ph : (typeof json.ph === 'string' ? parseFloat(json.ph) : parseFloat(String(json.ph || '6.8')))
        setPhValue(phValue)
        
        // Dispatch event to notify other components of data update
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("sensorDataUpdated", { 
            detail: {
              soilMoisture: json.soilMoisture,
              temperature: json.temperature,
              humidity: json.humidity,
              ph: phValue
            }
          }))
        }
      } catch (e) {
        setError("Could not fetch sensor data")
      } finally {
        setLoading(false)
      }
    }
    load()
    // Auto-refresh every 5 seconds to keep it live (same as recommendations)
    // Always load to ensure pH and all values update in real-time
    const interval = setInterval(() => {
      load()
    }, 5000)
      return () => {
        clearInterval(interval)
        // Cleanup audio on unmount
        stopCurrentAudio()
        if (typeof window !== "undefined") {
          window.removeEventListener("languageChanged", handleLanguageChange as EventListener)
          window.removeEventListener("activeNodeChanged", handleNodeChange as EventListener)
        }
      }
  }, [language])

  useEffect(() => {
    // Update pH status whenever pH value or language changes
    if (phValue > 0) { // Only update if pH value is valid
      if (phValue < 6.5) setPhStatus(getTranslation("ph.acidic", currentLanguage))
      else if (phValue > 7.5) setPhStatus(getTranslation("ph.basic", currentLanguage))
      else setPhStatus(getTranslation("ph.neutral", currentLanguage))
    }
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
    if (phValue < 6.5) return "bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700"
    if (phValue > 7.5) return "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700"
    return "bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700"
  }

  // Helper function to stop any currently playing audio
  const stopCurrentAudio = () => {
    // Stop browser TTS
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel()
      } catch (e) {
        // Silently handle errors
      }
    }

    // Stop audio element
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
        currentAudioRef.current.onended = null
        currentAudioRef.current.onerror = null
      } catch (e) {
        // Silently handle errors
      }
      currentAudioRef.current = null
    }
    
    if (currentAudioUrlRef.current) {
      try {
        URL.revokeObjectURL(currentAudioUrlRef.current)
      } catch (e) {
        // Silently handle errors
      }
      currentAudioUrlRef.current = null
    }
    
    setIsSpeaking(false)
  }

  // Browser TTS function - Instant response, no delay
  const useBrowserTTS = (text: string, lang: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSpeaking(false)
      return
    }

    // Cancel any existing speech immediately
    window.speechSynthesis.cancel()

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Set language
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN"
    
    // Set voice properties for natural speech
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Try to select a better voice if available
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      // Prefer native language voices
      const preferredVoice = voices.find(voice => 
        lang === "hi" 
          ? voice.lang.includes("hi") || voice.lang.includes("Hindi")
          : (voice.lang.includes("en") && !voice.lang.includes("hi"))
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
    }

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
    }

    utterance.onerror = (error) => {
      setIsSpeaking(false)
      console.error("Speech synthesis error:", error)
    }

    // Speak immediately - no delay
    window.speechSynthesis.speak(utterance)
  }

  // Text-to-Speech function - Uses browser TTS immediately for instant response
  const speakEnvironmentalData = () => {
    if (!data) return

    // Stop any ongoing speech
    if (isSpeaking) {
      stopCurrentAudio()
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
      return
    }

    // Stop any currently playing audio to prevent mixing
    stopCurrentAudio()
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    // Set speaking state IMMEDIATELY for instant visual feedback
    setIsSpeaking(true)

    // Get current language (use state variable for faster access)
    const lang = currentLanguage || "en"

    // Generate speech text
    const speechText = generateSpeechText(data, lang)

    // Use browser TTS immediately - no delay, instant response
    useBrowserTTS(speechText, lang)
  }


  // Generate speech text in selected language - Simple and direct
  const generateSpeechText = (sensorData: SensorResponse, lang: string): string => {
    const t = (key: string) => getTranslation(key, lang || "en")

    if (lang === "hi") {
      // Hindi text
      return `वर्तमान पर्यावरणीय रीडिंग: मिट्टी की नमी ${sensorData.soilMoisture.toFixed(1)} प्रतिशत, तापमान ${sensorData.temperature.toFixed(1)} डिग्री सेल्सियस, आर्द्रता ${sensorData.humidity.toFixed(1)} प्रतिशत, और pH स्तर ${sensorData.ph.toFixed(1)}.`
    } else {
      // English text
      return `Current environmental readings: Soil moisture is ${sensorData.soilMoisture.toFixed(1)} percent, Temperature is ${sensorData.temperature.toFixed(1)} degrees Celsius, Humidity is ${sensorData.humidity.toFixed(1)} percent, and pH level is ${sensorData.ph.toFixed(1)}.`
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as const,
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    },
  }

  return (
    <motion.section 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="space-y-4 sm:space-y-6 bg-gradient-to-br from-background via-card/30 to-background rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-border/50 shadow-lg"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent break-words">
            {getTranslation("nav.environmental", currentLanguage)}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground break-words">{getTranslation("sensor.realTimeData", currentLanguage)}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Share Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={!data || loading}
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{currentLanguage === "hi" ? "साझा करें" : "Share"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  const message = currentLanguage === "hi"
                    ? `🌾 CropMind रिपोर्ट\n\nमिट्टी की नमी: ${data?.soilMoisture.toFixed(1) || 0}%\nतापमान: ${data?.temperature.toFixed(1) || 0}°C\nआर्द्रता: ${data?.humidity.toFixed(1) || 0}%\npH: ${data?.ph.toFixed(1) || 0}\n\nसमय: ${new Date().toLocaleString("hi-IN")}`
                    : `🌾 CropMind Report\n\nSoil Moisture: ${data?.soilMoisture.toFixed(1) || 0}%\nTemperature: ${data?.temperature.toFixed(1) || 0}°C\nHumidity: ${data?.humidity.toFixed(1) || 0}%\npH: ${data?.ph.toFixed(1) || 0}\n\nTime: ${new Date().toLocaleString()}`
                  const url = `https://wa.me/?text=${encodeURIComponent(message)}`
                  window.open(url, "_blank")
                }}
                className="cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                <span>WhatsApp</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const message = currentLanguage === "hi"
                    ? `🌾 CropMind रिपोर्ट\n\nमिट्टी की नमी: ${data?.soilMoisture.toFixed(1) || 0}%\nतापमान: ${data?.temperature.toFixed(1) || 0}°C\nआर्द्रता: ${data?.humidity.toFixed(1) || 0}%\npH: ${data?.ph.toFixed(1) || 0}\n\nसमय: ${new Date().toLocaleString("hi-IN")}`
                    : `🌾 CropMind Report\n\nSoil Moisture: ${data?.soilMoisture.toFixed(1) || 0}%\nTemperature: ${data?.temperature.toFixed(1) || 0}°C\nHumidity: ${data?.humidity.toFixed(1) || 0}%\npH: ${data?.ph.toFixed(1) || 0}\n\nTime: ${new Date().toLocaleString()}`
                  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(message)}`
                  window.open(url, "_blank")
                }}
                className="cursor-pointer"
              >
                <Facebook className="w-4 h-4 mr-2 text-blue-500" />
                <span>Facebook</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const message = currentLanguage === "hi"
                    ? `🌾 CropMind रिपोर्ट\n\nमिट्टी की नमी: ${data?.soilMoisture.toFixed(1) || 0}%\nतापमान: ${data?.temperature.toFixed(1) || 0}°C\nआर्द्रता: ${data?.humidity.toFixed(1) || 0}%\npH: ${data?.ph.toFixed(1) || 0}\n\nसमय: ${new Date().toLocaleString("hi-IN")}`
                    : `🌾 CropMind Report\n\nSoil Moisture: ${data?.soilMoisture.toFixed(1) || 0}%\nTemperature: ${data?.temperature.toFixed(1) || 0}°C\nHumidity: ${data?.humidity.toFixed(1) || 0}%\npH: ${data?.ph.toFixed(1) || 0}\n\nTime: ${new Date().toLocaleString()}`
                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(window.location.href)}`
                  window.open(url, "_blank")
                }}
                className="cursor-pointer"
              >
                <Twitter className="w-4 h-4 mr-2 text-sky-500" />
                <span>Twitter/X</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const subject = currentLanguage === "hi" ? "CropMind रिपोर्ट" : "CropMind Report"
                  const body = currentLanguage === "hi"
                    ? `मिट्टी की नमी: ${data?.soilMoisture.toFixed(1) || 0}%\nतापमान: ${data?.temperature.toFixed(1) || 0}°C\nआर्द्रता: ${data?.humidity.toFixed(1) || 0}%\npH: ${data?.ph.toFixed(1) || 0}`
                    : `Soil Moisture: ${data?.soilMoisture.toFixed(1) || 0}%\nTemperature: ${data?.temperature.toFixed(1) || 0}°C\nHumidity: ${data?.humidity.toFixed(1) || 0}%\npH: ${data?.ph.toFixed(1) || 0}`
                  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                  window.location.href = url
                }}
                className="cursor-pointer"
              >
                <Mail className="w-4 h-4 mr-2" />
                <span>Email</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
              ease: [0.4, 0, 0.2, 1] as const
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
                font-semibold text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3
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
                      <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.div>
                    <span className="text-xs sm:text-sm">{getTranslation("button.stop", currentLanguage)}</span>
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
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">{getTranslation("button.listen", currentLanguage)}</span>
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
                {/* Circular Progress Indicator for pH */}
                <div className="relative w-32 h-32 mx-auto mb-4">
                  {/* Background Circle */}
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    {/* Background track */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted opacity-20"
                    />
                    {/* Animated progress circle */}
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className={phValue < 6.5 ? "text-red-500" : phValue > 7.5 ? "text-blue-500" : "text-green-500"}
                      initial={{ pathLength: 0 }}
                      animate={{ 
                        pathLength: phValue / 14, // pH scale is 0-14
                      }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeDasharray={`${2 * Math.PI * 50}`}
                    />
                  </svg>
                  {/* Center content with glow effect */}
                  <motion.div
                    className={`absolute inset-0 rounded-full ${getPhColor()} text-white flex items-center justify-center`}
                    style={{
                      boxShadow: phValue < 6.5 
                        ? "0 0 25px rgba(239, 68, 68, 0.6), 0 0 50px rgba(239, 68, 68, 0.3)" 
                        : phValue > 7.5 
                        ? "0 0 25px rgba(59, 130, 246, 0.6), 0 0 50px rgba(59, 130, 246, 0.3)" 
                        : "0 0 25px rgba(34, 197, 94, 0.6), 0 0 50px rgba(34, 197, 94, 0.3)"
                    }}
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut"
                    }}
                  >
                    <motion.span 
                      className="text-4xl font-bold"
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut"
                      }}
                    >
                      {phValue.toFixed(1)}
                    </motion.span>
                  </motion.div>
                  {/* pH scale indicator dots */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-full relative">
                      {/* Acidic indicator (left) */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
                        <div className="w-2 h-2 rounded-full bg-red-500 opacity-60"></div>
                      </div>
                      {/* Neutral indicator (center) */}
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-2 h-2 rounded-full bg-green-500 opacity-60"></div>
                      </div>
                      {/* Basic indicator (right) */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 opacity-60"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <motion.p 
                  className="text-xl font-semibold text-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {getTranslation("ph.soilIs", currentLanguage)} {phStatus}
                </motion.p>
                {/* pH scale bar */}
                <div className="mt-4 relative h-3 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                    style={{ left: `${(phValue / 14) * 100}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span>7</span>
                  <span>14</span>
                </div>
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
              ? "bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-400 text-red-800 dark:text-red-200"
              : "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200"
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

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6" variants={containerVariants}>
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
