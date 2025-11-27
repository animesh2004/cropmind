import { NextResponse } from "next/server"
import { fetchBlynkSensors } from "@/lib/blynk"
import { blynkStorage } from "@/lib/blynk-storage"

type Period = "1Day" | "1Week" | "1Month"

// Fallback data if no database data available
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

    // Get Blynk token from query parameter
    const token = searchParams.get("token")

    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date()
    switch (period) {
      case "1Day":
        startDate.setDate(now.getDate() - 1)
        break
      case "1Week":
        startDate.setDate(now.getDate() - 7)
        break
      case "1Month":
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    let data: Array<Record<string, number | string>> = []

    // Get real-time data or use fallback
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

    // Use base data and add current reading
    const baseData = [...baseDataByPeriod[period]]
    if (currentData) {
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

      if (baseData.length > 0) {
        baseData[baseData.length - 1] = currentEntry
    } else {
        baseData.push(currentEntry)
    }
    }

    data = baseData

    return NextResponse.json({ period, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Error in history API:", error)
    // Fallback to base data on error
    const periodParam = (new URL(request.url).searchParams.get("period") as Period) || "1Week"
    const period: Period = ["1Day", "1Week", "1Month"].includes(periodParam) ? periodParam : "1Week"
    return NextResponse.json({ period, data: baseDataByPeriod[period] })
  }
}



