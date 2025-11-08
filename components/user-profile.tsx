"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Lock, Globe } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTranslation } from "@/lib/translations"

// Only Hindi and English supported for text-to-speech
const supportedLanguages = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
]

export default function UserProfile() {
  const [userName, setUserName] = useState("Animesh")
  const [blynkToken, setBlynkToken] = useState("")
  const [language, setLanguage] = useState("en")
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load from localStorage
    const savedName = localStorage.getItem("cropMind_userName")
    const savedToken = localStorage.getItem("cropMind_blynkToken")
    const savedLang = localStorage.getItem("cropMind_language") || "en"
    if (savedName) setUserName(savedName)
    if (savedToken) setBlynkToken(savedToken)
    if (savedLang) setLanguage(savedLang)
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
    // Dispatch custom event to notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language } }))
    }
    setIsOpen(false)
  }

  if (!mounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
        >
          <User className="w-5 h-5 text-primary" />
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Welcome, {userName} 👋</p>
            <p className="text-xs text-muted-foreground">Blynk Auth Active</p>
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
