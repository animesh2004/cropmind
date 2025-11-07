import { NextResponse } from "next/server"

/**
 * Test Kaggle API Connection
 * This endpoint tests if Kaggle API credentials are working
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username") || "animeshtri12"
  const key = searchParams.get("key") || "b3a9bb041929fa6d6378f9086cbdf7da"

  try {
    // Test 1: Check Kaggle API authentication with a simple endpoint
    // Kaggle API uses HTTP Basic Auth: username:key encoded in base64
    const credentials = Buffer.from(`${username}:${key}`).toString("base64")

    // Test with Kaggle Datasets API (list datasets)
    const testUrl = "https://www.kaggle.com/api/v1/datasets/list?pageSize=1"
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: "Kaggle API connection successful!",
        test: "datasets_list",
        status: response.status,
        data: data,
      })
    } else {
      const errorText = await response.text()
      return NextResponse.json(
        {
          success: false,
          message: "Kaggle API connection failed",
          status: response.status,
          error: errorText,
        },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error("Kaggle API test error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error testing Kaggle API",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

