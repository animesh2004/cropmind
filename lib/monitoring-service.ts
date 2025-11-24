/**
 * Monitoring Service
 * Monitors sensors and triggers alerts
 */

import { showBrowserNotification, formatAlertMessage } from "./notifications"

export interface MonitoringConfig {
  enabled: boolean
  periodicAlerts: boolean
  instantAlerts: boolean
  checkInterval: number // in milliseconds (10 minutes = 600000)
}

export interface SensorData {
  soilMoisture: number
  temperature: number
  humidity: number
  ph: number
  pir: number
  flame: number
  timestamp: string
}

class MonitoringService {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private lastCheckTime: number = 0
  private config: MonitoringConfig = {
    enabled: false,
    periodicAlerts: true,
    instantAlerts: true,
    checkInterval: 600000, // 10 minutes
  }
  private lastFireAlert: number = 0
  private lastAnimalAlert: number = 0
  private alertCooldown = 30000 // 30 seconds cooldown for instant alerts

  /**
   * Initialize monitoring service
   */
  async initialize(config: Partial<MonitoringConfig>): Promise<void> {
    this.config = { ...this.config, ...config }

    if (this.config.enabled) {
      await this.startMonitoring()
    }
  }

  /**
   * Start periodic monitoring
   */
  private async startMonitoring(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    // Initial check
    await this.checkSensors()

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkSensors()
    }, this.config.checkInterval)
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Check sensors and trigger alerts
   */
  async checkSensors(): Promise<void> {
    try {
      const { getActiveNodeToken } = await import("./blynk-nodes")
      const token = getActiveNodeToken()
      if (!token) {
        // Silently return if no token - this is expected when no node is configured
        return
      }

      // Fetch sensor data with timeout and error handling
      const sensorsUrl = `/api/sensors?token=${encodeURIComponent(token)}`
      const securityUrl = `/api/security?token=${encodeURIComponent(token)}`

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      try {
        // Use Promise.allSettled to handle individual failures gracefully
        const [sensorsResult, securityResult] = await Promise.allSettled([
          fetch(sensorsUrl, { cache: "no-store", signal: controller.signal }).catch(() => null),
          fetch(securityUrl, { cache: "no-store", signal: controller.signal }).catch(() => null),
        ])

        clearTimeout(timeoutId)

        // Check if sensors fetch succeeded
        if (
          sensorsResult.status === "rejected" ||
          !sensorsResult.value ||
          !sensorsResult.value.ok
        ) {
          // Silently fail - don't spam console with errors
          return
        }

        // Parse sensor data
        let sensorsData: SensorData
        try {
          sensorsData = (await sensorsResult.value.json()) as SensorData
        } catch (parseError) {
          // Invalid JSON response - silently fail
          return
        }

        // Handle security data (optional - may not always be available)
        let pir = 0
        let flame = 0
        if (securityResult.status === "fulfilled" && securityResult.value && securityResult.value.ok) {
          try {
            const securityData = (await securityResult.value.json()) as { pir?: number; flame?: number }
            pir = securityData.pir ?? 0
            flame = securityData.flame ?? 0
          } catch {
            // Security data parse error - use defaults
          }
        }

        // Validate sensor data before processing
        if (
          typeof sensorsData.soilMoisture !== "number" ||
          typeof sensorsData.temperature !== "number" ||
          typeof sensorsData.humidity !== "number" ||
          typeof sensorsData.ph !== "number"
        ) {
          // Invalid data structure - silently fail
          return
        }

        const sensorData: SensorData = {
          ...sensorsData,
          pir,
          flame,
        }

        // Check for instant alerts (fire and animal)
        if (this.config.instantAlerts) {
          await this.checkInstantAlerts(sensorData)
        }

        // Send periodic alert
        if (this.config.periodicAlerts) {
          await this.sendPeriodicAlert(sensorData)
        }

        this.lastCheckTime = Date.now()
      } catch (fetchError) {
        clearTimeout(timeoutId)
        // Silently handle fetch errors - don't spam console
        // These are expected when network is unavailable or API is down
        return
      }
    } catch (error) {
      // Silently handle all other errors - don't spam console
      // These are expected in various scenarios (no token, network issues, etc.)
      return
    }
  }

  private lastCriticalMoistureAlert: number = 0
  private lastCriticalTempAlert: number = 0
  private criticalAlertCooldown = 60000 // 1 minute cooldown for critical alerts

  /**
   * Check for instant alerts (fire and animal)
   */
  private async checkInstantAlerts(data: SensorData): Promise<void> {
    const now = Date.now()

    // Check for fire (flame sensor)
    if (data.flame > 0) {
      if (now - this.lastFireAlert > this.alertCooldown) {
        this.lastFireAlert = now
        const alert = formatAlertMessage("fire", { location: "Farm" })
        await this.triggerAlert(alert, true)
      }
    }

    // Check for animal intrusion (PIR sensor)
    if (data.pir > 0) {
      if (now - this.lastAnimalAlert > this.alertCooldown) {
        this.lastAnimalAlert = now
        const alert = formatAlertMessage("animal", { location: "Farm" })
        await this.triggerAlert(alert, true)
      }
    }

    // CRITICAL: Zero or negative soil moisture - IMPOSSIBLE for plant growth
    if (data.soilMoisture <= 0) {
      if (now - this.lastCriticalMoistureAlert > this.criticalAlertCooldown) {
        this.lastCriticalMoistureAlert = now
        showBrowserNotification({
          title: "🚨 CRITICAL ALERT: Zero Soil Moisture",
          body: "Soil moisture is 0% - This is impossible for plant growth! Check sensor immediately. No crop can survive without water. Immediate irrigation required if reading is accurate.",
          urgent: true,
          tag: "critical-moisture-zero",
        })
      }
    }
    // CRITICAL: Extremely low soil moisture (< 5%)
    else if (data.soilMoisture < 5) {
      if (now - this.lastCriticalMoistureAlert > this.criticalAlertCooldown) {
        this.lastCriticalMoistureAlert = now
        showBrowserNotification({
          title: "🚨 CRITICAL: Critically Low Soil Moisture",
          body: `Soil moisture is critically low (${data.soilMoisture.toFixed(1)}%). Plants cannot survive at this level. Immediate irrigation required within 1 hour to prevent crop failure.`,
          urgent: true,
          tag: "critical-moisture-low",
        })
      }
    }
    // WARNING: Very low soil moisture (< 20%)
    else if (data.soilMoisture < 20) {
      if (now - this.lastCriticalMoistureAlert > this.criticalAlertCooldown) {
        this.lastCriticalMoistureAlert = now
        showBrowserNotification({
          title: "⚠️ WARNING: Very Low Soil Moisture",
          body: `Soil moisture is very low (${data.soilMoisture.toFixed(1)}%). Most crops need 30-40% minimum. Schedule irrigation within 2-4 hours to prevent crop stress.`,
          urgent: false,
          tag: "warning-moisture-low",
        })
      }
    }

    // CRITICAL: Extreme temperatures (outside survival range)
    if (data.temperature > 50 || data.temperature < -10) {
      if (now - this.lastCriticalTempAlert > this.criticalAlertCooldown) {
        this.lastCriticalTempAlert = now
        showBrowserNotification({
          title: "🚨 CRITICAL: Extreme Temperature",
          body: `Extreme temperature (${data.temperature.toFixed(1)}°C) detected. This is outside survival range for all crops. Please verify your temperature sensor is functioning correctly.`,
          urgent: true,
          tag: "critical-temp-extreme",
        })
      }
    }
    // CRITICAL: Freezing temperatures
    else if (data.temperature < 0) {
      if (now - this.lastCriticalTempAlert > this.criticalAlertCooldown) {
        this.lastCriticalTempAlert = now
        showBrowserNotification({
          title: "🚨 CRITICAL: Freezing Temperature",
          body: `Freezing temperature (${data.temperature.toFixed(1)}°C) detected. Most crops cannot survive freezing conditions. Immediate protective measures required: use row covers, greenhouse protection, or consider cold-tolerant varieties.`,
          urgent: true,
          tag: "critical-temp-freezing",
        })
      }
    }
    // CRITICAL: Extreme heat
    else if (data.temperature > 45) {
      if (now - this.lastCriticalTempAlert > this.criticalAlertCooldown) {
        this.lastCriticalTempAlert = now
        showBrowserNotification({
          title: "🚨 CRITICAL: Extreme Heat",
          body: `Extreme heat (${data.temperature.toFixed(1)}°C) will cause severe crop damage. Implement emergency cooling measures: shade nets, increased irrigation frequency (3-4 times daily), and consider heat-tolerant crop varieties only.`,
          urgent: true,
          tag: "critical-temp-heat",
        })
      }
    }
  }

  /**
   * Send periodic alert (every 10 minutes)
   */
  private async sendPeriodicAlert(data: SensorData): Promise<void> {
    const alert = formatAlertMessage("periodic")
    await this.triggerAlert(alert, false)
  }

  /**
   * Trigger alert (browser notification with sound)
   */
  private async triggerAlert(
    alert: { title: string; body: string; urgent: boolean },
    isInstant: boolean
  ): Promise<void> {
    // Browser notification with sound
    showBrowserNotification({
      title: alert.title,
      body: alert.body,
      urgent: alert.urgent,
      tag: isInstant ? "instant-alert" : "periodic-alert",
    })
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config }

    if (this.config.enabled && !this.intervalId) {
      this.startMonitoring()
    } else if (!this.config.enabled && this.intervalId) {
      this.stopMonitoring()
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config }
  }
}

// Singleton instance
export const monitoringService = new MonitoringService()

