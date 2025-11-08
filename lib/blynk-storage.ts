/**
 * Blynk Data Storage
 * Stores real-time data received from Blynk webhooks
 */

export interface BlynkWebhookData {
  token: string
  pin: string
  value: number | string
  timestamp: number
}

export interface StoredSensorData {
  soilMoisture: number
  temperature: number
  humidity: number
  ph: number
  pir: number
  flame: number
  timestamp: string
  source: "webhook" | "polling"
}

class BlynkDataStorage {
  private data: Map<string, BlynkWebhookData> = new Map()
  private sensorData: Map<string, StoredSensorData> = new Map()
  private readonly TTL = 60000 // 60 seconds - data expires after 1 minute

  /**
   * Store webhook data
   */
  storeWebhookData(token: string, pin: string, value: number | string): void {
    const key = `${token}:${pin}`
    this.data.set(key, {
      token,
      pin,
      value,
      timestamp: Date.now(),
    })

    // Update sensor data if all pins are available
    this.updateSensorData(token)
  }

  /**
   * Get stored pin value
   */
  getPinValue(token: string, pin: string): BlynkWebhookData | null {
    const key = `${token}:${pin}`
    const data = this.data.get(key)

    if (!data) return null

    // Check if data is expired
    if (Date.now() - data.timestamp > this.TTL) {
      this.data.delete(key)
      return null
    }

    return data
  }

  /**
   * Get all sensor data for a token
   */
  getSensorData(token: string): StoredSensorData | null {
    const data = this.sensorData.get(token)

    if (!data) return null

    // Check if data is expired
    const dataAge = Date.now() - new Date(data.timestamp).getTime()
    if (dataAge > this.TTL) {
      this.sensorData.delete(token)
      return null
    }

    return data
  }

  /**
   * Update sensor data when all pins are available
   */
  private updateSensorData(token: string): void {
    const pins = ["V0", "V1", "V2", "V3", "V4", "V8"]
    const pinData: Record<string, number> = {}

    // Get all pin values
    for (const pin of pins) {
      const data = this.getPinValue(token, pin)
      if (data) {
        if (pin === "V8") {
          // pH: explicitly convert to float
          const phValue = typeof data.value === "number" ? data.value : parseFloat(data.value.toString())
          pinData[pin] = isNaN(phValue) ? 6.8 : phValue
        } else {
          const numValue = typeof data.value === "number" ? data.value : Number(data.value)
          pinData[pin] = isNaN(numValue) ? 0 : numValue
        }
      } else {
        // For V8 (pH), allow it to be optional and use default if not available
        if (pin === "V8") {
          pinData[pin] = parseFloat("6.8") // Default pH as float
          continue
        }
        // Not all required pins available yet
        return
      }
    }

    // Store complete sensor data
    this.sensorData.set(token, {
      soilMoisture: pinData.V0 || 0,
      pir: pinData.V1 || 0,
      flame: pinData.V2 || 0,
      temperature: pinData.V3 || 0,
      humidity: pinData.V4 || 0,
      ph: parseFloat((pinData.V8 || 6.8).toString()), // pH from V8 as float, default to 6.8 if not available
      timestamp: new Date().toISOString(),
      source: "webhook",
    })
  }

  /**
   * Clear expired data
   */
  clearExpiredData(): void {
    const now = Date.now()
    for (const [key, data] of this.data.entries()) {
      if (now - data.timestamp > this.TTL) {
        this.data.delete(key)
      }
    }

    for (const [token, data] of this.sensorData.entries()) {
      const dataAge = now - new Date(data.timestamp).getTime()
      if (dataAge > this.TTL) {
        this.sensorData.delete(token)
      }
    }
  }

  /**
   * Get all stored tokens
   */
  getStoredTokens(): string[] {
    const tokens = new Set<string>()
    for (const [key] of this.data.entries()) {
      const token = key.split(":")[0]
      tokens.add(token)
    }
    return Array.from(tokens)
  }
}

// Singleton instance
export const blynkStorage = new BlynkDataStorage()

// Clean up expired data every 30 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    blynkStorage.clearExpiredData()
  }, 30000)
}

