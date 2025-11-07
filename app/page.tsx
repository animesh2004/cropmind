"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Dashboard from "@/components/dashboard"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import LoadingScreen from "@/components/loading-screen"

export default function Home() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time (similar to Instagram)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500) // 1.5 seconds loading screen

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingScreen key="loading" />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-background flex flex-col"
          >
            <Navbar />
            <div className="flex-1">
              <Dashboard />
            </div>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
