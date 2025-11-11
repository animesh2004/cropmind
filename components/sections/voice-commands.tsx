"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, ChevronDown, ChevronUp } from "lucide-react"
import { getTranslation } from "@/lib/translations"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function VoiceCommands({ language = "en", onCommand }: { language?: string; onCommand?: (command: string) => void }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [recognition, setRecognition] = useState<any>(null)
  const [isExamplesOpen, setIsExamplesOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(language)

  // Listen for language changes and update from localStorage
  useEffect(() => {
    // Get initial language from localStorage
    const savedLang = localStorage.getItem("cropMind_language") || language || "en"
    setCurrentLanguage(savedLang)

    // Listen for language change events
    const handleLanguageChange = (event: CustomEvent) => {
      const newLang = (event as CustomEvent<{ language: string }>).detail.language
      setCurrentLanguage(newLang)
    }

    window.addEventListener("languageChanged", handleLanguageChange as EventListener)

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChange as EventListener)
    }
  }, [language])

  // Update currentLanguage when prop changes
  useEffect(() => {
    setCurrentLanguage(language)
  }, [language])

  // Helper function to translate weather conditions to Hindi
  const translateWeatherCondition = (condition: string): string => {
    if (currentLanguage !== "hi") return condition
    
    const conditionLower = condition.toLowerCase()
    const translations: Record<string, string> = {
      "clear": "साफ",
      "sunny": "धूप",
      "partly cloudy": "आंशिक रूप से बादल",
      "cloudy": "बादल",
      "overcast": "घने बादल",
      "mist": "धुंध",
      "fog": "कोहरा",
      "light rain": "हल्की बारिश",
      "moderate rain": "मध्यम बारिश",
      "heavy rain": "भारी बारिश",
      "drizzle": "बूंदाबांदी",
      "shower": "बौछार",
      "thunderstorm": "तूफान",
      "snow": "बर्फ",
      "hail": "ओलावृष्टि",
      "windy": "तूफानी हवा",
      "storm": "तूफान",
    }
    
    // Try exact match first
    if (translations[conditionLower]) {
      return translations[conditionLower]
    }
    
    // Try partial matches
    for (const [key, value] of Object.entries(translations)) {
      if (conditionLower.includes(key)) {
        return value
      }
    }
    
    // Return original if no translation found
    return condition
  }

  // Define speakResponse function
  const speakResponse = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      // Get current language from localStorage to ensure we have the latest value
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      utterance.lang = lang === "hi" ? "hi-IN" : "en-IN"
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.onend = () => {
        // After speaking, start listening if still in listening mode
        if (isListening && recognition) {
          try {
            recognition.start()
          } catch (e) {
            // Already started or error
          }
        }
      }
      window.speechSynthesis.speak(utterance)
    }
  }

  // Helper function to get contextual advice for moisture
  const getMoistureAdvice = (moisture: number, lang: string): string => {
    if (moisture < 10) {
      return lang === "hi"
        ? "मिट्टी बहुत सूखी है। तुरंत पानी दें। फसलों को नुकसान हो सकता है।"
        : "Soil is very dry. Water immediately. Crops may be damaged."
    } else if (moisture < 20) {
      return lang === "hi"
        ? "मिट्टी सूखी है। जल्दी पानी दें। आज सिंचाई करें।"
        : "Soil is dry. Water soon. Irrigate today."
    } else if (moisture < 40) {
      return lang === "hi"
        ? "मिट्टी की नमी कम है। 2-3 दिनों में सिंचाई करें।"
        : "Soil moisture is low. Irrigate in 2-3 days."
    } else if (moisture < 70) {
      return lang === "hi"
        ? "मिट्टी की नमी अच्छी है। नियमित रूप से निगरानी करें।"
        : "Soil moisture is good. Monitor regularly."
    } else if (moisture < 85) {
      return lang === "hi"
        ? "मिट्टी में पर्याप्त नमी है। अभी सिंचाई की जरूरत नहीं है।"
        : "Soil has sufficient moisture. No irrigation needed now."
    } else {
      return lang === "hi"
        ? "मिट्टी बहुत गीली है। जल निकासी की जांच करें। अधिक पानी से जड़ें सड़ सकती हैं।"
        : "Soil is very wet. Check drainage. Too much water can rot roots."
    }
  }

  // Helper function to get contextual advice for temperature
  const getTemperatureAdvice = (temp: number, lang: string): string => {
    if (temp < 5) {
      return lang === "hi"
        ? "तापमान बहुत कम है। फसलों को ठंड से बचाएं। प्लास्टिक शीट या छाया का उपयोग करें।"
        : "Temperature is very low. Protect crops from cold. Use plastic sheets or shade."
    } else if (temp < 15) {
      return lang === "hi"
        ? "तापमान कम है। नाजुक फसलों को ढकें।"
        : "Temperature is low. Cover delicate crops."
    } else if (temp >= 15 && temp <= 30) {
      return lang === "hi"
        ? "तापमान आदर्श है। फसलों के लिए बहुत अच्छा है।"
        : "Temperature is ideal. Very good for crops."
    } else if (temp > 30 && temp <= 35) {
      return lang === "hi"
        ? "तापमान थोड़ा अधिक है। नियमित रूप से पानी दें।"
        : "Temperature is slightly high. Water regularly."
    } else if (temp > 35 && temp <= 40) {
      return lang === "hi"
        ? "तापमान अधिक है। फसलों को छाया दें। दिन में दो बार पानी दें।"
        : "Temperature is high. Provide shade to crops. Water twice a day."
    } else {
      return lang === "hi"
        ? "तापमान बहुत अधिक है। तुरंत छाया और पानी दें। फसलों को गर्मी से बचाएं।"
        : "Temperature is very high. Provide shade and water immediately. Protect crops from heat."
    }
  }

  // Helper function to get contextual advice for pH
  const getPhAdvice = (ph: number, lang: string): string => {
    if (ph < 5.5) {
      return lang === "hi"
        ? "मिट्टी बहुत अम्लीय है। चूना या डोलोमाइट मिलाएं।"
        : "Soil is very acidic. Add lime or dolomite."
    } else if (ph < 6.0) {
      return lang === "hi"
        ? "मिट्टी अम्लीय है। थोड़ा चूना मिलाएं।"
        : "Soil is acidic. Add some lime."
    } else if (ph >= 6.0 && ph <= 7.5) {
      return lang === "hi"
        ? "मिट्टी का पी एच आदर्श है। अधिकांश फसलों के लिए उपयुक्त है।"
        : "Soil pH is ideal. Suitable for most crops."
    } else if (ph > 7.5 && ph <= 8.0) {
      return lang === "hi"
        ? "मिट्टी थोड़ी क्षारीय है। जैविक खाद मिलाएं।"
        : "Soil is slightly alkaline. Add organic compost."
    } else {
      return lang === "hi"
        ? "मिट्टी क्षारीय है। जैविक खाद और सल्फर मिलाएं।"
        : "Soil is alkaline. Add organic compost and sulfur."
    }
  }

  // Helper function to get contextual advice for humidity
  const getHumidityAdvice = (humidity: number, lang: string): string => {
    if (humidity < 30) {
      return lang === "hi"
        ? "आर्द्रता बहुत कम है। पत्तियों पर पानी छिड़कें। फसलों को सूखे से बचाएं।"
        : "Humidity is very low. Spray water on leaves. Protect crops from dryness."
    } else if (humidity < 50) {
      return lang === "hi"
        ? "आर्द्रता कम है। नियमित रूप से पानी दें।"
        : "Humidity is low. Water regularly."
    } else if (humidity >= 50 && humidity <= 70) {
      return lang === "hi"
        ? "आर्द्रता अच्छी है। फसलों के लिए उपयुक्त है।"
        : "Humidity is good. Suitable for crops."
    } else if (humidity > 70 && humidity <= 85) {
      return lang === "hi"
        ? "आर्द्रता अधिक है। फंगस की रोकथाम करें। हवा का संचार बढ़ाएं।"
        : "Humidity is high. Prevent fungus. Increase air circulation."
    } else {
      return lang === "hi"
        ? "आर्द्रता बहुत अधिक है। फंगस का खतरा है। तुरंत हवा का संचार बढ़ाएं।"
        : "Humidity is very high. Risk of fungus. Increase air circulation immediately."
    }
  }

  // Helper function to get overall status with actionable advice
  const getOverallStatus = (sensorData: any, lang: string): string => {
    const issues: string[] = []
    const advice: string[] = []

    // Check moisture
    if (sensorData.soilMoisture < 20) {
      issues.push(lang === "hi" ? "नमी कम" : "low moisture")
      advice.push(lang === "hi" ? "पानी दें" : "water now")
    } else if (sensorData.soilMoisture > 85) {
      issues.push(lang === "hi" ? "नमी अधिक" : "high moisture")
      advice.push(lang === "hi" ? "जल निकासी जांचें" : "check drainage")
    }

    // Check temperature
    if (sensorData.temperature > 35) {
      issues.push(lang === "hi" ? "तापमान अधिक" : "high temperature")
      advice.push(lang === "hi" ? "छाया दें" : "provide shade")
    } else if (sensorData.temperature < 10) {
      issues.push(lang === "hi" ? "तापमान कम" : "low temperature")
      advice.push(lang === "hi" ? "फसलों को ढकें" : "cover crops")
    }

    // Check pH
    if (sensorData.ph < 6.0 || sensorData.ph > 7.5) {
      issues.push(lang === "hi" ? "पी एच अनुचित" : "pH not ideal")
      advice.push(lang === "hi" ? "मिट्टी सुधार करें" : "improve soil")
    }

    // Check humidity
    if (sensorData.humidity < 40) {
      issues.push(lang === "hi" ? "आर्द्रता कम" : "low humidity")
      advice.push(lang === "hi" ? "पानी छिड़कें" : "spray water")
    } else if (sensorData.humidity > 80) {
      issues.push(lang === "hi" ? "आर्द्रता अधिक" : "high humidity")
      advice.push(lang === "hi" ? "हवा का संचार बढ़ाएं" : "increase air circulation")
    }

    if (issues.length === 0) {
      return lang === "hi"
        ? "सभी मान आदर्श हैं। आपकी फसलें स्वस्थ हैं। नियमित रूप से निगरानी जारी रखें।"
        : "All values are ideal. Your crops are healthy. Continue regular monitoring."
    } else {
      const issuesText = issues.join(", ")
      const adviceText = advice.join(", ")
      return lang === "hi"
        ? `कुछ समस्याएं हैं: ${issuesText}। कार्रवाई: ${adviceText}।`
        : `Some issues: ${issuesText}. Actions: ${adviceText}.`
    }
  }

  // Knowledge base for CropMind features and general questions
  const getCropMindKnowledge = (question: string, lang: string): string | null => {
    const lowerQ = question.toLowerCase()
    
    // What is CropMind / CropMind क्या है
    if (lowerQ.includes("cropmind") || lowerQ.includes("क्रॉपमाइंड") || 
        lowerQ.includes("यह क्या है") || lowerQ.includes("what is this") ||
        lowerQ.includes("what is cropmind") || lowerQ.includes("what is crop mind") ||
        lowerQ.includes("क्या है यह") || lowerQ.includes("क्या करता है") ||
        lowerQ.includes("tell me about cropmind") || lowerQ.includes("cropmind के बारे में")) {
      return lang === "hi"
        ? "CropMind एक स्मार्ट कृषि डैशबोर्ड है जो आपको वास्तविक समय में मिट्टी की नमी, तापमान, आर्द्रता, और पी एच जैसे पर्यावरणीय मानों की निगरानी करने में मदद करता है। यह AI-संचालित फसल सिफारिशें, मौसम जानकारी, सुरक्षा अलर्ट, वॉइस कमांड, ऐतिहासिक डेटा विश्लेषण, और CSV डाउनलोड जैसी सुविधाएं प्रदान करता है। यह IoT सेंसर के साथ काम करता है और किसानों को बेहतर फसल प्रबंधन में मदद करता है।"
        : "CropMind is a smart agriculture dashboard that helps you monitor environmental values like soil moisture, temperature, humidity, and pH in real-time. It provides features like AI-powered crop recommendations, weather information, security alerts, voice commands, historical data analysis, and CSV downloads. It works with IoT sensors and helps farmers with better crop management."
    }
    
    // How to use / कैसे उपयोग करें
    if (lowerQ.includes("how to use") || lowerQ.includes("कैसे उपयोग") || 
        lowerQ.includes("how do i use") || lowerQ.includes("how to use cropmind") ||
        lowerQ.includes("कैसे इस्तेमाल") || lowerQ.includes("कैसे करें") ||
        lowerQ.includes("how do i") || lowerQ.includes("कैसे") ||
        lowerQ.includes("usage") || lowerQ.includes("उपयोग")) {
      return lang === "hi"
        ? "CropMind का उपयोग करने के लिए: 1) प्रोफाइल आइकन पर क्लिक करें और अपना Blynk टोकन सेट करें, 2) पर्यावरण निगरानी सेक्शन में वास्तविक समय सेंसर डेटा देखें, 3) AI सिफारिशें सेक्शन में फसल, उर्वरक, और सिंचाई सुझाव प्राप्त करें, 4) वॉइस कमांड से किसी भी प्रश्न पूछें जैसे 'मिट्टी की नमी क्या है', 5) अलर्ट सेटिंग्स में अपनी सीमाएं सेट करें, 6) ऐतिहासिक डेटा से रुझान देखें, 7) मौसम जानकारी जांचें।"
        : "To use CropMind: 1) Click profile icon and set your Blynk token, 2) View real-time sensor data in Environmental Monitoring section, 3) Get crop, fertilizer, and irrigation suggestions in AI Recommendations section, 4) Ask any question using Voice Commands like 'What is soil moisture', 5) Set your thresholds in Alert Settings, 6) View trends from Historical Data, 7) Check weather information."
    }
    
    // What is soil moisture / मिट्टी की नमी क्या है
    if ((lowerQ.includes("what is") || lowerQ.includes("क्या है")) && 
        (lowerQ.includes("moisture") || lowerQ.includes("नमी") || lowerQ.includes("soil") || lowerQ.includes("मिट्टी"))) {
      return lang === "hi"
        ? "मिट्टी की नमी मिट्टी में पानी की मात्रा है, जो प्रतिशत में मापी जाती है। 30-70 प्रतिशत आदर्श है। कम नमी से फसलें सूख सकती हैं, और अधिक नमी से जड़ें सड़ सकती हैं।"
        : "Soil moisture is the amount of water in the soil, measured in percentage. 30-70 percent is ideal. Low moisture can dry crops, and high moisture can rot roots."
    }
    
    // What is pH / पी एच क्या है
    if ((lowerQ.includes("what is") || lowerQ.includes("क्या है")) && 
        (lowerQ.includes("ph") || lowerQ.includes("पीएच") || lowerQ.includes("पी एच"))) {
      return lang === "hi"
        ? "पी एच मिट्टी की अम्लीयता या क्षारीयता का माप है, 0 से 14 के पैमाने पर। 6.0 से 7.5 आदर्श है। 7 से कम अम्लीय है, 7 से अधिक क्षारीय है।"
        : "pH measures soil acidity or alkalinity on a scale of 0 to 14. 6.0 to 7.5 is ideal. Less than 7 is acidic, more than 7 is alkaline."
    }
    
    // Fertilizer questions / उर्वरक प्रश्न
    if (lowerQ.includes("fertilizer") || lowerQ.includes("उर्वरक") || 
        lowerQ.includes("खाद") || lowerQ.includes("कौन सा उर्वरक") ||
        lowerQ.includes("which fertilizer") || lowerQ.includes("what fertilizer") ||
        lowerQ.includes("कब दें") || lowerQ.includes("when to apply")) {
      return lang === "hi"
        ? "उर्वरक फसल के प्रकार और मिट्टी की स्थिति पर निर्भर करता है। NPK अनुपात नाइट्रोजन, फॉस्फोरस, और पोटैशियम को दर्शाता है। AI सिफारिशें सेक्शन में आपकी फसल के लिए सही उर्वरक सुझाव मिलेगा। उदाहरण: गेहूं के लिए 80-40-40, चावल के लिए 100-50-50। मिट्टी की जांच के बाद उर्वरक लगाएं।"
        : "Fertilizer depends on crop type and soil condition. NPK ratio indicates Nitrogen, Phosphorus, and Potassium. The AI Recommendations section will suggest the right fertilizer for your crop. Example: 80-40-40 for Wheat, 100-50-50 for Rice. Apply fertilizer after soil testing."
    }
    
    // Irrigation questions / सिंचाई प्रश्न
    if (lowerQ.includes("irrigation") || lowerQ.includes("सिंचाई") || 
        lowerQ.includes("कब पानी") || lowerQ.includes("when to water") ||
        lowerQ.includes("when should i water") || lowerQ.includes("when do i water") ||
        lowerQ.includes("कितना पानी") || lowerQ.includes("how much water") ||
        lowerQ.includes("watering time") || lowerQ.includes("पानी का समय")) {
      return lang === "hi"
        ? "सिंचाई मिट्टी की नमी पर निर्भर करती है। यदि नमी 30 प्रतिशत से कम है, तो तुरंत पानी दें। सुबह 6-8 बजे सिंचाई करना सबसे अच्छा है। मौसम और फसल के प्रकार के अनुसार समय बदलता है। गर्मी में दिन में दो बार, सर्दी में 2-3 दिन में एक बार। मिट्टी की नमी जांचते रहें।"
        : "Irrigation depends on soil moisture. If moisture is below 30 percent, water immediately. Best time is 6-8 AM. Timing varies based on weather and crop type. In summer, water twice a day. In winter, once every 2-3 days. Keep checking soil moisture regularly."
    }
    
    // Historical data / ऐतिहासिक डेटा
    if (lowerQ.includes("history") || lowerQ.includes("historical") || 
        lowerQ.includes("ऐतिहासिक") || lowerQ.includes("पुराना डेटा") ||
        lowerQ.includes("graph") || lowerQ.includes("ग्राफ") ||
        lowerQ.includes("trend") || lowerQ.includes("रुझान") ||
        lowerQ.includes("how to view historical") || lowerQ.includes("view historical data") ||
        lowerQ.includes("ऐतिहासिक डेटा कैसे देखें") || lowerQ.includes("पुराना डेटा देखें")) {
      return lang === "hi"
        ? "ऐतिहासिक डेटा देखने के लिए: 1) डैशबोर्ड पर Historical Data सेक्शन खोलें, 2) 1 दिन, 1 सप्ताह, या 1 महीने का समय चुनें, 3) ग्राफ में मिट्टी की नमी, तापमान, आर्द्रता, और पी एच के रुझान देखें, 4) CSV डाउनलोड बटन से डेटा सेव करें। यह आपको फसल के पैटर्न समझने में मदद करता है।"
        : "To view historical data: 1) Open Historical Data section on dashboard, 2) Select time period: 1 day, 1 week, or 1 month, 3) View trends of soil moisture, temperature, humidity, and pH in graphs, 4) Save data using CSV download button. This helps you understand crop patterns."
    }
    
    // Security questions / सुरक्षा प्रश्न
    if (lowerQ.includes("security") || lowerQ.includes("सुरक्षा") || 
        lowerQ.includes("fire") || lowerQ.includes("आग") ||
        lowerQ.includes("motion") || lowerQ.includes("गति")) {
      return lang === "hi"
        ? "सुरक्षा सेक्शन में PIR सेंसर से गति का पता चलता है और फ्लेम सेंसर से आग का पता चलता है। यदि कोई खतरा होता है, तो तुरंत अलर्ट मिलता है।"
        : "Security section detects motion via PIR sensor and fire via flame sensor. If any danger is detected, you get immediate alerts."
    }
    
    // Export/Download questions / निर्यात प्रश्न
    if (lowerQ.includes("export") || lowerQ.includes("download") || 
        lowerQ.includes("निर्यात") || lowerQ.includes("डाउनलोड") ||
        lowerQ.includes("csv") || lowerQ.includes("save")) {
      return lang === "hi"
        ? "आप ऐतिहासिक डेटा सेक्शन में डाउनलोड बटन से CSV फॉर्मेट में डेटा डाउनलोड कर सकते हैं। तीन प्रारूप उपलब्ध हैं: मानक, विस्तृत, और सारांश।"
        : "You can download data in CSV format from Historical Data section using the download button. Three formats available: Standard, Detailed, and Summary."
    }
    
    // Alert/Threshold questions / अलर्ट प्रश्न
    if (lowerQ.includes("alert") || lowerQ.includes("threshold") || 
        lowerQ.includes("अलर्ट") || lowerQ.includes("सीमा") ||
        lowerQ.includes("beep") || lowerQ.includes("बीप") ||
        lowerQ.includes("how to set alert") || lowerQ.includes("set alerts") ||
        lowerQ.includes("अलर्ट कैसे सेट करें") || lowerQ.includes("अलर्ट सेट करें") ||
        lowerQ.includes("notification") || lowerQ.includes("सूचना")) {
      return lang === "hi"
        ? "अलर्ट सेट करने के लिए: 1) प्रोफाइल आइकन पर क्लिक करें, 2) Alert Threshold Settings खोलें, 3) मिट्टी की नमी, तापमान, आर्द्रता, और पी एच की न्यूनतम और अधिकतम सीमाएं सेट करें, 4) अलर्ट चालू करें, 5) बीप ध्वनि सेटिंग्स चुनें। ट्रिपल बीप आग और गंभीर अलर्ट के लिए अनिवार्य है।"
        : "To set alerts: 1) Click profile icon, 2) Open Alert Threshold Settings, 3) Set minimum and maximum limits for soil moisture, temperature, humidity, and pH, 4) Enable alerts, 5) Choose beep sound settings. Triple beep is mandatory for fire and critical alerts."
    }
    
    // Language questions / भाषा प्रश्न
    if (lowerQ.includes("language") || lowerQ.includes("भाषा") || 
        lowerQ.includes("hindi") || lowerQ.includes("हिंदी") ||
        lowerQ.includes("english") || lowerQ.includes("अंग्रेजी")) {
      return lang === "hi"
        ? "प्रोफाइल सेक्शन में आप अपनी पसंदीदा भाषा चुन सकते हैं। वर्तमान में हिंदी और अंग्रेजी समर्थित हैं।"
        : "In Profile section, you can choose your preferred language. Currently Hindi and English are supported."
    }
    
    // Blynk questions / Blynk प्रश्न
    if (lowerQ.includes("blynk") || lowerQ.includes("token") || 
        lowerQ.includes("टोकन") || lowerQ.includes("कैसे कनेक्ट")) {
      return lang === "hi"
        ? "Blynk एक IoT प्लेटफॉर्म है जो सेंसर डेटा को CropMind से जोड़ता है। Blynk ऐप में सेटिंग्स से Auth Token लें और इसे प्रोफाइल में पेस्ट करें।"
        : "Blynk is an IoT platform that connects sensor data to CropMind. Get Auth Token from Settings in Blynk app and paste it in Profile."
    }
    
    // Best practices / सर्वोत्तम प्रथाएं
    if (lowerQ.includes("best practice") || lowerQ.includes("सर्वोत्तम") || 
        lowerQ.includes("tips") || lowerQ.includes("सुझाव") ||
        lowerQ.includes("advice") || lowerQ.includes("सलाह")) {
      return lang === "hi"
        ? "सर्वोत्तम प्रथाएं: 1) नियमित रूप से सेंसर डेटा जांचें, 2) AI सिफारिशों का पालन करें, 3) मौसम के अनुसार सिंचाई करें, 4) अलर्ट सेटिंग्स सेट करें, 5) ऐतिहासिक डेटा से रुझान देखें।"
        : "Best practices: 1) Check sensor data regularly, 2) Follow AI recommendations, 3) Irrigate according to weather, 4) Set alert thresholds, 5) View trends from historical data."
    }
    
    return null
  }

  // Define handleCommand function - use useCallback to ensure it has latest currentLanguage
  const handleCommand = async (command: string) => {
    // Get current language from localStorage to ensure we have the latest value
    const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
    const lowerCommand = command.toLowerCase()
    
    if (onCommand) {
      onCommand(command)
    }

    // First check knowledge base for general questions
    const knowledgeAnswer = getCropMindKnowledge(command, lang)
    if (knowledgeAnswer) {
      speakResponse(knowledgeAnswer)
      return
    }

    const token = localStorage.getItem("cropMind_blynkToken")
    const url = token ? `/api/sensors?token=${encodeURIComponent(token)}` : "/api/sensors"

    // Get sensor data once for all parameter questions
    let sensorData: any = null
    try {
      const res = await fetch(url)
      sensorData = await res.json()
    } catch (error) {
      const response = lang === "hi"
        ? "सेंसर डेटा लोड करने में त्रुटि हुई"
        : "Error loading sensor data"
      speakResponse(response)
      return
    }

    // Handle parameter questions with extensive Hindi variations
    // Moisture variations: नमी, पानी, सिंचाई, मिट्टी में पानी, नमी कितनी, पानी कितना
    if (lowerCommand.includes("moisture") || lowerCommand.includes("नमी") || lowerCommand.includes("soil") || 
        lowerCommand.includes("मिट्टी") || lowerCommand.includes("पानी") || lowerCommand.includes("सिंचाई") ||
        lowerCommand.includes("नमी कितनी") || lowerCommand.includes("पानी कितना") || 
        lowerCommand.includes("मिट्टी में पानी") || lowerCommand.includes("कितनी नमी") ||
        lowerCommand.includes("क्या है नमी") || lowerCommand.includes("नमी बताओ") ||
        lowerCommand.includes("मिट्टी की नमी") || lowerCommand.includes("सिंचाई करनी चाहिए") ||
        lowerCommand.includes("पानी देना चाहिए") || lowerCommand.includes("कब पानी दें")) {
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      const value = sensorData.soilMoisture.toFixed(1)
      const advice = getMoistureAdvice(sensorData.soilMoisture, lang)
      const response = lang === "hi"
        ? `मिट्टी की नमी ${value} प्रतिशत है। ${advice}`
        : `Soil moisture is ${value} percent. ${advice}`
      speakResponse(response)
      window.dispatchEvent(new CustomEvent("voiceCommand", { detail: { command: "moisture" } }))
    } 
    // Temperature variations: तापमान, गर्मी, ठंड, तापमान कितना, कितनी गर्मी, कितनी ठंड
    else if (lowerCommand.includes("temperature") || lowerCommand.includes("तापमान") || lowerCommand.includes("temp") ||
             lowerCommand.includes("गर्मी") || lowerCommand.includes("ठंड") || lowerCommand.includes("तापमान कितना") ||
             lowerCommand.includes("कितनी गर्मी") || lowerCommand.includes("कितनी ठंड") ||
             lowerCommand.includes("क्या है तापमान") || lowerCommand.includes("तापमान बताओ") ||
             lowerCommand.includes("गर्मी कितनी") || lowerCommand.includes("ठंड कितनी") ||
             lowerCommand.includes("फसलों को बचाएं") || lowerCommand.includes("छाया दें")) {
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      const value = sensorData.temperature.toFixed(1)
      const advice = getTemperatureAdvice(sensorData.temperature, lang)
      const response = lang === "hi"
        ? `तापमान ${value} डिग्री सेल्सियस है। ${advice}`
        : `Temperature is ${value} degrees Celsius. ${advice}`
      speakResponse(response)
      window.dispatchEvent(new CustomEvent("voiceCommand", { detail: { command: "temperature" } }))
    } 
    // Humidity variations: आर्द्रता, नमी हवा, हवा में नमी, आर्द्रता कितनी
    else if (lowerCommand.includes("humidity") || lowerCommand.includes("आर्द्रता") ||
             lowerCommand.includes("नमी हवा") || lowerCommand.includes("हवा में नमी") ||
             lowerCommand.includes("आर्द्रता कितनी") || lowerCommand.includes("क्या है आर्द्रता") ||
             lowerCommand.includes("आर्द्रता बताओ")) {
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      const value = sensorData.humidity.toFixed(1)
      const advice = getHumidityAdvice(sensorData.humidity, lang)
      const response = lang === "hi"
        ? `आर्द्रता ${value} प्रतिशत है। ${advice}`
        : `Humidity is ${value} percent. ${advice}`
      speakResponse(response)
    } 
    // pH variations: पीएच, पी एच, पीएच कितना, मिट्टी का पीएच
    else if (lowerCommand.includes("ph") || lowerCommand.includes("पीएच") || lowerCommand.includes("पी एच") ||
             lowerCommand.includes("पीएच कितना") || lowerCommand.includes("मिट्टी का पीएच") ||
             lowerCommand.includes("क्या है पीएच") || lowerCommand.includes("पीएच बताओ") ||
             lowerCommand.includes("मिट्टी सुधार") || lowerCommand.includes("मिट्टी में क्या मिलाएं")) {
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      const value = sensorData.ph.toFixed(1)
      const advice = getPhAdvice(sensorData.ph, lang)
      const response = lang === "hi"
        ? `पी एच मान ${value} है। ${advice}`
        : `pH value is ${value}. ${advice}`
      speakResponse(response)
    } 
    // All values variations: सभी मान, सभी जानकारी, सब कुछ बताओ, सभी डेटा
    else if (lowerCommand.includes("all") || lowerCommand.includes("सभी") || lowerCommand.includes("parameters") || 
             lowerCommand.includes("मान") || lowerCommand.includes("सभी जानकारी") || lowerCommand.includes("सब कुछ बताओ") ||
             lowerCommand.includes("सभी डेटा") || lowerCommand.includes("सभी मान बताओ") ||
             lowerCommand.includes("क्या है सभी मान") || lowerCommand.includes("सभी जानकारी दो")) {
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      const values = lang === "hi"
        ? `सभी मान: मिट्टी की नमी ${sensorData.soilMoisture.toFixed(1)} प्रतिशत, तापमान ${sensorData.temperature.toFixed(1)} डिग्री सेल्सियस, आर्द्रता ${sensorData.humidity.toFixed(1)} प्रतिशत, और पी एच ${sensorData.ph.toFixed(1)} है।`
        : `All values: Soil moisture ${sensorData.soilMoisture.toFixed(1)} percent, Temperature ${sensorData.temperature.toFixed(1)} degrees Celsius, Humidity ${sensorData.humidity.toFixed(1)} percent, and pH ${sensorData.ph.toFixed(1)}.`
      const status = getOverallStatus(sensorData, lang)
      const response = `${values} ${status}`
      speakResponse(response)
    } 
    // Recommendation variations: सुझाव, फसल, कौन सी फसल, क्या लगाएं, सर्वश्रेष्ठ फसल
    else if (lowerCommand.includes("recommendation") || lowerCommand.includes("सुझाव") || lowerCommand.includes("suggestion") || 
             lowerCommand.includes("crop") || lowerCommand.includes("फसल") || lowerCommand.includes("best") || 
             lowerCommand.includes("सर्वश्रेष्ठ") || lowerCommand.includes("कौन सी फसल") || lowerCommand.includes("क्या लगाएं") ||
             lowerCommand.includes("कौन सी फसल लगाएं") || lowerCommand.includes("सर्वश्रेष्ठ फसल") ||
             lowerCommand.includes("फसल का सुझाव") || lowerCommand.includes("कौन सी फसल अच्छी है") ||
             lowerCommand.includes("मुझे क्या लगाना चाहिए") || lowerCommand.includes("फसल बताओ") ||
             lowerCommand.includes("which crop") || lowerCommand.includes("what crop") ||
             lowerCommand.includes("कौन सी फसल उगाएं") || lowerCommand.includes("फसल सुझाव")) {
      // Get recommendations via API
      try {
        const recRes = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moisture: sensorData.soilMoisture,
            temperature: sensorData.temperature,
            humidity: sensorData.humidity,
          }),
        })
        const recData = await recRes.json()
        
        const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
        if (recData.crop || (recData.recommendations && recData.recommendations.length > 0)) {
          const crop = recData.crop || recData.recommendations[0]
          const soilType = recData.soilType || "Loamy Soil"
          const fertilizer = recData.fertilizer || recData.npkRatio || "80-40-40"
          const irrigation = recData.irrigationSchedule || "Moderate"
          const otherCrops = recData.recommendations && recData.recommendations.length > 1 
            ? recData.recommendations.slice(1, 3).join(", ")
            : ""
          
          const response = lang === "hi"
            ? `आपके लिए सुझावित फसल ${crop} है। मिट्टी का प्रकार: ${soilType}। उर्वरक: ${fertilizer}। सिंचाई: ${irrigation}। ${otherCrops ? `अन्य विकल्प: ${otherCrops}।` : ""} मिट्टी की नमी ${sensorData.soilMoisture.toFixed(1)} प्रतिशत और तापमान ${sensorData.temperature.toFixed(1)} डिग्री के लिए यह फसल उपयुक्त है।`
            : `Recommended crop for you is ${crop}. Soil type: ${soilType}. Fertilizer: ${fertilizer}. Irrigation: ${irrigation}. ${otherCrops ? `Other options: ${otherCrops}.` : ""} This crop is suitable for soil moisture ${sensorData.soilMoisture.toFixed(1)} percent and temperature ${sensorData.temperature.toFixed(1)} degrees.`
          speakResponse(response)
        } else {
          const response = lang === "hi"
            ? "कृपया सुझाव प्राप्त करने के लिए सुझाव बटन पर क्लिक करें"
            : "Please click the recommendation button to get suggestions"
          speakResponse(response)
        }
      } catch (error) {
        const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
        const response = lang === "hi"
          ? "सुझाव प्राप्त करने में त्रुटि हुई"
          : "Error getting recommendations"
        speakResponse(response)
      }
      window.dispatchEvent(new CustomEvent("voiceCommand", { detail: { command: "recommendation" } }))
    } 
    // Status variations: स्थिति, हालत, कैसी है स्थिति, सब ठीक है, क्या सब ठीक है, is everything okay
    else if (lowerCommand.includes("status") || lowerCommand.includes("स्थिति") || lowerCommand.includes("condition") || 
             lowerCommand.includes("हालत") || lowerCommand.includes("कैसी है स्थिति") || lowerCommand.includes("सब ठीक है") ||
             lowerCommand.includes("क्या सब ठीक है") || lowerCommand.includes("स्थिति कैसी है") ||
             lowerCommand.includes("सब कुछ ठीक है") || lowerCommand.includes("क्या सब कुछ ठीक है") ||
             lowerCommand.includes("क्या करना चाहिए") || lowerCommand.includes("सुझाव दो") ||
             lowerCommand.includes("is everything okay") || lowerCommand.includes("everything okay") ||
             lowerCommand.includes("all okay") || lowerCommand.includes("all right") ||
             lowerCommand.includes("सब ठीक") || lowerCommand.includes("क्या सब ठीक")) {
      // Overall status with actionable advice
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      const response = getOverallStatus(sensorData, lang)
      speakResponse(response)
    } 
    // Weather variations: मौसम, आज का मौसम, बारिश, मौसम कैसा है
    else if (lowerCommand.includes("weather") || lowerCommand.includes("मौसम") || lowerCommand.includes("बारिश") ||
             lowerCommand.includes("आज का मौसम") || lowerCommand.includes("मौसम कैसा है") ||
             lowerCommand.includes("क्या बारिश होगी") || lowerCommand.includes("बारिश की संभावना") ||
             lowerCommand.includes("कल का मौसम") || lowerCommand.includes("मौसम के अनुसार")) {
      // Fetch weather data
      try {
        const savedLocation = localStorage.getItem("cropMind_location") || "Gorakhpur"
        const weatherRes = await fetch(`/api/weather?location=${encodeURIComponent(savedLocation)}`)
        const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json()
          const conditionText = translateWeatherCondition(weatherData.condition || "")
          
          // Add farming advice based on weather
          let weatherAdvice = ""
          if (weatherData.rainChance > 70) {
            weatherAdvice = lang === "hi"
              ? "बारिश की अधिक संभावना है। सिंचाई रोकें। फसलों को बारिश से बचाएं।"
              : "High chance of rain. Stop irrigation. Protect crops from rain."
          } else if (weatherData.rainChance > 40) {
            weatherAdvice = lang === "hi"
              ? "बारिश की संभावना है। सिंचाई कम करें।"
              : "Chance of rain. Reduce irrigation."
          } else if (weatherData.temperature > 35) {
            weatherAdvice = lang === "hi"
              ? "गर्मी अधिक है। फसलों को छाया दें। दिन में दो बार पानी दें।"
              : "It's very hot. Provide shade to crops. Water twice a day."
          } else if (weatherData.temperature < 15) {
            weatherAdvice = lang === "hi"
              ? "ठंड है। नाजुक फसलों को ढकें।"
              : "It's cold. Cover delicate crops."
          }
          
          const response = lang === "hi"
            ? `आज का मौसम: तापमान ${weatherData.temperature} डिग्री सेल्सियस, ${conditionText}, बारिश की संभावना ${weatherData.rainChance} प्रतिशत है। ${weatherAdvice}`
            : `Today's weather: Temperature ${weatherData.temperature} degrees Celsius, ${weatherData.condition}, rain chance ${weatherData.rainChance} percent. ${weatherAdvice}`
          speakResponse(response)
        } else {
          const response = lang === "hi"
            ? "मौसम की जानकारी प्राप्त करने में त्रुटि हुई"
            : "Error getting weather information"
          speakResponse(response)
        }
      } catch (error) {
        const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
        const response = lang === "hi"
          ? "मौसम की जानकारी प्राप्त करने में त्रुटि हुई"
          : "Error getting weather information"
        speakResponse(response)
      }
    }
    // Help variations: मदद, क्या कर सकते हो, क्या पूछ सकते हैं
    else if (lowerCommand.includes("help") || lowerCommand.includes("मदद") || lowerCommand.includes("क्या कर सकते हो") ||
             lowerCommand.includes("क्या पूछ सकते हैं") || lowerCommand.includes("क्या कर सकता है") ||
             lowerCommand.includes("क्या कर सकते हैं") || lowerCommand.includes("what can you") ||
             lowerCommand.includes("क्या पूछ सकता हूं") || lowerCommand.includes("क्या जान सकते हैं")) {
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      const response = lang === "hi"
        ? "मैं आपकी कैसे मदद कर सकता हूं? आप मिट्टी की नमी, तापमान, आर्द्रता, पी एच, सभी मान, सुझाव, स्थिति, मौसम, उर्वरक, सिंचाई, ऐतिहासिक डेटा, सुरक्षा, अलर्ट सेटिंग्स, या CropMind के बारे में कुछ भी पूछ सकते हैं।"
        : "How can I help you? You can ask about soil moisture, temperature, humidity, pH, all values, recommendations, status, weather, fertilizer, irrigation, historical data, security, alert settings, or anything about CropMind."
      speakResponse(response)
    }
    // Questions about features / सुविधाओं के बारे में प्रश्न
    else if (lowerCommand.includes("feature") || lowerCommand.includes("सुविधा") || 
             lowerCommand.includes("what does") || lowerCommand.includes("क्या करता है") ||
             lowerCommand.includes("capability") || lowerCommand.includes("क्षमता")) {
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      const response = lang === "hi"
        ? "CropMind की मुख्य सुविधाएं: 1) वास्तविक समय पर्यावरण निगरानी, 2) AI-संचालित फसल सिफारिशें, 3) मौसम एकीकरण, 4) वॉइस कमांड, 5) ऐतिहासिक डेटा और ग्राफ, 6) सुरक्षा अलर्ट, 7) CSV डाउनलोड, 8) कस्टम अलर्ट थ्रेशोल्ड।"
        : "CropMind main features: 1) Real-time environmental monitoring, 2) AI-powered crop recommendations, 3) Weather integration, 4) Voice commands, 5) Historical data and graphs, 6) Security alerts, 7) CSV download, 8) Custom alert thresholds."
      speakResponse(response)
    }
    // When questions / कब प्रश्न
    else if (lowerCommand.includes("when") || lowerCommand.includes("कब") || 
             lowerCommand.includes("किस समय") || lowerCommand.includes("किस दिन")) {
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      if (lowerCommand.includes("water") || lowerCommand.includes("पानी") || lowerCommand.includes("सिंचाई")) {
        const advice = sensorData.soilMoisture < 30 
          ? (lang === "hi" ? "तुरंत पानी दें।" : "Water immediately.")
          : (lang === "hi" ? "सुबह 6-8 बजे सिंचाई करना सबसे अच्छा है।" : "Best time is 6-8 AM.")
        const response = lang === "hi"
          ? `मिट्टी की नमी ${sensorData.soilMoisture.toFixed(1)} प्रतिशत है। ${advice}`
          : `Soil moisture is ${sensorData.soilMoisture.toFixed(1)} percent. ${advice}`
        speakResponse(response)
      } else {
        const response = lang === "hi"
          ? "आप कब के बारे में पूछ रहे हैं? पानी, उर्वरक, या कुछ और?"
          : "What are you asking when about? Water, fertilizer, or something else?"
        speakResponse(response)
      }
    }
    // Why questions / क्यों प्रश्न
    else if (lowerCommand.includes("why") || lowerCommand.includes("क्यों") || 
             lowerCommand.includes("reason") || lowerCommand.includes("कारण")) {
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      const response = lang === "hi"
        ? "मैं आपके प्रश्न को बेहतर समझने के लिए, कृपया विशिष्ट रूप से पूछें। उदाहरण: क्यों नमी कम है? या क्यों यह फसल सुझाई गई है?"
        : "To better understand your question, please ask specifically. Example: Why is moisture low? Or why is this crop recommended?"
      speakResponse(response)
    }
    // How much / कितना प्रश्न
    else if (lowerCommand.includes("how much") || lowerCommand.includes("कितना") || 
             lowerCommand.includes("कितनी") || lowerCommand.includes("quantity")) {
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      if (lowerCommand.includes("water") || lowerCommand.includes("पानी")) {
        const amount = sensorData.soilMoisture < 30 
          ? (lang === "hi" ? "20-30 मिनट तक पानी दें" : "Water for 20-30 minutes")
          : (lang === "hi" ? "10-15 मिनट तक पानी दें" : "Water for 10-15 minutes")
        const response = lang === "hi"
          ? `मिट्टी की नमी ${sensorData.soilMoisture.toFixed(1)} प्रतिशत है। ${amount}।`
          : `Soil moisture is ${sensorData.soilMoisture.toFixed(1)} percent. ${amount}.`
        speakResponse(response)
      } else {
        const response = lang === "hi"
          ? "कितना के बारे में पूछ रहे हैं? पानी, उर्वरक, या कुछ और?"
          : "How much of what? Water, fertilizer, or something else?"
        speakResponse(response)
      }
    }
    else {
      // Generic response with more options
      const lang = localStorage.getItem("cropMind_language") || currentLanguage || "en"
      const response = lang === "hi"
        ? "मैं आपकी कैसे मदद कर सकता हूं? आप मिट्टी की नमी, तापमान, आर्द्रता, पी एच, सभी मान, सुझाव, स्थिति, मौसम, उर्वरक, सिंचाई, या CropMind के बारे में कुछ भी पूछ सकते हैं। यदि मैं समझ नहीं पाया, तो कृपया फिर से पूछें।"
        : "How can I help you? You can ask about soil moisture, temperature, humidity, pH, all values, recommendations, status, weather, fertilizer, irrigation, or anything about CropMind. If I didn't understand, please ask again."
      speakResponse(response)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true // Keep listening continuously
      recognitionInstance.interimResults = false
      recognitionInstance.lang = currentLanguage === "hi" ? "hi-IN" : "en-IN"

      recognitionInstance.onresult = (event: any) => {
        // Get the latest transcript
        const transcript = event.results[event.results.length - 1][0].transcript
        setTranscript(transcript)
        handleCommand(transcript)
      }

      recognitionInstance.onerror = (error: any) => {
        console.error("Speech recognition error:", error)
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        // Auto-restart if still listening
        if (isListening && recognitionInstance) {
          try {
            recognitionInstance.start()
          } catch (e) {
            setIsListening(false)
          }
        } else {
          setIsListening(false)
        }
      }

      setRecognition(recognitionInstance)
      
      // Cleanup function
      return () => {
        if (recognitionInstance) {
          try {
            recognitionInstance.stop()
          } catch (e) {
            // Ignore errors on cleanup
          }
        }
      }
    }
  }, [currentLanguage, isListening])

  const startListening = () => {
    if (recognition) {
      setIsListening(true)
      setTranscript("")
      
      // Simple greeting
      const greeting = currentLanguage === "hi" 
        ? "मैं आपकी कैसे मदद कर सकता हूं?"
        : "How can I help you?"
      
      speakResponse(greeting)
      
      // Start recognition after a short delay to let greeting play
      setTimeout(() => {
        try {
          recognition.start()
        } catch (e) {
          // Already started or error
        }
      }, 500)
    } else {
      alert(currentLanguage === "hi" ? "वॉइस रिकॉग्निशन उपलब्ध नहीं है" : "Voice recognition not available")
    }
  }

  const stopListening = () => {
    if (recognition) {
      recognition.stop()
      setIsListening(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span>{currentLanguage === "hi" ? "वॉइस कमांड" : "Voice Commands"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={isListening ? stopListening : startListening}
          className={`w-full ${
            isListening
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-purple-500 hover:bg-purple-600 text-white"
          }`}
          size="lg"
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5 mr-2" />
              {currentLanguage === "hi" ? "रोकें" : "Stop Listening"}
            </> 
          ) : (
            <>
              <Mic className="w-5 h-5 mr-2" />
              {currentLanguage === "hi" ? "सुनना शुरू करें" : "Start Listening"}
            </>
          )}
        </Button>
        
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-purple-200/50 dark:border-purple-800/50"
          >
            <p className="text-xs text-muted-foreground mb-1">
              {currentLanguage === "hi" ? "आपने कहा:" : "You said:"}
            </p>
            <p className="text-sm font-medium text-foreground">{transcript}</p>
          </motion.div>
        )}

        <Collapsible open={isExamplesOpen} onOpenChange={setIsExamplesOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-between"
              size="sm"
            >
              <span className="text-xs font-semibold">
                {currentLanguage === "hi" ? "उदाहरण (किसानों के लिए)" : "Example Commands"}
              </span>
              {isExamplesOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{currentLanguage === "hi" ? "मिट्टी की नमी क्या है?" : "What is soil moisture?"}</li>
                <li>{currentLanguage === "hi" ? "पानी कितना है?" : "How much water?"}</li>
                <li>{currentLanguage === "hi" ? "तापमान बताओ" : "Tell me temperature"}</li>
                <li>{currentLanguage === "hi" ? "कौन सी फसल लगाएं?" : "Which crop should I plant?"}</li>
                <li>{currentLanguage === "hi" ? "मौसम कैसा है?" : "How is the weather?"}</li>
                <li>{currentLanguage === "hi" ? "क्या सब ठीक है?" : "Is everything okay?"}</li>
                <li>{currentLanguage === "hi" ? "CropMind क्या है?" : "What is CropMind?"}</li>
                <li>{currentLanguage === "hi" ? "कैसे उपयोग करें?" : "How to use?"}</li>
                <li>{currentLanguage === "hi" ? "कब पानी दें?" : "When to water?"}</li>
                <li>{currentLanguage === "hi" ? "कौन सा उर्वरक?" : "Which fertilizer?"}</li>
                <li>{currentLanguage === "hi" ? "ऐतिहासिक डेटा कैसे देखें?" : "How to view historical data?"}</li>
                <li>{currentLanguage === "hi" ? "अलर्ट कैसे सेट करें?" : "How to set alerts?"}</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

