"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function UserProfile() {
  const [userName, setUserName] = useState("Animesh")
  const [blynkToken, setBlynkToken] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load from localStorage
    const savedName = localStorage.getItem("cropMind_userName")
    const savedToken = localStorage.getItem("cropMind_blynkToken")
    if (savedName) setUserName(savedName)
    if (savedToken) setBlynkToken(savedToken)
  }, [])

  const handleSave = () => {
    localStorage.setItem("cropMind_userName", userName)
    localStorage.setItem("cropMind_blynkToken", blynkToken)
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
