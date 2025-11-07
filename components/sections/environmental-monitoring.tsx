"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import SensorCard from "../sensor-card"
import { Droplet, Thermometer, Wind, Beaker } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type SensorResponse = {
  timestamp: string
  soilMoisture: number
  temperature: number
  humidity: number
  ph: number
  status: string
}

export default function EnvironmentalMonitoring() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SensorResponse | null>(null)
  const [phValue, setPhValue] = useState(0)
  const [phStatus, setPhStatus] = useState("")

  useEffect(() => {
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
      } catch (e) {
        setError("Could not fetch sensor data")
      } finally {
        setLoading(false)
      }
    }
    load()
    // Refresh every 10 seconds
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (phValue < 6.5) setPhStatus("Acidic")
    else if (phValue > 7.5) setPhStatus("Basic")
    else setPhStatus("Neutral")
  }, [phValue])

  const getPhColor = () => {
    if (phValue < 6.5) return "bg-red-500 hover:bg-red-600"
    if (phValue > 7.5) return "bg-blue-500 hover:bg-blue-600"
    return "bg-green-500 hover:bg-green-600"
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
            Environmental Monitoring
          </h2>
          <p className="text-sm text-muted-foreground">Real-time sensor data from your farm</p>
        </div>
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
              <DialogTitle className="text-2xl">Soil pH Information</DialogTitle>
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
                <p className="text-xl font-semibold text-foreground">Soil is {phStatus}</p>
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

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-center mb-6">
          {error}
        </div>
      )}
      
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={containerVariants}>
        <motion.div variants={itemVariants}>
          <SensorCard
            title="Soil Moisture"
            value={data ? data.soilMoisture.toFixed(1) : "55.3"}
            unit="%"
            icon={Droplet}
            status={data ? (data.soilMoisture < 35 ? "warning" : data.soilMoisture > 80 ? "critical" : "optimal") : "optimal"}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <SensorCard
            title="Temperature"
            value={data ? data.temperature.toFixed(1) : "24.5"}
            unit="°C"
            icon={Thermometer}
            status={data ? (data.temperature > 35 ? "warning" : data.temperature < 5 ? "critical" : "optimal") : "optimal"}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <SensorCard
            title="Humidity"
            value={data ? data.humidity.toFixed(1) : "62.1"}
            unit="%"
            icon={Wind}
            status={data ? (data.humidity < 25 ? "warning" : data.humidity > 90 ? "critical" : "optimal") : "optimal"}
          />
        </motion.div>
      </motion.div>
    </motion.section>
  )
}
