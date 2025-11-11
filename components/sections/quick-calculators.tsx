"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calculator, Droplet, Beaker, DollarSign, ChevronDown, ChevronUp } from "lucide-react"
import { getTranslation } from "@/lib/translations"

export default function QuickCalculators({ language = "en" }: { language?: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeCalculator, setActiveCalculator] = useState<"irrigation" | "fertilizer" | "cost" | null>(null)

  // Irrigation Calculator
  const [irrigationArea, setIrrigationArea] = useState("")
  const [irrigationDepth, setIrrigationDepth] = useState("")
  const [irrigationResult, setIrrigationResult] = useState<number | null>(null)

  // Fertilizer Calculator
  const [fertilizerArea, setFertilizerArea] = useState("")
  const [fertilizerNPK, setFertilizerNPK] = useState("80-40-40")
  const [fertilizerResult, setFertilizerResult] = useState<any>(null)

  // Cost Calculator
  const [costWater, setCostWater] = useState("")
  const [costFertilizer, setCostFertilizer] = useState("")
  const [costArea, setCostArea] = useState("")
  const [costResult, setCostResult] = useState<number | null>(null)

  const calculateIrrigation = () => {
    const area = parseFloat(irrigationArea)
    const depth = parseFloat(irrigationDepth)
    if (area && depth) {
      // Water required in liters = Area (sq m) × Depth (cm) × 10
      const waterRequired = area * depth * 10
      setIrrigationResult(waterRequired)
    }
  }

  const calculateFertilizer = () => {
    const area = parseFloat(fertilizerArea)
    const [n, p, k] = fertilizerNPK.split("-").map(Number)
    if (area && n && p && k) {
      // Approximate: 1 kg per 100 sq m for NPK ratio
      const nRequired = (area / 100) * (n / 100)
      const pRequired = (area / 100) * (p / 100)
      const kRequired = (area / 100) * (k / 100)
      setFertilizerResult({ n: nRequired, p: pRequired, k: kRequired, total: nRequired + pRequired + kRequired })
    }
  }

  const calculateCost = () => {
    const water = parseFloat(costWater)
    const fertilizer = parseFloat(costFertilizer)
    const area = parseFloat(costArea)
    if (water && fertilizer && area) {
      const totalCost = (water * area) + (fertilizer * area)
      setCostResult(totalCost)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>{language === "hi" ? "क्विक कैलकुलेटर" : "Quick Calculators"}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 space-y-4">
              {/* Irrigation Calculator */}
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <Droplet className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-sm">{language === "hi" ? "सिंचाई कैलकुलेटर" : "Irrigation Calculator"}</h4>
                </div>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder={language === "hi" ? "क्षेत्र (वर्ग मीटर)" : "Area (sq m)"}
                    value={irrigationArea}
                    onChange={(e) => setIrrigationArea(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder={language === "hi" ? "गहराई (सेमी)" : "Depth (cm)"}
                    value={irrigationDepth}
                    onChange={(e) => setIrrigationDepth(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button onClick={calculateIrrigation} size="sm" className="w-full">
                    {language === "hi" ? "गणना करें" : "Calculate"}
                  </Button>
                  {irrigationResult && (
                    <p className="text-xs text-muted-foreground">
                      {language === "hi" ? "पानी की आवश्यकता:" : "Water Required:"} {irrigationResult.toFixed(2)} L
                    </p>
                  )}
                </div>
              </div>

              {/* Fertilizer Calculator */}
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <Beaker className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-sm">{language === "hi" ? "उर्वरक कैलकुलेटर" : "Fertilizer Calculator"}</h4>
                </div>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder={language === "hi" ? "क्षेत्र (वर्ग मीटर)" : "Area (sq m)"}
                    value={fertilizerArea}
                    onChange={(e) => setFertilizerArea(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="text"
                    placeholder="NPK Ratio (e.g., 80-40-40)"
                    value={fertilizerNPK}
                    onChange={(e) => setFertilizerNPK(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button onClick={calculateFertilizer} size="sm" className="w-full">
                    {language === "hi" ? "गणना करें" : "Calculate"}
                  </Button>
                  {fertilizerResult && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>N: {fertilizerResult.n.toFixed(2)} kg</p>
                      <p>P: {fertilizerResult.p.toFixed(2)} kg</p>
                      <p>K: {fertilizerResult.k.toFixed(2)} kg</p>
                      <p className="font-semibold">{language === "hi" ? "कुल:" : "Total:"} {fertilizerResult.total.toFixed(2)} kg</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Calculator */}
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-sm">{language === "hi" ? "लागत कैलकुलेटर" : "Cost Calculator"}</h4>
                </div>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder={language === "hi" ? "पानी की लागत/वर्ग मीटर" : "Water Cost/sq m"}
                    value={costWater}
                    onChange={(e) => setCostWater(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder={language === "hi" ? "उर्वरक लागत/वर्ग मीटर" : "Fertilizer Cost/sq m"}
                    value={costFertilizer}
                    onChange={(e) => setCostFertilizer(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder={language === "hi" ? "क्षेत्र (वर्ग मीटर)" : "Area (sq m)"}
                    value={costArea}
                    onChange={(e) => setCostArea(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button onClick={calculateCost} size="sm" className="w-full">
                    {language === "hi" ? "गणना करें" : "Calculate"}
                  </Button>
                  {costResult && (
                    <p className="text-xs text-muted-foreground font-semibold">
                      {language === "hi" ? "कुल लागत:" : "Total Cost:"} ₹{costResult.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

