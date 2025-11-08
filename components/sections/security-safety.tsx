"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Shield, AlertTriangle, Flame } from "lucide-react"
import { showBrowserNotification, formatAlertMessage } from "@/lib/notifications"
import { getTranslation } from "@/lib/translations"

type SecurityData = {
  pir: number
  flame: number
  status: "safe" | "warning" | "critical"
  source?: string
}

export default function SecuritySafety({ language = "en" }: { language?: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SecurityData | null>(null)
  const [currentLanguage, setCurrentLanguage] = useState(language)
  const lastFireAlert = useRef<number>(0)
  const lastAnimalAlert = useRef<number>(0)
  const alertCooldown = 30000 // 30 seconds cooldown

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

  useEffect(() => {
    const loadSecurityData = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem("cropMind_blynkToken")
        const url = token ? `/api/security?token=${encodeURIComponent(token)}` : "/api/security"
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load security data")
        const json = (await res.json()) as SecurityData
        setData(json)

        // Check for instant alerts
        const now = Date.now()
        const instantAlertsEnabled = localStorage.getItem("cropMind_instantAlerts") !== "false"

        if (instantAlertsEnabled) {
          // Fire detection
          if (json.flame > 0 && now - lastFireAlert.current > alertCooldown) {
            lastFireAlert.current = now
            const alert = formatAlertMessage("fire", { location: "Farm" })
            showBrowserNotification({
              title: alert.title,
              body: alert.body,
              urgent: true,
              tag: "fire-alert",
            })
          }

          // Animal intrusion detection
          if (json.pir > 0 && now - lastAnimalAlert.current > alertCooldown) {
            lastAnimalAlert.current = now
            const alert = formatAlertMessage("animal", { location: "Farm" })
            showBrowserNotification({
              title: alert.title,
              body: alert.body,
              urgent: true,
              tag: "animal-alert",
            })
          }
        }
        
        // Wait 2 seconds after data is updated before hiding loading
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (e) {
        setError("Could not fetch security data")
        // Wait 2 seconds even on error
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } finally {
        setLoading(false)
      }
    }

    loadSecurityData()
    // Refresh every 5 seconds
    const interval = setInterval(loadSecurityData, 5000)
    return () => clearInterval(interval)
  }, [])

  const statusItems = data
    ? [
        {
          title: data.pir > 0 ? getTranslation("security.motion", currentLanguage) : getTranslation("security.noMotion", currentLanguage),
          subtitle: data.pir > 0 ? getTranslation("security.pirActive", currentLanguage) : getTranslation("security.acreSecured", currentLanguage),
          icon: data.pir > 0 ? AlertTriangle : Shield,
          status: data.pir > 0 ? "warning" : "safe",
        },
        {
          title: data.flame > 0 ? getTranslation("security.flame", currentLanguage) : getTranslation("security.safe", currentLanguage),
          subtitle: data.flame > 0 ? getTranslation("security.flameDetected", currentLanguage) : getTranslation("security.noRisk", currentLanguage),
          icon: data.flame > 0 ? Flame : Shield,
          status: data.flame > 0 ? "critical" : "safe",
        },
      ]
    : [
    {
      title: getTranslation("security.noMotion", currentLanguage),
      subtitle: getTranslation("security.acreSecured", currentLanguage),
      icon: Shield,
          status: "safe" as const,
    },
    {
      title: getTranslation("security.safe", currentLanguage),
      subtitle: getTranslation("security.noRisk", currentLanguage),
      icon: Shield,
          status: "safe" as const,
    },
  ]

  const getStatusColor = (status: string) => {
    if (status === "critical") return "bg-destructive"
    if (status === "warning") return "bg-amber-500"
    return "bg-primary"
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut", delay: 0.4 }}
      className="bg-gradient-to-br from-card via-card/50 to-card border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{getTranslation("security.title", currentLanguage)}</h2>
        <p className="text-xs text-muted-foreground">{getTranslation("security.description", currentLanguage)}</p>
      </div>

      {error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm text-center">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {statusItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="flex items-center gap-4 p-5 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 hover:border-border transition-all duration-300 shadow-sm hover:shadow-md"
            >
                <motion.div
                  className={`w-12 h-12 rounded-xl ${getStatusColor(item.status)} flex items-center justify-center shadow-lg`}
                  animate={{ 
                    scale: item.status !== "safe" ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: item.status !== "safe" ? Number.POSITIVE_INFINITY : 0,
                    ease: "easeInOut"
                  }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-base">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
              </div>
                <motion.div
                  className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}
                  animate={{ 
                    opacity: item.status !== "safe" ? [1, 0.5, 1] : 1,
                    scale: item.status !== "safe" ? [1, 1.2, 1] : 1
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: item.status !== "safe" ? Number.POSITIVE_INFINITY : 0,
                    ease: "easeInOut"
                  }}
                />
            </motion.div>
          )
        })}
      </div>
      )}
    </motion.section>
  )
}
