import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

interface CropRecord {
  Temperature: string
  Humidity: string
  Moisture: string
  "Soil Type": string
  Crop: string
  Fertilizer: string
}

/**
 * Get crop recommendations based on environmental conditions
 * Uses the data_core.csv dataset to find best matching crops
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { temperature, humidity, moisture, soilType } = body

    if (typeof temperature !== "number" || typeof humidity !== "number" || typeof moisture !== "number") {
      return NextResponse.json({ error: "Invalid input parameters" }, { status: 400 })
    }

    // Load dataset
    const filePath = join(process.cwd(), "lib", "data_core.csv")
    const fileContent = readFileSync(filePath, "utf-8")
    const lines = fileContent.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim())

    const records: CropRecord[] = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim())
      const record: Record<string, string> = {}
      headers.forEach((header, index) => {
        record[header] = values[index] || ""
      })
      return record as CropRecord
    })

    // Find matching records
    const matches = records.filter((record) => {
      const tempMatch = Math.abs(Number(record.Temperature) - temperature) <= 5
      const humidityMatch = Math.abs(Number(record.Humidity) - humidity) <= 10
      const moistureMatch = Math.abs(Number(record.Moisture) - moisture) <= 10
      const soilMatch = !soilType || record["Soil Type"].toLowerCase() === soilType.toLowerCase()

      return tempMatch && humidityMatch && moistureMatch && soilMatch
    })

    // If no exact matches, find closest matches
    let results = matches
    if (results.length === 0) {
      const scored = records.map((record) => {
        const tempDiff = Math.abs(Number(record.Temperature) - temperature)
        const humidityDiff = Math.abs(Number(record.Humidity) - humidity)
        const moistureDiff = Math.abs(Number(record.Moisture) - moisture)
        const distance = tempDiff * 2 + humidityDiff + moistureDiff
        return { record, distance }
      })

      scored.sort((a, b) => a.distance - b.distance)
      results = scored.slice(0, 50).map((s) => s.record)
    }

    // Group by crop and fertilizer
    const grouped = results.reduce(
      (acc, record) => {
        const key = `${record.Crop}|${record.Fertilizer}|${record["Soil Type"]}`
        if (!acc[key]) {
          acc[key] = {
            crop: record.Crop,
            fertilizer: record.Fertilizer,
            soilType: record["Soil Type"],
            count: 0,
          }
        }
        acc[key].count++
        return acc
      },
      {} as Record<string, { crop: string; fertilizer: string; soilType: string; count: number }>
    )

    // Convert to recommendations
    const recommendations = Object.values(grouped)
      .map((group) => ({
        crop: group.crop,
        fertilizer: group.fertilizer,
        soilType: group.soilType,
        confidence: Math.min(1.0, group.count / 100),
        matchCount: group.count,
      }))
      .sort((a, b) => {
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence
        }
        return b.matchCount - a.matchCount
      })
      .slice(0, 10)

    return NextResponse.json({
      recommendations,
      totalMatches: results.length,
      source: "dataset",
    })
  } catch (error) {
    console.error("Error getting recommendations:", error)
    return NextResponse.json(
      { error: "Failed to get recommendations", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}


