"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2, FileText, MessageCircle } from "lucide-react"
import { getTranslation } from "@/lib/translations"

type ExportData = {
  timestamp: string
  soilMoisture: number
  temperature: number
  humidity: number
  ph: number
  recommendations?: any
}

export default function DataExport({ language = "en", data }: { language?: string; data?: ExportData }) {
  const [exporting, setExporting] = useState(false)

  const exportToCSV = () => {
    if (!data) return
    
    setExporting(true)
    const csvContent = `Timestamp,Soil Moisture (%),Temperature (°C),Humidity (%),pH\n${data.timestamp},${data.soilMoisture},${data.temperature},${data.humidity},${data.ph}`
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `cropmind-data-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setExporting(false)
  }

  const exportToJSON = () => {
    if (!data) return
    
    setExporting(true)
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `cropmind-data-${new Date().toISOString().split("T")[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setExporting(false)
  }

  const shareViaWhatsApp = () => {
    if (!data) return
    
    const message = language === "hi"
      ? `🌾 CropMind रिपोर्ट\n\nमिट्टी की नमी: ${data.soilMoisture}%\nतापमान: ${data.temperature}°C\nआर्द्रता: ${data.humidity}%\npH: ${data.ph}\n\nसमय: ${new Date(data.timestamp).toLocaleString("hi-IN")}`
      : `🌾 CropMind Report\n\nSoil Moisture: ${data.soilMoisture}%\nTemperature: ${data.temperature}°C\nHumidity: ${data.humidity}%\npH: ${data.ph}\n\nTime: ${new Date(data.timestamp).toLocaleString()}`
    
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }

  const printReport = () => {
    window.print()
  }

  if (!data) return null

  return (
    <Card className="bg-gradient-to-br from-card via-card/50 to-card border border-border/50 rounded-xl p-4 sm:p-6 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5 text-primary" />
          <span>{language === "hi" ? "डेटा निर्यात" : "Export Data"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            onClick={exportToCSV}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button
            onClick={exportToJSON}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">JSON</span>
          </Button>
          <Button
            onClick={shareViaWhatsApp}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button
            onClick={printReport}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

