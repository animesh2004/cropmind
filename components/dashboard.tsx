"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import EnvironmentalMonitoring from "./sections/environmental-monitoring"
import PersonalizedRecommendations from "./sections/personalized-recommendations"
import SecuritySafety from "./sections/security-safety"
import HistoricalData from "./sections/historical-data"
import { monitoringService } from "@/lib/monitoring-service"
import { requestNotificationPermission } from "@/lib/notifications"

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)

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
    <motion.main variants={containerVariants} initial="hidden" animate="visible" className="px-6 pt-8 pb-0 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <EnvironmentalMonitoring />
        <PersonalizedRecommendations />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SecuritySafety />
          <HistoricalData />
        </div>
      </div>
    </motion.main>
  )
}
