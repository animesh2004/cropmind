"use client"

import { motion } from "framer-motion"
import { GraduationCap } from "lucide-react"

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mt-0 border-t border-border/50 bg-gradient-to-br from-card/50 via-card/30 to-card/50 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
          <motion.div
            className="flex items-center gap-2 flex-wrap justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <p className="text-xs sm:text-sm text-muted-foreground font-medium break-words leading-relaxed">
              <span className="text-foreground font-semibold">CropMind</span> - Final Year Project by{" "}
              <span className="text-primary font-semibold">Group 16</span> under the supervision of{" "}
              <span className="text-primary font-semibold">Dr. Dinesh Kumar Kotary</span>
            </p>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  )
}

