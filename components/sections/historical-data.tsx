"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { getTranslation } from "@/lib/translations"

type Period = "1Day" | "1Week" | "1Month"

export default function HistoricalData({ language = "en" }: { language?: string }) {
  const [activePeriod, setActivePeriod] = useState<Period>("1Week")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Array<Record<string, number | string>>>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem("cropMind_blynkToken")
        const url = token
          ? `/api/sensors/history?period=${activePeriod}&token=${encodeURIComponent(token)}`
          : `/api/sensors/history?period=${activePeriod}`
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load history")
        const json = (await res.json()) as { period: Period; data: Array<Record<string, number | string>>; timestamp?: string }
        setData(json.data)
        setLastUpdated(new Date(json.timestamp || Date.now()))
        
        // Wait 2 seconds after data is updated before hiding loading
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (e) {
        setError("Could not fetch history data")
        // Wait 2 seconds even on error
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } finally {
        setLoading(false)
      }
    }
    load()
    
    // Auto-refresh every 15 seconds to update graph with new data
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [activePeriod])

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut", delay: 0.5 }}
      className="xl:col-span-2 bg-gradient-to-br from-card via-card/50 to-card border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">{getTranslation("graph.title", currentLanguage)}</h2>
          <p className="text-xs text-muted-foreground">{getTranslation("graph.description", currentLanguage)}</p>
        </div>
        <div className="flex gap-2">
          {(["1Day", "1Week", "1Month"] as const).map((period) => (
            <motion.div
              key={period}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
              onClick={() => setActivePeriod(period)}
              variant={activePeriod === period ? "default" : "outline"}
              size="sm"
                className={`font-medium transition-all ${
                  activePeriod === period 
                    ? "shadow-lg" 
                    : "hover:bg-muted/50"
                }`}
            >
              {period === "1Day" ? getTranslation("graph.period.1Day", currentLanguage) : period === "1Week" ? getTranslation("graph.period.1Week", currentLanguage) : getTranslation("graph.period.1Month", currentLanguage)}
            </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-center">
          {error}
        </div>
      ) : data.length > 0 ? (
        <div className="bg-gradient-to-br from-muted/30 to-transparent rounded-lg p-4 border border-border/30">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              />
              <p className="text-xs text-muted-foreground font-medium">
                {getTranslation("graph.liveUpdating", currentLanguage)}
              </p>
            </div>
            {data.length > 0 && lastUpdated && (
              <p className="text-xs text-muted-foreground">
                {getTranslation("graph.updated", currentLanguage)}: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#6B7280" 
                style={{ fontSize: "11px" }}
                tick={{ fill: "#6B7280" }}
              />
              <YAxis 
                stroke="#6B7280" 
                style={{ fontSize: "11px" }}
                tick={{ fill: "#6B7280" }}
              />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
                labelStyle={{ color: "#1E1E1E", fontWeight: 600 }}
                itemStyle={{ color: "#1E1E1E" }}
          />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
              />
          <Line
            type="monotone"
            dataKey="temp"
            stroke="#5BB462"
                strokeWidth={3}
            name="Temperature (°C)"
                dot={{ fill: "#5BB462", r: 4, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, stroke: "#5BB462", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="moisture"
            stroke="#FFC94A"
                strokeWidth={3}
            name="Moisture (%)"
                dot={{ fill: "#FFC94A", r: 4, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, stroke: "#FFC94A", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="#3B82F6"
                strokeWidth={3}
            name="Humidity (%)"
                dot={{ fill: "#3B82F6", r: 4, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, stroke: "#3B82F6", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
        </div>
      ) : null}
    </motion.section>
  )
}
