import { NextResponse } from "next/server"
import { blynkStorage } from "@/lib/blynk-storage"

/**
 * Blynk Webhook Endpoint
 * Supports multiple Blynk webhook formats:
 * 1. Custom JSON: {"token":"...","pin":"V0","value":"55.3"}
 * 2. Blynk Default: {"deviceId":"...","datastreamId":"V0","value":"55.3"}
 * 3. Web Form: token=xxx&pin=V0&value=55.3
 * 4. URL Parameters: ?token=xxx&pin=V0&value=55.3
 */

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || ""
    let body: any = {}

    // Parse body based on content type
    if (contentType.includes("application/json")) {
      body = await request.json().catch(() => ({}))
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData().catch(() => null)
      if (formData) {
        body = Object.fromEntries(formData.entries())
      }
    } else {
      // Try JSON first, fallback to text
      try {
        body = await request.json()
      } catch {
        const text = await request.text()
        // Try to parse as URL-encoded
        const params = new URLSearchParams(text)
        body = Object.fromEntries(params.entries())
      }
    }

    // Extract token from various possible fields
    const token =
      body.token ||
      body.deviceToken ||
      body.authToken ||
      request.headers.get("x-blynk-token") ||
      request.headers.get("authorization")?.replace("Bearer ", "")

    // Extract pin from various possible fields
    const pin =
      body.pin ||
      body.p ||
      body.vPin ||
      body.datastreamId ||
      body.datastream?.replace("V", "V") ||
      body.virtualPin

    // Extract value from various possible fields
    const value = body.value || body.val || body.data

    if (!token || !pin || value === undefined) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          received: { token: !!token, pin: !!pin, value: value !== undefined },
          hint: "Expected: token, pin (or datastreamId), value",
        },
        { status: 400 }
      )
    }

    // Normalize pin format (ensure it starts with V)
    let normalizedPin = pin.toString()
    if (!normalizedPin.startsWith("V")) {
      // If it's just a number, add V prefix
      if (/^\d+$/.test(normalizedPin)) {
        normalizedPin = `V${normalizedPin}`
      } else {
        normalizedPin = `V${normalizedPin.replace(/[^0-9]/g, "")}`
      }
    }

    // Validate pin format (V0-V8 for our sensors)
    if (!/^V[0-9]+$/.test(normalizedPin)) {
      return NextResponse.json(
        { error: "Invalid pin format", received: pin, normalized: normalizedPin },
        { status: 400 }
      )
    }

    // Convert value to number if possible
    const numValue = Number(value)
    const finalValue = isNaN(numValue) ? value : numValue

    // Store webhook data
    blynkStorage.storeWebhookData(token, normalizedPin, finalValue)

    console.log(
      `[Blynk Webhook] Received: ${normalizedPin} = ${finalValue} for token ${token.substring(0, 8)}...`
    )

    return NextResponse.json({
      success: true,
      message: "Webhook data received",
      pin: normalizedPin,
      value: finalValue,
      source: "webhook",
    })
  } catch (error) {
    console.error("Error processing Blynk webhook:", error)
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET method for URL-based webhooks (Blynk supports both POST and GET)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const token =
      searchParams.get("token") ||
      searchParams.get("deviceToken") ||
      searchParams.get("authToken")

    const pin =
      searchParams.get("pin") ||
      searchParams.get("p") ||
      searchParams.get("vPin") ||
      searchParams.get("datastreamId")

    const value = searchParams.get("value") || searchParams.get("val") || searchParams.get("data")

    if (!token || !pin || !value) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          hint: "Expected: ?token=xxx&pin=V0&value=55.3",
        },
        { status: 400 }
      )
    }

    // Normalize pin format
    let normalizedPin = pin.toString()
    if (!normalizedPin.startsWith("V")) {
      if (/^\d+$/.test(normalizedPin)) {
        normalizedPin = `V${normalizedPin}`
      } else {
        normalizedPin = `V${normalizedPin.replace(/[^0-9]/g, "")}`
      }
    }

    if (!/^V[0-9]+$/.test(normalizedPin)) {
      return NextResponse.json(
        { error: "Invalid pin format", received: pin },
        { status: 400 }
      )
    }

    const numValue = Number(value)
    const finalValue = isNaN(numValue) ? value : numValue

    blynkStorage.storeWebhookData(token, normalizedPin, finalValue)

    console.log(
      `[Blynk Webhook] Received: ${normalizedPin} = ${finalValue} for token ${token.substring(0, 8)}...`
    )

    return NextResponse.json({
      success: true,
      message: "Webhook data received",
      pin: normalizedPin,
      value: finalValue,
      source: "webhook",
    })
  } catch (error) {
    console.error("Error processing Blynk webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}

