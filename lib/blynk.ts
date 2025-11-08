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
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "CropMind/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`Blynk API error: ${response.status}`)
    }

    const value = await response.text()
    // Try to parse as number, fallback to string
    const numValue = Number(value)
    return {
      value: isNaN(numValue) ? value : numValue,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error(`Error fetching Blynk pin ${pin}:`, error)
    return null
  }
}

export async function fetchBlynkSensors(token: string) {
  if (!token) {
    return null
  }

  try {
    const [soilMoisture, pir, flame, temperature, humidity, ph] = await Promise.all([
      fetchBlynkPin(token, "V0"), // Soil Moisture
      fetchBlynkPin(token, "V1"), // PIR
      fetchBlynkPin(token, "V2"), // Flame
      fetchBlynkPin(token, "V3"), // Temperature
      fetchBlynkPin(token, "V4"), // Humidity
      fetchBlynkPin(token, "V8"), // pH Sensor
    ])

    return {
      soilMoisture: typeof soilMoisture?.value === "number" ? soilMoisture.value : 0,
      pir: typeof pir?.value === "number" ? Number(pir.value) : 0,
      flame: typeof flame?.value === "number" ? Number(flame.value) : 0,
      temperature: typeof temperature?.value === "number" ? temperature.value : 0,
      humidity: typeof humidity?.value === "number" ? humidity.value : 0,
      ph: typeof ph?.value === "number" ? parseFloat(ph.value.toString()) : parseFloat("6.8"), // pH as float, default to 6.8 if not available
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error fetching Blynk sensors:", error)
    return null
  }
}

