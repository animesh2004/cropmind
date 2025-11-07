"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, Settings, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { requestNotificationPermission } from "@/lib/notifications"
import { monitoringService } from "@/lib/monitoring-service"

export default function NotificationSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [periodicAlerts, setPeriodicAlerts] = useState(true)
  const [instantAlerts, setInstantAlerts] = useState(true)
  const [monitoringEnabled, setMonitoringEnabled] = useState(false)
  const [saving, setSaving] = useState(false)

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

    if (savedPeriodic !== null) setPeriodicAlerts(savedPeriodic === "true")
    if (savedInstant !== null) setInstantAlerts(savedInstant === "true")
    if (savedEnabled !== null) setMonitoringEnabled(savedEnabled === "true")

    // Initialize monitoring service
    if (savedEnabled === "true") {
      monitoringService.initialize({
        enabled: true,
        periodicAlerts: savedPeriodic !== "false",
        instantAlerts: savedInstant !== "false",
        checkInterval: 600000, // 10 minutes
      })
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

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem("cropMind_periodicAlerts", periodicAlerts.toString())
      localStorage.setItem("cropMind_instantAlerts", instantAlerts.toString())
      localStorage.setItem("cropMind_monitoringEnabled", monitoringEnabled.toString())

      // Update monitoring service
      await monitoringService.initialize({
        enabled: monitoringEnabled,
        periodicAlerts,
        instantAlerts,
        checkInterval: 600000, // 10 minutes
      })

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notification & Alert Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
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

