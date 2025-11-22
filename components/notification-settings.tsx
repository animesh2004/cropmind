"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, Settings, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { requestNotificationPermission } from "@/lib/notifications"
import { monitoringService } from "@/lib/monitoring-service"

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

export default function NotificationSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [periodicAlerts, setPeriodicAlerts] = useState(true)
  const [instantAlerts, setInstantAlerts] = useState(true)
  const [monitoringEnabled, setMonitoringEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isThresholdsOpen, setIsThresholdsOpen] = useState(false)
  const [language, setLanguage] = useState("en")
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
    // Check notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }

    // Load saved settings
    const savedPeriodic = localStorage.getItem("cropMind_periodicAlerts")
    const savedInstant = localStorage.getItem("cropMind_instantAlerts")
    const savedEnabled = localStorage.getItem("cropMind_monitoringEnabled")
    const savedLang = localStorage.getItem("cropMind_language") || "en"

    if (savedPeriodic !== null) setPeriodicAlerts(savedPeriodic === "true")
    if (savedInstant !== null) setInstantAlerts(savedInstant === "true")
    if (savedEnabled !== null) setMonitoringEnabled(savedEnabled === "true")
    if (savedLang) setLanguage(savedLang)

    // Load thresholds from localStorage
    const savedThresholds = localStorage.getItem("cropMind_alertThresholds")
    if (savedThresholds) {
      try {
        const parsed = JSON.parse(savedThresholds)
        setThresholds(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        // Use defaults
      }
    }

    // Initialize monitoring service
    if (savedEnabled === "true") {
      monitoringService.initialize({
        enabled: true,
        periodicAlerts: savedPeriodic !== "false",
        instantAlerts: savedInstant !== "false",
        checkInterval: 600000, // 10 minutes
      })
    }

    // Listen for language changes
    const handleLanguageChange = (event: CustomEvent) => {
      const newLang = (event as CustomEvent<{ language: string }>).detail.language
      setLanguage(newLang)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("languageChanged", handleLanguageChange as EventListener)
      return () => {
        window.removeEventListener("languageChanged", handleLanguageChange as EventListener)
      }
    }
  }, [])

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      setNotificationPermission("granted")
    } else {
      setNotificationPermission("denied")
    }
  }

  const updateThreshold = (key: keyof AlertThresholds, value: number | boolean) => {
    setThresholds(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem("cropMind_periodicAlerts", periodicAlerts.toString())
      localStorage.setItem("cropMind_instantAlerts", instantAlerts.toString())
      localStorage.setItem("cropMind_monitoringEnabled", monitoringEnabled.toString())
      localStorage.setItem("cropMind_alertThresholds", JSON.stringify(thresholds))

      // Update monitoring service
      await monitoringService.initialize({
        enabled: monitoringEnabled,
        periodicAlerts,
        instantAlerts,
        checkInterval: 600000, // 10 minutes
      })

      // Dispatch event to notify other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("thresholdsUpdated", { detail: thresholds }))
      }

      setIsOpen(false)
    } catch (error) {
      console.error("Error saving notification settings:", error)
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <Bell className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Notifications</span>
        </motion.button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notification & Alert Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4 overflow-y-auto flex-1 pr-2">
          {/* Browser Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">Browser Notifications with Sound</Label>
              {notificationPermission === "granted" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs">Enabled</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs">Not Enabled</span>
                </div>
              )}
            </div>
            {notificationPermission !== "granted" && (
              <Button onClick={handleRequestPermission} variant="outline" size="sm" className="w-full">
                Request Permission
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Notifications will play sound alerts. Urgent alerts (fire/animal) play double beeps.
            </p>
          </div>

          {/* Monitoring Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-sm font-medium text-foreground">Enable Monitoring</Label>
              <p className="text-xs text-muted-foreground">Start automatic monitoring and alerts</p>
            </div>
            <Switch checked={monitoringEnabled} onCheckedChange={setMonitoringEnabled} />
          </div>

          {/* Alert Types */}
          {monitoringEnabled && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-foreground">Periodic Alerts</Label>
                  <p className="text-xs text-muted-foreground">Every 10 minutes</p>
                </div>
                <Switch checked={periodicAlerts} onCheckedChange={setPeriodicAlerts} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-foreground">Instant Alerts</Label>
                  <p className="text-xs text-muted-foreground">Fire & Animal Detection</p>
                </div>
                <Switch checked={instantAlerts} onCheckedChange={setInstantAlerts} />
              </div>
            </div>
          )}

          {/* Alert Threshold Settings */}
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
            disabled={saving}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

