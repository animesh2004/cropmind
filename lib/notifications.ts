/**
 * Notification Service
 * Handles browser notifications with sound alerts
 */

export interface NotificationData {
  title: string
  body: string
  icon?: string
  tag?: string
  urgent?: boolean
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

/**
 * Play notification sound
 */
function playNotificationSound(urgent: boolean = false): void {
  try {
    // Create audio context for sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Different frequencies for urgent vs normal alerts
    if (urgent) {
      // Urgent: Higher frequency, multiple beeps
      oscillator.frequency.value = 800
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)

      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        osc2.connect(gain2)
        gain2.connect(audioContext.destination)
        osc2.frequency.value = 800
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        osc2.start()
        osc2.stop(audioContext.currentTime + 0.2)
      }, 250)
    } else {
      // Normal: Single beep
      oscillator.frequency.value = 600
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.15)
    }
  } catch (error) {
    console.warn("Could not play notification sound:", error)
  }
}

/**
 * Show browser notification with sound
 */
export function showBrowserNotification(data: NotificationData): void {
  if (!("Notification" in window)) {
    console.warn("Browser notifications not supported")
    return
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted")
    return
  }

  // Play sound
  playNotificationSound(data.urgent)

  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon || "/placeholder-logo.png",
    tag: data.tag,
    requireInteraction: data.urgent || false,
    badge: "/placeholder-logo.png",
  }

  const notification = new Notification(data.title, options)

  // Auto-close non-urgent notifications after 5 seconds
  if (!data.urgent) {
    setTimeout(() => {
      notification.close()
    }, 5000)
  }
}

/**
 * Format alert message
 */
export function formatAlertMessage(
  type: "fire" | "animal" | "periodic" | "critical",
  data?: {
    sensor?: string
    value?: number | string
    location?: string
  }
): { title: string; body: string; urgent: boolean } {
  const location = data?.location || "Farm"

  switch (type) {
    case "fire":
      return {
        title: "🚨 FIRE DETECTED!",
        body: `URGENT: Fire detected at ${location}. Take immediate action!`,
        urgent: true,
      }
    case "animal":
      return {
        title: "⚠️ Animal Intrusion Detected",
        body: `Motion detected at ${location}. PIR sensor activated. Please check immediately.`,
        urgent: true,
      }
    case "critical":
      return {
        title: "⚠️ Critical Alert",
        body: `Critical condition detected: ${data?.sensor || "Unknown sensor"} - ${data?.value || "N/A"}`,
        urgent: true,
      }
    case "periodic":
      return {
        title: "📊 Farm Status Update",
        body: `10-minute status update: All sensors operational. Check dashboard for details.`,
        urgent: false,
      }
    default:
      return {
        title: "📊 Farm Alert",
        body: "Farm monitoring alert",
        urgent: false,
      }
  }
}

