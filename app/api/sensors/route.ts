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

    // In production/serverless environments, webhook storage may not persist
    // So we prioritize direct polling, but check webhook storage as a bonus
    let webhookData = null
    try {
      webhookData = blynkStorage.getSensorData(token)
    } catch (error) {
      // Webhook storage might not be available in serverless - that's okay
      console.log("Webhook storage not available, using polling")
    }

    // Always try polling first (more reliable in production)
    let blynkData = null
    try {
      blynkData = await fetchBlynkSensors(token)
    } catch (error) {
      console.error("Error fetching from Blynk:", error)
    }

    // Use webhook data if available and recent, otherwise use polling data
    if (webhookData && webhookData.source === "webhook") {
      // Check if webhook data is recent (within last 2 minutes)
      const dataAge = Date.now() - new Date(webhookData.timestamp).getTime()
      if (dataAge < 120000) { // 2 minutes
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
    }

    // Use polling data if available
    if (blynkData) {
    const ph = blynkData.ph || 6.8
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
    }

    // If both fail, return error with helpful message
    return NextResponse.json(
      { 
        error: "Failed to fetch data from Blynk. Please check your token and ensure Blynk device is online.",
        hint: "Make sure your Blynk token is correct and your IoT device is connected to Blynk cloud."
      },
      { status: 500 }
    )
  } catch (error) {
    console.error("Error in sensors API:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}



