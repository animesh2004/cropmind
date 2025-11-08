import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

/**
 * Load dataset from CSV file
 * This endpoint loads the data_core.csv file and returns it as JSON
 */
export async function GET() {
  try {
    // Read CSV file from lib directory
    const filePath = join(process.cwd(), "lib", "data_core.csv")
    const fileContent = readFileSync(filePath, "utf-8")

    // Parse CSV
    const lines = fileContent.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim())

    const records = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim())
      const record: Record<string, string> = {}
      headers.forEach((header, index) => {
        record[header] = values[index] || ""
      })
      return record
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Error loading dataset:", error)
    return NextResponse.json(
      { error: "Failed to load dataset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}


