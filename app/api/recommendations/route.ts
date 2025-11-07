import { NextResponse } from "next/server"
import { getKaggleRecommendations, generateRuleBasedRecommendations } from "@/lib/kaggle-ai"

type Input = {
  moisture: number
  temperature: number
  humidity: number
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Input>
    const moisture = Number(body.moisture)
    const temperature = Number(body.temperature)
    const humidity = Number(body.humidity)

    if ([moisture, temperature, humidity].some((v) => Number.isNaN(v))) {
      return NextResponse.json({ error: "Invalid inputs" }, { status: 400 })
    }

    const input = { moisture, temperature, humidity }

    // Try Kaggle AI API first
    const kaggleResult = await getKaggleRecommendations(input)

    if (kaggleResult && kaggleResult.recommendations.length > 0) {
      return NextResponse.json({
        recommendations: kaggleResult.recommendations,
        confidence: kaggleResult.confidence,
        source: kaggleResult.source || "kaggle",
      })
    }

    // Fallback to rule-based recommendations
    const ruleBasedResult = generateRuleBasedRecommendations(input)

    return NextResponse.json({
      recommendations: ruleBasedResult.recommendations,
      confidence: ruleBasedResult.confidence,
      source: ruleBasedResult.source || "rule-based",
    })
  } catch (e) {
    console.error("Error in recommendations API:", e)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}



