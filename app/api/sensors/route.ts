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
    let blynkError = null
    try {
      blynkData = await fetchBlynkSensors(token)
    } catch (error) {
      blynkError = error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      } : String(error)
      console.error("Error fetching from Blynk:", error)
      
      // Log detailed error for deployment debugging
      if (process.env.NODE_ENV === "production") {
        console.error("[DEPLOYMENT] Blynk fetch error details:", {
          token: token.substring(0, 8) + "...",
          error: blynkError,
          timestamp: new Date().toISOString(),
        })
      }
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

    // If both fail, return mock data with warning (better UX than error)
    // This ensures the UI still works even if Blynk is unavailable
    const now = new Date().toISOString()
    
    // Include error details in development, but not in production for security
    const errorDetails = process.env.NODE_ENV === "development" && blynkError 
      ? { debug: blynkError }
      : {}
    
    return NextResponse.json({
      timestamp: now,
      soilMoisture: 55.3,
      temperature: 24.5,
      humidity: 62.1,
      ph: 6.8,
      pir: 0,
      flame: 0,
      status: "warning",
      source: "fallback",
      message: "Using fallback data. Please check your Blynk token and ensure your IoT device is connected to Blynk cloud.",
      debugUrl: process.env.NODE_ENV === "development" 
        ? `/api/sensors/debug?token=${encodeURIComponent(token)}`
        : undefined,
      ...errorDetails,
    })
  } catch (error) {
    console.error("Error in sensors API:", error)
    
    // Return fallback data instead of error to keep UI functional
    const now = new Date().toISOString()
    return NextResponse.json({
      timestamp: now,
      soilMoisture: 55.3,
      temperature: 24.5,
      humidity: 62.1,
      ph: 6.8,
      pir: 0,
      flame: 0,
      status: "error",
      source: "fallback",
      message: "API error occurred. Using fallback data.",
      error: error instanceof Error ? error.message : String(error)
    })
  }
}



