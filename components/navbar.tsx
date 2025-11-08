"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Leaf } from "lucide-react"
import UserProfile from "./user-profile"
import NotificationSettings from "./notification-settings"
import { ThemeToggle } from "./theme-toggle"
import { getTranslation } from "@/lib/translations"

export default function Navbar({ language = "en" }: { language?: string }) {
  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-lg"
    >
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all group">
          <motion.div 
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Leaf className="w-7 h-7 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {getTranslation("app.title", language)}
            </h1>
            <p className="text-xs text-muted-foreground font-medium">{getTranslation("app.subtitle", language)}</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationSettings />
          <UserProfile />
        </div>
      </div>
    </motion.nav>
  )
}
