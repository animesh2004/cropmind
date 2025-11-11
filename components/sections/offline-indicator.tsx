"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wifi, WifiOff, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function OfflineIndicator({ language = "en" }: { language?: string }) {
  const [isOnline, setIsOnline] = useState(true)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowAlert(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowAlert(true)
    }

    // Check initial status
    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
            <WifiOff className="h-4 w-4 text-amber-600" />
            <AlertTitle className="font-bold text-amber-900 dark:text-amber-200">
              {language === "hi" ? "ऑफलाइन मोड" : "Offline Mode"}
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              {language === "hi"
                ? "आप ऑफलाइन हैं। अंतिम डेटा दिखाया जा रहा है।"
                : "You're offline. Showing last cached data."}
            </AlertDescription>
            <button
              onClick={() => setShowAlert(false)}
              className="absolute top-2 right-2 text-amber-600 hover:text-amber-800"
            >
              ×
            </button>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

