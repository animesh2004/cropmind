import { NextResponse } from "next/server"
import { fetchBlynkSensors, fetchBlynkPin } from "@/lib/blynk"
import { BLYNK_API_URL } from "@/lib/ai"

/**
 * Debug endpoint to diagnose Blynk connectivity issues in deployment
 * Usage: GET /api/sensors/debug?token=YOUR_TOKEN
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({
        error: "Token is required",
        usage: "GET /api/sensors/debug?token=YOUR_BLYNK_TOKEN",
      }, { status: 400 })
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      token: token.substring(0, 8) + "...",
      environment: process.env.NODE_ENV,
      blynkApiUrl: BLYNK_API_URL,
      tests: {},
    }

    // Test 1: Direct Blynk API call (single pin)
    try {
      const testUrl = `${BLYNK_API_URL}/external/api/get?token=${encodeURIComponent(token)}&V0`
      diagnostics.tests.directApiCall = {
        url: testUrl.replace(token, "TOKEN_HIDDEN"),
        status: "testing",
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const startTime = Date.now()
      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          "User-Agent": "CropMind-Debug/1.0",
          "Accept": "text/plain, application/json",
        },
        signal: controller.signal,
      })
      const endTime = Date.now()

      clearTimeout(timeoutId)

      const responseText = await response.text()
      
      diagnostics.tests.directApiCall = {
        status: response.ok ? "success" : "failed",
        httpStatus: response.status,
        httpStatusText: response.statusText,
        responseTime: `${endTime - startTime}ms`,
        responseBody: responseText.substring(0, 100),
        headers: {
          contentType: response.headers.get("content-type"),
          contentLength: response.headers.get("content-length"),
        },
      }
    } catch (error: any) {
      diagnostics.tests.directApiCall = {
        status: "error",
        error: error.message,
        errorType: error.name,
        isTimeout: error.name === "AbortError",
      }
    }

    // Test 2: Using fetchBlynkPin helper
    try {
      const pinData = await fetchBlynkPin(token, "V0")
      diagnostics.tests.helperFunction = {
        status: pinData ? "success" : "failed",
        data: pinData,
      }
    } catch (error: any) {
      diagnostics.tests.helperFunction = {
        status: "error",
        error: error.message,
      }
    }

    // Test 3: Using fetchBlynkSensors (all pins)
    try {
      const sensorsData = await fetchBlynkSensors(token)
      diagnostics.tests.allSensors = {
        status: sensorsData ? "success" : "failed",
        hasData: !!sensorsData,
        dataKeys: sensorsData ? Object.keys(sensorsData) : [],
      }
    } catch (error: any) {
      diagnostics.tests.allSensors = {
        status: "error",
        error: error.message,
      }
    }

    // Test 4: Network connectivity
    try {
      const testResponse = await fetch("https://blynk.cloud", {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      })
      diagnostics.tests.networkConnectivity = {
        status: testResponse.ok ? "success" : "failed",
        httpStatus: testResponse.status,
      }
    } catch (error: any) {
      diagnostics.tests.networkConnectivity = {
        status: "error",
        error: error.message,
      }
    }

    // Summary
    const allTestsPassed = 
      diagnostics.tests.directApiCall?.status === "success" ||
      diagnostics.tests.helperFunction?.status === "success" ||
      diagnostics.tests.allSensors?.status === "success"

    diagnostics.summary = {
      allTestsPassed,
      recommendation: allTestsPassed
        ? "Blynk API is accessible. Check token validity and device connection."
        : "Blynk API is not accessible. Check network connectivity, firewall rules, and deployment platform restrictions.",
    }

    return NextResponse.json(diagnostics, {
      status: allTestsPassed ? 200 : 500,
    })
  } catch (error) {
    return NextResponse.json({
      error: "Debug endpoint failed",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

