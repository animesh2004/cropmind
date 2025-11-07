import { NextResponse } from "next/server"
import { fetchBlynkSensors } from "@/lib/blynk"
import { blynkStorage } from "@/lib/blynk-storage"

type Period = "1Day" | "1Week" | "1Month"

// Base historical data (can be replaced with database in production)
const baseDataByPeriod: Record<Period, Array<Record<string, number | string>>> = {
  "1Day": [
    { time: "00:00", temp: 22.1, moisture: 51.0, humidity: 58.2 },
    { time: "04:00", temp: 20.5, moisture: 53.2, humidity: 62.1 },
    { time: "08:00", temp: 23.8, moisture: 54.7, humidity: 59.5 },
    { time: "12:00", temp: 26.2, moisture: 55.3, humidity: 55.1 },
    { time: "16:00", temp: 25.4, moisture: 54.9, humidity: 58.7 },
    { time: "20:00", temp: 24.5, moisture: 55.3, humidity: 62.1 },
  ],
  "1Week": [
    { time: "6 days ago", temp: 24, moisture: 45, humidity: 65 },
    { time: "5 days ago", temp: 25, moisture: 48, humidity: 68 },
    { time: "4 days ago", temp: 23, moisture: 52, humidity: 62 },
    { time: "3 days ago", temp: 26, moisture: 55, humidity: 70 },
    { time: "2 days ago", temp: 24, moisture: 58, humidity: 68 },
    { time: "Yesterday", temp: 25, moisture: 60, humidity: 66 },
  ],
  "1Month": [
    { time: "Week 1", temp: 22, moisture: 48, humidity: 60 },
    { time: "Week 2", temp: 24, moisture: 52, humidity: 65 },
    { time: "Week 3", temp: 25, moisture: 55, humidity: 68 },
  ],
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodParam = (searchParams.get("period") as Period) || "1Week"
    const period: Period = ["1Day", "1Week", "1Month"].includes(periodParam)
      ? periodParam
      : "1Week"

    // Try to get current sensor data
    const token = searchParams.get("token")
    let currentData: { temp: number; moisture: number; humidity: number } | null = null

    if (token) {
      // Try webhook data first
      const webhookData = blynkStorage.getSensorData(token)
      if (webhookData) {
        currentData = {
          temp: webhookData.temperature,
          moisture: webhookData.soilMoisture,
          humidity: webhookData.humidity,
        }
      } else {
        // Fallback to polling
        const blynkData = await fetchBlynkSensors(token)
        if (blynkData) {
          currentData = {
            temp: blynkData.temperature,
            moisture: blynkData.soilMoisture,
            humidity: blynkData.humidity,
          }
        }
      }
    }

    // If no token or failed to fetch, use mock current data
    if (!currentData) {
      currentData = {
        temp: 24.5,
        moisture: 55.3,
        humidity: 62.1,
      }
    }

    // Get base data for the period
    const baseData = [...baseDataByPeriod[period]]

    // Add current data as "Today" or "Now" entry
    const now = new Date()
    const timeLabel =
      period === "1Day"
        ? `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
        : period === "1Week"
          ? "Today"
          : "Week 4"

    const currentEntry = {
      time: timeLabel,
      temp: Number(currentData.temp.toFixed(1)),
      moisture: Number(currentData.moisture.toFixed(1)),
      humidity: Number(currentData.humidity.toFixed(1)),
    }

    // Update or add current entry - replace last entry if it's the same time period
    let data = [...baseData]
    
    // Always update the last entry with current real-time data for dynamic updates
    const lastEntry = data[data.length - 1]
    if (lastEntry) {
      // Update existing last entry with current real-time data
      data[data.length - 1] = {
        ...lastEntry,
        temp: currentEntry.temp,
        moisture: currentEntry.moisture,
        humidity: currentEntry.humidity,
      }
    } else {
      // Add new entry if no data exists
      data.push(currentEntry)
    }

    // For 1Day period, add more granular updates by appending new entries every few hours
    if (period === "1Day" && data.length < 12) {
      // Add current entry if it's a new time slot
      const now = new Date()
      const currentHour = now.getHours()
      const lastEntryTime = lastEntry?.time as string
      
      // Check if we need to add a new entry (every 2 hours)
      if (!lastEntryTime || !lastEntryTime.includes(`${currentHour.toString().padStart(2, "0")}:`)) {
        data.push(currentEntry)
      }
    }

    return NextResponse.json({ period, data, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("Error in history API:", error)
    // Fallback to base data on error
    const periodParam = (new URL(request.url).searchParams.get("period") as Period) || "1Week"
    const period: Period = ["1Day", "1Week", "1Month"].includes(periodParam) ? periodParam : "1Week"
    return NextResponse.json({ period, data: baseDataByPeriod[period] })
  }
}



