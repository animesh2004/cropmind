"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import EnvironmentalMonitoring from "./sections/environmental-monitoring"
import PersonalizedRecommendations from "./sections/personalized-recommendations"
import SecuritySafety from "./sections/security-safety"
import HistoricalData from "./sections/historical-data"
import QuickTips from "./sections/quick-tips"
import OfflineIndicator from "./sections/offline-indicator"
import WeatherIntegration from "./sections/weather-integration"
import VoiceCommands from "./sections/voice-commands"
import { monitoringService } from "@/lib/monitoring-service"
import { requestNotificationPermission } from "@/lib/notifications"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Dashboard({ language = "en" }: { language?: string }) {
  const [mounted, setMounted] = useState(false)
  const [criticalAlert, setCriticalAlert] = useState<{type: string, message: string} | null>(null)
  const [sensorData, setSensorData] = useState<any>(null)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [lastAlertHash, setLastAlertHash] = useState<string>("")
  const [lastBeepTime, setLastBeepTime] = useState<number>(0)

  useEffect(() => {
    setMounted(true)

    // Request notification permission on mount
    requestNotificationPermission()

    // Initialize monitoring service if enabled
    const monitoringEnabled = localStorage.getItem("cropMind_monitoringEnabled") === "true"
    if (monitoringEnabled) {
      const periodicAlerts = localStorage.getItem("cropMind_periodicAlerts") !== "false"
      const instantAlerts = localStorage.getItem("cropMind_instantAlerts") !== "false"

      monitoringService.initialize({
        enabled: true,
        periodicAlerts,
        instantAlerts,
        checkInterval: 600000, // 10 minutes
      })
    }

    // Cleanup on unmount
    return () => {
      monitoringService.stopMonitoring()
    }
  }, [])

  // Check for critical alerts using custom thresholds
  useEffect(() => {
    const checkCriticalAlerts = async () => {
      try {
        const token = localStorage.getItem("cropMind_blynkToken")
        const url = token ? `/api/sensors?token=${encodeURIComponent(token)}` : "/api/sensors"
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        
        // Store sensor data for export
        setSensorData(data)
        
        // Load custom thresholds
        const savedThresholds = localStorage.getItem("cropMind_alertThresholds")
        let thresholds = {
          soilMoistureMin: 20,
          soilMoistureMax: 85,
          temperatureMin: 10,
          temperatureMax: 40,
          humidityMin: 40,
          humidityMax: 80,
          phMin: 6.0,
          phMax: 7.5,
          alertsEnabled: true,
          singleBeepEnabled: false,
          doubleBeepEnabled: true
        }
        
        if (savedThresholds) {
          try {
            const parsed = JSON.parse(savedThresholds)
            thresholds = { ...thresholds, ...parsed }
          } catch (e) {
            // Use defaults
          }
        }
        
        // Skip alerts if disabled
        if (!thresholds.alertsEnabled) {
          setCriticalAlert(null)
          setLastAlertHash("")
          return
        }
        
        // Check for fire (always critical - highest priority)
        if (data.flame > 0) {
          const alertMessage = language === "hi" 
            ? "🚨 आग का खतरा! तुरंत कार्रवाई करें!"
            : "🚨 FIRE DETECTED! Take immediate action!"
          const alertHash = `fire-${data.flame}`
          
          // Only beep if this is a new alert
          const now = Date.now()
          const beepCooldown = 30000 // 30 seconds cooldown
          const isNewAlert = alertHash !== lastAlertHash
          const cooldownPassed = now - lastBeepTime > beepCooldown
          
          if (isNewAlert && cooldownPassed) {
            setCriticalAlert({
              type: "critical",
              message: alertMessage
            })
            setLastAlertHash(alertHash)
            setLastBeepTime(now)
            // Triple beep for fire (compulsory, highest priority)
            playBeepSound("triple")
            return
          } else {
            setCriticalAlert({
              type: "critical",
              message: alertMessage
            })
            if (isNewAlert) setLastAlertHash(alertHash)
            return
          }
        }
        
        // Check against custom thresholds and categorize severity
        const criticalAlerts: string[] = []
        const warningAlerts: string[] = []
        
        // Calculate severity based on how far outside threshold
        const moistureDiff = data.soilMoisture < thresholds.soilMoistureMin 
          ? thresholds.soilMoistureMin - data.soilMoisture
          : data.soilMoisture > thresholds.soilMoistureMax
          ? data.soilMoisture - thresholds.soilMoistureMax
          : 0
        
        if (data.soilMoisture < thresholds.soilMoistureMin) {
          const isCritical = moistureDiff > 30 || data.soilMoisture < 5
          const message = language === "hi"
            ? `⚠️ मिट्टी की नमी कम है (${data.soilMoisture.toFixed(1)}% < ${thresholds.soilMoistureMin}%)! तुरंत पानी दें!`
            : `⚠️ Soil moisture low (${data.soilMoisture.toFixed(1)}% < ${thresholds.soilMoistureMin}%)! Water immediately!`
          if (isCritical) criticalAlerts.push(message)
          else warningAlerts.push(message)
        } else if (data.soilMoisture > thresholds.soilMoistureMax) {
          const isCritical = moistureDiff > 20
          const message = language === "hi"
            ? `⚠️ मिट्टी बहुत गीली है (${data.soilMoisture.toFixed(1)}% > ${thresholds.soilMoistureMax}%)! जल निकासी जांचें!`
            : `⚠️ Soil too wet (${data.soilMoisture.toFixed(1)}% > ${thresholds.soilMoistureMax}%)! Check drainage!`
          if (isCritical) criticalAlerts.push(message)
          else warningAlerts.push(message)
        }
        
        const tempDiff = data.temperature < thresholds.temperatureMin
          ? thresholds.temperatureMin - data.temperature
          : data.temperature > thresholds.temperatureMax
          ? data.temperature - thresholds.temperatureMax
          : 0
        
        if (data.temperature < thresholds.temperatureMin) {
          const isCritical = tempDiff > 10 || data.temperature < 0
          const message = language === "hi"
            ? `❄️ तापमान कम है (${data.temperature.toFixed(1)}°C < ${thresholds.temperatureMin}°C)! फसलों को ढकें!`
            : `❄️ Temperature low (${data.temperature.toFixed(1)}°C < ${thresholds.temperatureMin}°C)! Cover crops!`
          if (isCritical) criticalAlerts.push(message)
          else warningAlerts.push(message)
        } else if (data.temperature > thresholds.temperatureMax) {
          const isCritical = tempDiff > 10 || data.temperature > 45
          const message = language === "hi"
            ? `🌡️ तापमान अधिक है (${data.temperature.toFixed(1)}°C > ${thresholds.temperatureMax}°C)! फसलों को छाया दें!`
            : `🌡️ Temperature high (${data.temperature.toFixed(1)}°C > ${thresholds.temperatureMax}°C)! Provide shade!`
          if (isCritical) criticalAlerts.push(message)
          else warningAlerts.push(message)
        }
        
        if (data.humidity < thresholds.humidityMin) {
          warningAlerts.push(language === "hi"
            ? `💨 आर्द्रता कम है (${data.humidity.toFixed(1)}% < ${thresholds.humidityMin}%)! पानी छिड़कें!`
            : `💨 Humidity low (${data.humidity.toFixed(1)}% < ${thresholds.humidityMin}%)! Spray water!`)
        } else if (data.humidity > thresholds.humidityMax) {
          warningAlerts.push(language === "hi"
            ? `💨 आर्द्रता अधिक है (${data.humidity.toFixed(1)}% > ${thresholds.humidityMax}%)! हवा का संचार बढ़ाएं!`
            : `💨 Humidity high (${data.humidity.toFixed(1)}% > ${thresholds.humidityMax}%)! Increase air circulation!`)
        }
        
        if (data.ph && (data.ph < thresholds.phMin || data.ph > thresholds.phMax)) {
          warningAlerts.push(language === "hi"
            ? `🧪 pH अनुचित है (${data.ph.toFixed(1)} - सीमा: ${thresholds.phMin}-${thresholds.phMax})! मिट्टी सुधार करें!`
            : `🧪 pH out of range (${data.ph.toFixed(1)} - Range: ${thresholds.phMin}-${thresholds.phMax})! Improve soil!`)
        }
        
        // Combine alerts (critical first)
        const allAlerts = [...criticalAlerts, ...warningAlerts]
        const alertHash = allAlerts.length > 0 
          ? `${criticalAlerts.length > 0 ? 'critical' : 'warning'}-${allAlerts.join('|').substring(0, 50)}`
          : ""
        
        if (allAlerts.length > 0) {
          const alertType = criticalAlerts.length > 0 ? "critical" : "warning"
          setCriticalAlert({
            type: alertType,
            message: allAlerts.join("\n")
          })
          
          // Beep based on alert type and user settings
          const now = Date.now()
          const beepCooldown = 30000 // 30 seconds cooldown
          const isNewAlert = alertHash !== lastAlertHash
          const cooldownPassed = now - lastBeepTime > beepCooldown
          
          if (alertType === "critical" && isNewAlert && cooldownPassed) {
            setLastBeepTime(now)
            setLastAlertHash(alertHash)
            // Triple beep for critical alerts (compulsory)
            playBeepSound("triple")
            // Also play double beep if enabled
            if (thresholds.doubleBeepEnabled) {
              setTimeout(() => playBeepSound("double"), 800)
            }
          } else if (alertType === "warning" && isNewAlert && cooldownPassed && thresholds.singleBeepEnabled) {
            setLastBeepTime(now)
            setLastAlertHash(alertHash)
            // Single beep for warnings (if enabled)
            playBeepSound("single")
          } else if (alertType === "critical" && isNewAlert) {
            setLastAlertHash(alertHash)
          } else if (alertType === "warning" && isNewAlert) {
            setLastAlertHash(alertHash)
          }
        } else {
          setCriticalAlert(null)
          setLastAlertHash("")
        }
      } catch (error) {
        // Silent fail
      }
    }
    
    checkCriticalAlerts()
    const interval = setInterval(checkCriticalAlerts, 15000) // Check every 15 seconds
    
    return () => clearInterval(interval)
  }, [language, lastAlertHash, lastBeepTime])

  // Beep sound function with single, double, and triple beep patterns
  const playBeepSound = (pattern: "single" | "double" | "triple") => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const playBeep = (freq: number, delay: number, duration: number, volume: number = 0.3) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.value = freq
          oscillator.type = "sine"
          
          gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + duration)
        }, delay)
      }
      
      if (pattern === "triple") {
        // Triple beep: high, high, very high (compulsory for critical alerts)
        playBeep(800, 0, 0.2, 0.4)      // First beep
        playBeep(800, 250, 0.2, 0.4)    // Second beep
        playBeep(1000, 500, 0.3, 0.45)  // Third beep (higher pitch, longer, louder)
      } else if (pattern === "double") {
        // Double beep: medium frequency (for critical alerts if enabled)
        playBeep(700, 0, 0.2, 0.3)      // First beep
        playBeep(700, 250, 0.2, 0.3)   // Second beep
      } else if (pattern === "single") {
        // Single beep: gentle, lower frequency (for warnings if enabled)
        playBeep(600, 0, 0.15, 0.2)     // Single gentle beep
      }
    } catch (error) {
      console.warn("Could not play beep sound:", error)
    }
  }

  if (!mounted) return null

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  return (
    <motion.main variants={containerVariants} initial="hidden" animate="visible" className="px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-8 pb-0 min-h-screen">
      <OfflineIndicator language={language} />
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <EnvironmentalMonitoring language={language} />
        <PersonalizedRecommendations language={language} />
        <QuickTips language={language} sensorData={sensorData ? {
          soilMoisture: sensorData.soilMoisture || 0,
          temperature: sensorData.temperature || 0,
          humidity: sensorData.humidity || 0,
          ph: sensorData.ph
        } : undefined} weatherData={weatherData} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <WeatherIntegration language={language} onWeatherUpdate={setWeatherData} />
          <VoiceCommands language={language} />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <SecuritySafety language={language} />
          <HistoricalData language={language} />
        </div>
      </div>
    </motion.main>
  )
}
