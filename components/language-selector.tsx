"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Check } from "lucide-react"
import { getTranslation } from "@/lib/translations"

const indianLanguages = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
]

export default function LanguageSelector({ onSelect }: { onSelect: (lang: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [currentLang, setCurrentLang] = useState("en")

  const handleSelect = (code: string) => {
    setSelected(code)
    setCurrentLang(code)
    setTimeout(() => {
      localStorage.setItem("cropMind_language", code)
      onSelect(code)
    }, 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-3xl mx-4"
      >
        <Card className="border-2 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Globe className="w-8 h-8 text-primary" />
              <CardTitle className="text-3xl">{getTranslation("language.select", currentLang)}</CardTitle>
            </div>
            <CardDescription className="text-lg">
              {getTranslation("language.description", currentLang)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {indianLanguages.map((lang) => (
                <motion.div
                  key={lang.code}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={selected === lang.code ? "default" : "outline"}
                    className={`w-full h-24 flex flex-col items-center justify-center gap-2 relative ${
                      selected === lang.code ? "bg-primary text-primary-foreground" : ""
                    }`}
                    onClick={() => handleSelect(lang.code)}
                  >
                    <span className="text-3xl">{lang.flag}</span>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-semibold">{lang.nativeName}</span>
                      <span className="text-xs opacity-80">{lang.name}</span>
                    </div>
                    {selected === lang.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}


