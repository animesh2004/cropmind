import { NextRequest, NextResponse } from "next/server"
import { blynkStorage } from "@/lib/blynk-storage"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv" // csv, json
    const token = searchParams.get("token") // Blynk token

    if (!token) {
      return NextResponse.json(
        { error: "Blynk token is required" },
        { status: 400 }
      )
    }

    // Get current sensor data from webhook storage
    const currentData = blynkStorage.getSensorData(token)
    
    // For download, we'll export the current reading
    // In a real implementation, you'd fetch historical data from a database
    const sensorData = currentData ? [currentData] : []

    if (format === "json") {
      return NextResponse.json(
        {
          token,
          sensorData: sensorData.map((d) => ({
            timestamp: d.timestamp,
            soilMoisture: d.soilMoisture,
            temperature: d.temperature,
            humidity: d.humidity,
            ph: d.ph,
            pir: d.pir,
            flame: d.flame,
          })),
          totalRecords: sensorData.length,
          exportDate: new Date().toISOString(),
          note: "This export contains the most recent sensor reading. For historical data, use the Historical Data section.",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="cropmind-data-${new Date().toISOString().split("T")[0]}.json"`,
          },
        }
      )
    }

    // CSV format
    const csvHeaders = [
      "Timestamp",
      "Soil Moisture (%)",
      "Temperature (°C)",
      "Humidity (%)",
      "pH",
      "PIR (Motion)",
      "Flame",
    ]

    const csvRows = sensorData.map((d) => [
      d.timestamp,
      d.soilMoisture?.toFixed(2) || "",
      d.temperature?.toFixed(2) || "",
      d.humidity?.toFixed(2) || "",
      d.ph?.toFixed(2) || "",
      d.pir?.toString() || "0",
      d.flame?.toString() || "0",
    ])

    // Add summary at the top
    const summary = [
      `CropMind Data Export`,
      `Blynk Token: ${token}`,
      `Total Records: ${sensorData.length}`,
      `Export Date: ${new Date().toLocaleString()}`,
      `Note: This export contains the most recent sensor reading. For historical data, use the Historical Data section.`,
      ``,
      csvHeaders.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n")

    return new NextResponse(summary, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="cropmind-data-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error downloading data:", error)
    return NextResponse.json(
      { error: "Failed to download data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

