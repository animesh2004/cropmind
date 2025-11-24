/**
 * AI & Environment Configuration
 * Centralized configuration for all AI services and environment variables
 */

// ============================================================================
// Gemini AI Configuration
// ============================================================================
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""
export const GEMINI_MODEL_NAME = "models/gemini-2.5-flash-preview-tts"
export const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta"

// Gemini TTS Voices
export const GEMINI_VOICES = {
  ENGLISH: "Callirrhoe",
  HINDI: "Puck",
} as const

// Validate Gemini API Key
export function getGeminiApiKey(): string {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length === 0) {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn("GEMINI_API_KEY is not set in environment variables")
    }
  }
  return GEMINI_API_KEY
}

export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY.length > 0
}

// ============================================================================
// Weather API Configuration
// ============================================================================
export const OPENWEATHER_API_KEY = 
  (process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "").trim()

export const ACCUWEATHER_API_KEY = (process.env.ACCUWEATHER_API_KEY || "").trim()

// Weather API URLs
export const OPENWEATHER_API_URL = "https://api.openweathermap.org/data/2.5"
export const ACCUWEATHER_API_URL = "https://dataservice.accuweather.com"

export function getOpenWeatherApiKey(): string {
  return OPENWEATHER_API_KEY
}

export function getAccuWeatherApiKey(): string {
  return ACCUWEATHER_API_KEY
}

export function hasOpenWeatherKey(): boolean {
  return !!OPENWEATHER_API_KEY && OPENWEATHER_API_KEY.length > 0
}

export function hasAccuWeatherKey(): boolean {
  return !!ACCUWEATHER_API_KEY && ACCUWEATHER_API_KEY.length > 0
}

export function hasAnyWeatherKey(): boolean {
  return hasOpenWeatherKey() || hasAccuWeatherKey()
}

// ============================================================================
// Kaggle API Configuration
// ============================================================================
export const KAGGLE_API_URL = process.env.KAGGLE_API_URL || ""
export const KAGGLE_API_KEY = process.env.KAGGLE_API_KEY || "b3a9bb041929fa6d6378f9086cbdf7da"
export const KAGGLE_USERNAME = process.env.KAGGLE_USERNAME || "animeshtri12"

export function getKaggleApiKey(): string {
  return KAGGLE_API_KEY
}

export function getKaggleUsername(): string {
  return KAGGLE_USERNAME
}

export function getKaggleApiUrl(): string {
  return KAGGLE_API_URL
}

export function isKaggleConfigured(): boolean {
  return !!KAGGLE_API_KEY && KAGGLE_API_KEY.length > 0
}

// ============================================================================
// Blynk IoT Configuration
// ============================================================================
export const BLYNK_SERVER = process.env.BLYNK_SERVER || "blynk.cloud"
export const BLYNK_API_URL = `https://${BLYNK_SERVER}`

export function getBlynkServer(): string {
  return BLYNK_SERVER
}

// ============================================================================
// App Configuration
// ============================================================================
export const APP_URL = 
  process.env.NEXT_PUBLIC_APP_URL || 
  process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "http://localhost:3000"

export const NODE_ENV = process.env.NODE_ENV || "development"
export const IS_PRODUCTION = NODE_ENV === "production"
export const IS_DEVELOPMENT = NODE_ENV === "development"

export function getAppUrl(): string {
  return APP_URL
}

export function isProduction(): boolean {
  return IS_PRODUCTION
}

export function isDevelopment(): boolean {
  return IS_DEVELOPMENT
}

// ============================================================================
// Deployment Platform Detection
// ============================================================================
export function getDeploymentPlatform(): "vercel" | "netlify" | "unknown" {
  if (process.env.VERCEL) return "vercel"
  if (process.env.NETLIFY) return "netlify"
  return "unknown"
}

export function getDeploymentRegion(): string {
  return process.env.VERCEL_REGION || process.env.AWS_REGION || "Unknown"
}

// ============================================================================
// Configuration Summary
// ============================================================================
export interface ConfigSummary {
  gemini: {
    configured: boolean
    apiKeyLength: number
  }
  weather: {
    openweather: boolean
    accuweather: boolean
    hasAny: boolean
  }
  kaggle: {
    configured: boolean
    hasCustomUrl: boolean
  }
  blynk: {
    server: string
  }
  app: {
    url: string
    environment: string
    platform: string
    region: string
  }
}

export function getConfigSummary(): ConfigSummary {
  return {
    gemini: {
      configured: isGeminiConfigured(),
      apiKeyLength: GEMINI_API_KEY.length,
    },
    weather: {
      openweather: hasOpenWeatherKey(),
      accuweather: hasAccuWeatherKey(),
      hasAny: hasAnyWeatherKey(),
    },
    kaggle: {
      configured: isKaggleConfigured(),
      hasCustomUrl: !!KAGGLE_API_URL && KAGGLE_API_URL.length > 0,
    },
    blynk: {
      server: BLYNK_SERVER,
    },
    app: {
      url: APP_URL,
      environment: NODE_ENV,
      platform: getDeploymentPlatform(),
      region: getDeploymentRegion(),
    },
  }
}

// ============================================================================
// Environment Variable Validation
// ============================================================================
export function validateEnvironmentVariables(): {
  valid: boolean
  missing: string[]
  warnings: string[]
} {
  const missing: string[] = []
  const warnings: string[] = []

  // Required for production
  if (IS_PRODUCTION) {
    if (!hasAnyWeatherKey()) {
      missing.push("OPENWEATHER_API_KEY or ACCUWEATHER_API_KEY")
    }
  }

  // Recommended
  if (!isGeminiConfigured()) {
    warnings.push("GEMINI_API_KEY (recommended for TTS)")
  }

  if (!hasOpenWeatherKey() && !hasAccuWeatherKey()) {
    warnings.push("Weather API keys (recommended for weather features)")
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}



