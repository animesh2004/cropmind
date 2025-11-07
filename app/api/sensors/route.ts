import { NextResponse } from "next/server"
import { fetchBlynkSensors } from "@/lib/blynk"
import { blynkStorage } from "@/lib/blynk-storage"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      // Fallback to mock data if no token provided
      const now = new Date().toISOString()
      return NextResponse.json({
        timestamp: now,
        soilMoisture: 55.3,
        temperature: 24.5,
        humidity: 62.1,
        ph: 6.8,
        status: "ok",
        source: "mock",
      })
    }

    // Try to get data from webhook storage first (real-time)
    const webhookData = blynkStorage.getSensorData(token)

    if (webhookData) {
      return NextResponse.json({
        timestamp: webhookData.timestamp,
        soilMoisture: webhookData.soilMoisture,
        temperature: webhookData.temperature,
        humidity: webhookData.humidity,
        ph: webhookData.ph,
        pir: webhookData.pir,
        flame: webhookData.flame,
        status: "ok",
        source: "webhook",
      })
    }

    // Fallback to polling if webhook data not available
    const blynkData = await fetchBlynkSensors(token)

    if (!blynkData) {
      return NextResponse.json(
        { error: "Failed to fetch data from Blynk. Please check your token or configure webhooks." },
        { status: 500 }
      )
    }

    // Calculate pH (placeholder - you may want to add a pH sensor or calculate from other factors)
    const ph = 6.8

    return NextResponse.json({
      timestamp: blynkData.timestamp,
      soilMoisture: blynkData.soilMoisture,
      temperature: blynkData.temperature,
      humidity: blynkData.humidity,
      ph: ph,
      pir: blynkData.pir,
      flame: blynkData.flame,
      status: "ok",
      source: "polling",
    })
  } catch (error) {
    console.error("Error in sensors API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



