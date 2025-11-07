"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { HelpCircle } from "lucide-react"

const crops = [
  { name: "Rice", color: "bg-yellow-100" },
  { name: "Wheat", color: "bg-amber-100" },
  { name: "Sugarcane", color: "bg-green-100" },
  { name: "Cotton", color: "bg-blue-100" },
  { name: "Jute", color: "bg-orange-100" },
  { name: "Groundnut", color: "bg-red-100" },
  { name: "Maize", color: "bg-yellow-100" },
  { name: "Mustard", color: "bg-purple-100" },
]

export default function CropConditionGuide() {
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut", delay: 0.3 }}
      className="bg-card border border-border rounded-lg p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold text-foreground mb-2">Crop Condition Guide</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Select a crop to see its ideal growing conditions from our AI assistant.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {crops.map((crop) => (
          <motion.button
            key={crop.name}
            onClick={() => setSelectedCrop(selectedCrop === crop.name ? null : crop.name)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              selectedCrop === crop.name
                ? "bg-primary text-primary-foreground"
                : `${crop.color} text-foreground hover:shadow-md`
            }`}
          >
            {crop.name}
          </motion.button>
        ))}
      </div>

      {!selectedCrop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <HelpCircle className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Select a crop to see its ideal conditions.</p>
        </motion.div>
      )}

      {selectedCrop && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-muted p-4 rounded-md">
          <p className="text-foreground font-medium mb-2">{selectedCrop} - Ideal Conditions:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Soil Moisture: 50-65%</li>
            <li>• Temperature: 20-30°C</li>
            <li>• Humidity: 55-75%</li>
          </ul>
        </motion.div>
      )}
    </motion.section>
  )
}
