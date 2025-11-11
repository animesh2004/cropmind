import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")

    const apiKey = process.env.OPENWEATHER_API_KEY || ""

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    if (!lat || !lon) {
      return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
    }

    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch location" }, { status: response.status })
    }

    const data = await response.json()

    if (data && data.length > 0) {
      return NextResponse.json({
        name: data[0].name,
        state: data[0].state,
        country: data[0].country,
        lat: data[0].lat,
        lon: data[0].lon,
      })
    }

    return NextResponse.json({ error: "Location not found" }, { status: 404 })
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

