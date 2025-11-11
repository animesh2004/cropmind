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
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-all group min-w-0 flex-shrink">
          <motion.div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow flex-shrink-0"
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Leaf className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
          </motion.div>
          <div className="min-w-0 flex-shrink">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
              {getTranslation("app.title", language)}
            </h1>
            <p className="text-xs text-muted-foreground font-medium hidden sm:block">{getTranslation("app.subtitle", language)}</p>
          </div>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
          <ThemeToggle />
          <NotificationSettings />
          <UserProfile />
        </div>
      </div>
    </motion.nav>
  )
}
