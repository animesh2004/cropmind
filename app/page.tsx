"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Dashboard from "@/components/dashboard"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import LoadingScreen from "@/components/loading-screen"
import LanguageSelector from "@/components/language-selector"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const [language, setLanguage] = useState("en")

  useEffect(() => {
    // Check for saved language preference
    const savedLang = localStorage.getItem("cropMind_language") || "en"
    setLanguage(savedLang)
    
    // Listen for language changes from profile
    const handleLanguageChange = (event: CustomEvent) => {
      const newLang = (event as CustomEvent<{ language: string }>).detail.language
      setLanguage(newLang)
    }

    window.addEventListener("languageChanged", handleLanguageChange as EventListener)

    // Skip language selector if already chosen
    if (savedLang) {
      const timer = setTimeout(() => {
        setLoading(false)
      }, 1500)
      return () => {
        clearTimeout(timer)
        window.removeEventListener("languageChanged", handleLanguageChange as EventListener)
      }
    } else {
      // Show language selector after loading
      const timer = setTimeout(() => {
        setLoading(false)
        setShowLanguageSelector(true)
      }, 1500)
      return () => {
        clearTimeout(timer)
        window.removeEventListener("languageChanged", handleLanguageChange as EventListener)
      }
    }
  }, [])

  const handleLanguageSelect = (lang: string) => {
    setLanguage(lang)
    setShowLanguageSelector(false)
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingScreen key="loading" />
        ) : showLanguageSelector ? (
          <LanguageSelector key="language" onSelect={handleLanguageSelect} />
        ) : (
          <motion.div
            key={`content-${language}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-background flex flex-col"
          >
            <Navbar language={language} />
            <div className="flex-1">
              <Dashboard language={language} />
            </div>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
