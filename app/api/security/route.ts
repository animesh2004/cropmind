import { NextResponse } from "next/server"
import { fetchBlynkPin } from "@/lib/blynk"
import { blynkStorage } from "@/lib/blynk-storage"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      // Fallback to mock data if no token provided
      return NextResponse.json({
        pir: 0, // 0 = no motion, 1 = motion detected
        flame: 0, // 0 = no flame, 1 = flame detected
        status: "safe",
        source: "mock",
      })
    }

    // Try to get data from webhook storage first (real-time)
    const webhookPir = blynkStorage.getPinValue(token, "V1")
    const webhookFlame = blynkStorage.getPinValue(token, "V2")

    if (webhookPir && webhookFlame) {
      const pir = typeof webhookPir.value === "number" ? Number(webhookPir.value) : 0
      const flame = typeof webhookFlame.value === "number" ? Number(webhookFlame.value) : 0

      // Determine status
      let status = "safe"
      if (flame > 0) {
        status = "critical"
      } else if (pir > 0) {
        status = "warning"
      }

      return NextResponse.json({
        pir,
        flame,
        status,
        source: "webhook",
      })
    }

    // Fallback to polling if webhook data not available
    const [pirData, flameData] = await Promise.all([
      fetchBlynkPin(token, "V1"), // PIR sensor
      fetchBlynkPin(token, "V2"), // Flame sensor
    ])

    const pir = typeof pirData?.value === "number" ? Number(pirData.value) : 0
    const flame = typeof flameData?.value === "number" ? Number(flameData.value) : 0

    // Determine status
    let status = "safe"
    if (flame > 0) {
      status = "critical"
    } else if (pir > 0) {
      status = "warning"
    }

    return NextResponse.json({
      pir,
      flame,
      status,
      source: "polling",
    })
  } catch (error) {
    console.error("Error in security API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

