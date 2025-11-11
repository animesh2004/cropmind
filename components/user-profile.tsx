"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Lock, Globe, Bell, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTranslation } from "@/lib/translations"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"

// Only Hindi and English supported for text-to-speech
const supportedLanguages = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
]

type AlertThresholds = {
  soilMoistureMin: number
  soilMoistureMax: number
  temperatureMin: number
  temperatureMax: number
  humidityMin: number
  humidityMax: number
  phMin: number
  phMax: number
  alertsEnabled: boolean
  singleBeepEnabled: boolean
  doubleBeepEnabled: boolean
}

export default function UserProfile() {
  const [userName, setUserName] = useState("Animesh")
  const [blynkToken, setBlynkToken] = useState("")
  const [language, setLanguage] = useState("en")
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isThresholdsOpen, setIsThresholdsOpen] = useState(false)
  const [thresholds, setThresholds] = useState<AlertThresholds>({
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
  })

  useEffect(() => {
    setMounted(true)
    // Load from localStorage
    const savedName = localStorage.getItem("cropMind_userName")
    const savedToken = localStorage.getItem("cropMind_blynkToken")
    const savedLang = localStorage.getItem("cropMind_language") || "en"
    if (savedName) setUserName(savedName)
    if (savedToken) setBlynkToken(savedToken)
    if (savedLang) setLanguage(savedLang)
    
    // Load thresholds from localStorage
    const savedThresholds = localStorage.getItem("cropMind_alertThresholds")
    if (savedThresholds) {
      try {
        const parsed = JSON.parse(savedThresholds)
        setThresholds({ ...thresholds, ...parsed })
      } catch (e) {
        // Use defaults
      }
    }
  }, [])

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    localStorage.setItem("cropMind_language", newLang)
    // Dispatch custom event to notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language: newLang } }))
    }
  }

  const handleSave = () => {
    localStorage.setItem("cropMind_userName", userName)
    localStorage.setItem("cropMind_blynkToken", blynkToken)
    localStorage.setItem("cropMind_language", language)
    localStorage.setItem("cropMind_alertThresholds", JSON.stringify(thresholds))
    // Dispatch custom event to notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language } }))
      window.dispatchEvent(new CustomEvent("thresholdsUpdated", { detail: thresholds }))
    }
    setIsOpen(false)
  }
  
  const updateThreshold = (key: keyof AlertThresholds, value: number | boolean) => {
    setThresholds(prev => ({ ...prev, [key]: value }))
  }

  if (!mounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <div className="text-left min-w-0 hidden sm:block">
            <p className="text-sm font-medium text-foreground truncate">Welcome, {userName} 👋</p>
            <p className="text-xs text-muted-foreground truncate">Blynk Auth Active</p>
          </div>
          <div className="text-left min-w-0 sm:hidden">
            <p className="text-xs font-medium text-foreground truncate">{userName}</p>
          </div>
        </motion.button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile & IoT Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Name</label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Blynk Auth Token
            </label>
            <Input
              value={blynkToken}
              onChange={(e) => setBlynkToken(e.target.value)}
              placeholder="Paste your Blynk token here"
              type="password"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">Get your token from Blynk App (Settings → Auth Token)</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Preferred Language
            </label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="bg-background w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                      <span className="text-muted-foreground text-xs">({lang.name})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This language will be used for text-to-speech and all UI elements
            </p>
          </div>

          {/* Alert Thresholds Section */}
          <Collapsible open={isThresholdsOpen} onOpenChange={setIsThresholdsOpen}>
            <CollapsibleTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {language === "hi" ? "अलर्ट थ्रेशोल्ड सेटिंग्स" : "Alert Threshold Settings"}
                  </span>
                </div>
                {isThresholdsOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </motion.button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="alertsEnabled"
                    checked={thresholds.alertsEnabled}
                    onChange={(e) => updateThreshold("alertsEnabled", e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="alertsEnabled" className="text-sm font-medium text-foreground cursor-pointer">
                    {language === "hi" ? "अलर्ट सक्षम करें" : "Enable Alerts"}
                  </label>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                    {language === "hi" ? "🔊 बीप सेटिंग्स" : "🔊 Beep Settings"}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 font-medium">
                        <span>🔊🔊🔊</span>
                        <span>{language === "hi" ? "ट्रिपल बीप (अनिवार्य)" : "Triple Beep (Compulsory)"}</span>
                      </div>
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">
                        {language === "hi" ? "सदैव चालू" : "Always On"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded">
                      <input
                        type="checkbox"
                        id="doubleBeepEnabled"
                        checked={thresholds.doubleBeepEnabled}
                        onChange={(e) => updateThreshold("doubleBeepEnabled", e.target.checked)}
                        className="w-4 h-4 rounded border-border"
                        disabled={!thresholds.alertsEnabled}
                      />
                      <label htmlFor="doubleBeepEnabled" className={`text-xs font-medium cursor-pointer ${!thresholds.alertsEnabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                        🔊🔊 {language === "hi" ? "डबल बीप (क्रिटिकल अलर्ट)" : "Double Beep (Critical Alerts)"}
                      </label>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded">
                      <input
                        type="checkbox"
                        id="singleBeepEnabled"
                        checked={thresholds.singleBeepEnabled}
                        onChange={(e) => updateThreshold("singleBeepEnabled", e.target.checked)}
                        className="w-4 h-4 rounded border-border"
                        disabled={!thresholds.alertsEnabled}
                      />
                      <label htmlFor="singleBeepEnabled" className={`text-xs font-medium cursor-pointer ${!thresholds.alertsEnabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                        🔊 {language === "hi" ? "सिंगल बीप (चेतावनी)" : "Single Beep (Warnings)"}
                      </label>
                    </div>
                  </div>
                </div>
                
                {!thresholds.alertsEnabled && (
                  <p className="text-xs text-muted-foreground px-2">
                    {language === "hi" ? "अलर्ट सक्षम करने के बाद बीप सेटिंग उपलब्ध होगी" : "Beep settings available after enabling alerts"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Soil Moisture Thresholds */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    {language === "hi" ? "मिट्टी की नमी (न्यूनतम %)" : "Soil Moisture (Min %)"}
                  </label>
                  <Input
                    type="number"
                    value={thresholds.soilMoistureMin}
                    onChange={(e) => updateThreshold("soilMoistureMin", parseFloat(e.target.value) || 0)}
                    className="bg-background text-sm"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    {language === "hi" ? "मिट्टी की नमी (अधिकतम %)" : "Soil Moisture (Max %)"}
                  </label>
                  <Input
                    type="number"
                    value={thresholds.soilMoistureMax}
                    onChange={(e) => updateThreshold("soilMoistureMax", parseFloat(e.target.value) || 100)}
                    className="bg-background text-sm"
                    min="0"
                    max="100"
                  />
                </div>

                {/* Temperature Thresholds */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    {language === "hi" ? "तापमान (न्यूनतम °C)" : "Temperature (Min °C)"}
                  </label>
                  <Input
                    type="number"
                    value={thresholds.temperatureMin}
                    onChange={(e) => updateThreshold("temperatureMin", parseFloat(e.target.value) || 0)}
                    className="bg-background text-sm"
                    min="-10"
                    max="50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    {language === "hi" ? "तापमान (अधिकतम °C)" : "Temperature (Max °C)"}
                  </label>
                  <Input
                    type="number"
                    value={thresholds.temperatureMax}
                    onChange={(e) => updateThreshold("temperatureMax", parseFloat(e.target.value) || 50)}
                    className="bg-background text-sm"
                    min="0"
                    max="60"
                  />
                </div>

                {/* Humidity Thresholds */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    {language === "hi" ? "आर्द्रता (न्यूनतम %)" : "Humidity (Min %)"}
                  </label>
                  <Input
                    type="number"
                    value={thresholds.humidityMin}
                    onChange={(e) => updateThreshold("humidityMin", parseFloat(e.target.value) || 0)}
                    className="bg-background text-sm"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    {language === "hi" ? "आर्द्रता (अधिकतम %)" : "Humidity (Max %)"}
                  </label>
                  <Input
                    type="number"
                    value={thresholds.humidityMax}
                    onChange={(e) => updateThreshold("humidityMax", parseFloat(e.target.value) || 100)}
                    className="bg-background text-sm"
                    min="0"
                    max="100"
                  />
                </div>

                {/* pH Thresholds */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    {language === "hi" ? "pH (न्यूनतम)" : "pH (Min)"}
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={thresholds.phMin}
                    onChange={(e) => updateThreshold("phMin", parseFloat(e.target.value) || 0)}
                    className="bg-background text-sm"
                    min="0"
                    max="14"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    {language === "hi" ? "pH (अधिकतम)" : "pH (Max)"}
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={thresholds.phMax}
                    onChange={(e) => updateThreshold("phMax", parseFloat(e.target.value) || 14)}
                    className="bg-background text-sm"
                    min="0"
                    max="14"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    {language === "hi" 
                      ? "अलर्ट तब ट्रिगर होगा जब कोई मान इन सीमाओं से बाहर हो जाए।"
                      : "Alerts will trigger when any value goes outside these thresholds."}
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Save Configuration
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
