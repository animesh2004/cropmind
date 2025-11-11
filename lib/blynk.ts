/**
 * Blynk API Helper
 * Pin Mappings:
 * V0 - Soil Moisture
 * V1 - PIR (Motion Sensor)
 * V2 - Flame Sensor
 * V3 - Temperature
 * V4 - Humidity
 * V8 - pH Sensor
 */

const BLYNK_SERVER = process.env.BLYNK_SERVER || "blynk.cloud"

export interface BlynkPinData {
  value: number | string
  timestamp?: number
}

export async function fetchBlynkPin(token: string, pin: string): Promise<BlynkPinData | null> {
  if (!token) {
    throw new Error("Blynk token is required")
  }

  try {
    const url = `https://${BLYNK_SERVER}/external/api/get?token=${encodeURIComponent(token)}&${pin}`
    
    // Create abort controller for timeout (compatible with all Node versions)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(url, {
      cache: "no-store",
      next: { revalidate: 0 }, // Always fetch fresh data
      headers: {
        "User-Agent": "CropMind/1.0",
        "Accept": "text/plain, application/json",
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error(`Blynk API error for pin ${pin}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new Error(`Blynk API error: ${response.status} ${response.statusText}`)
    }

    const value = await response.text()
    // Try to parse as number, fallback to string
    const numValue = Number(value)
    return {
      value: isNaN(numValue) ? value : numValue,
      timestamp: Date.now(),
    }
  } catch (error) {
    // Handle timeout and network errors gracefully
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Blynk API timeout for pin ${pin}`)
    } else {
      console.error(`Error fetching Blynk pin ${pin}:`, error)
    }
    return null
  }
}

export async function fetchBlynkSensors(token: string) {
  if (!token) {
    return null
  }

  try {
    // Fetch all pins in parallel with individual error handling
    const [soilMoisture, pir, flame, temperature, humidity, ph] = await Promise.allSettled([
      fetchBlynkPin(token, "V0"), // Soil Moisture
      fetchBlynkPin(token, "V1"), // PIR
      fetchBlynkPin(token, "V2"), // Flame
      fetchBlynkPin(token, "V3"), // Temperature
      fetchBlynkPin(token, "V4"), // Humidity
      fetchBlynkPin(token, "V8"), // pH Sensor
    ])

    // Extract values, handling both fulfilled and rejected promises
    const getValue = (result: PromiseSettledResult<BlynkPinData | null>, defaultValue: number = 0) => {
      if (result.status === "fulfilled" && result.value) {
        const val = result.value.value
        return typeof val === "number" ? val : defaultValue
      }
      return defaultValue
    }

    const result = {
      soilMoisture: getValue(soilMoisture, 0),
      pir: getValue(pir, 0),
      flame: getValue(flame, 0),
      temperature: getValue(temperature, 0),
      humidity: getValue(humidity, 0),
      ph: ph.status === "fulfilled" && ph.value 
        ? (typeof ph.value.value === "number" ? parseFloat(ph.value.value.toString()) : 6.8)
        : 6.8,
      timestamp: new Date().toISOString(),
    }

    // Check if we got at least some valid data (at least one sensor reading)
    const hasValidData = result.soilMoisture > 0 || result.temperature > 0 || result.humidity > 0
    
    if (!hasValidData) {
      console.warn("All Blynk sensor readings returned zero or null")
      return null
    }

    return result
  } catch (error) {
    console.error("Error fetching Blynk sensors:", error)
    return null
  }
}

