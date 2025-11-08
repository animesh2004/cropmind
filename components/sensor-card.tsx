"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

import { getTranslation } from "@/lib/translations"

interface SensorCardProps {
  title: string
  value: string
  unit: string
  icon: LucideIcon
  status: "optimal" | "warning" | "critical"
  language?: string
}

export default function SensorCard({ title, value, unit, icon: Icon, status, language = "en" }: SensorCardProps) {
  const statusColors = {
    optimal: "text-primary",
    warning: "text-amber-500",
    critical: "text-destructive",
  }

  const bgColors = {
    optimal: "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
    warning: "bg-gradient-to-br from-amber-50 via-amber-25 to-transparent",
    critical: "bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent",
  }

  const iconBgColors = {
    optimal: "bg-primary/20",
    warning: "bg-amber-500/20",
    critical: "bg-destructive/20",
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      whileTap={{ scale: 0.97 }}
      className={`${bgColors[status]} border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm relative overflow-hidden`}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${status === "optimal" ? "rgba(91, 180, 98, 0.1)" : status === "warning" ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)"}, transparent 70%)`,
        }}
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <motion.div
            className={`w-12 h-12 rounded-xl ${iconBgColors[status]} flex items-center justify-center shadow-md`}
            animate={{ 
              rotate: status === "optimal" ? [0, 5, -5, 0] : 0,
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut"
            }}
          >
            <Icon className={`w-6 h-6 ${statusColors[status]}`} />
          </motion.div>
          <div className="text-right">
            <motion.div 
              className="text-4xl font-bold text-foreground mb-1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {value}
            </motion.div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{unit}</div>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        
        {/* Status indicator dot */}
        <div className="mt-3 flex items-center gap-2">
          <motion.div
            className={`w-2 h-2 rounded-full ${status === "optimal" ? "bg-primary" : status === "warning" ? "bg-amber-500" : "bg-destructive"}`}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut"
            }}
          />
          <span className="text-xs text-muted-foreground capitalize">
            {getTranslation(`sensor.status.${status}`, language)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
