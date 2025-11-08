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

    // Try dataset-based recommendations first (most accurate)
    try {
      const datasetResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/dataset/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature,
          humidity,
          moisture,
        }),
      })

      if (datasetResponse.ok) {
        const datasetData = await datasetResponse.json()
        if (datasetData.recommendations && datasetData.recommendations.length > 0) {
          const topRecommendation = datasetData.recommendations[0]
          
          // Convert dataset recommendations to format expected by frontend
          const recommendations: string[] = []
          recommendations.push(`✅ Recommended Crop: ${topRecommendation.crop}`)
          recommendations.push(`🌱 Recommended Fertilizer: ${topRecommendation.fertilizer}`)
          recommendations.push(`🌍 Recommended Soil Type: ${topRecommendation.soilType}`)
          recommendations.push(`📊 Confidence: ${Math.round(topRecommendation.confidence * 100)}% (based on ${datasetData.totalMatches} matching records)`)
          
          if (datasetData.recommendations.length > 1) {
            recommendations.push(`\n💡 Alternative Recommendations:`)
            datasetData.recommendations.slice(1, 4).forEach((rec: any, idx: number) => {
              recommendations.push(`${idx + 2}. ${rec.crop} with ${rec.fertilizer} (${rec.soilType} soil)`)
            })
          }

          return NextResponse.json({
            recommendations,
            confidence: topRecommendation.confidence,
            source: "dataset",
            crop: topRecommendation.crop,
            fertilizer: topRecommendation.fertilizer,
            soilType: topRecommendation.soilType,
            matchCount: topRecommendation.matchCount,
          })
        }
      }
    } catch (error) {
      console.log("Dataset recommendation failed, falling back to other methods:", error)
    }

    // Try Kaggle AI API as fallback
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



