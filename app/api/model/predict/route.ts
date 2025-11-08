import { NextResponse } from "next/server"
import { findBestCrop, getCropData } from "@/lib/crop-data"

/**
 * Model Prediction API
 * This endpoint simulates sending data to a model and receiving predictions
 * In production, this would call your deployed ML model
 * 
 * Input format:
 * {
 *   "inputs": {
 *     "moisture": number,
 *     "temperature": number,
 *     "humidity": number
 *   }
 * }
 * 
 * Output format:
 * {
 *   "predictions": string[],
 *   "recommendations": string[],
 *   "confidence": number,
 *   "crop": string,
 *   "source": "model"
 * }
 */

type ModelInput = {
  inputs: {
    moisture: number
    temperature: number
    humidity: number
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ModelInput

    if (!body.inputs) {
      return NextResponse.json({ error: "Missing inputs" }, { status: 400 })
    }

    const { moisture, temperature, humidity } = body.inputs

    // Validate inputs
    if (
      typeof moisture !== "number" ||
      typeof temperature !== "number" ||
      typeof humidity !== "number"
    ) {
      return NextResponse.json({ error: "Invalid input types" }, { status: 400 })
    }

    // Simulate model prediction (in production, this would call your actual ML model)
    // This uses ML-like logic to generate predictions based on the input data
    const predictions = generateModelPredictions(moisture, temperature, humidity)

    // Get complete crop data
    const cropData = getCropData(predictions.crop)
    
    return NextResponse.json({
      predictions: predictions.recommendations,
      recommendations: predictions.recommendations,
      confidence: predictions.confidence,
      crop: predictions.crop,
      soilType: cropData?.soilType || "Loamy Soil",
      npkRatio: cropData?.npkRatio || "80-40-40",
      irrigationSchedule: cropData?.irrigationSchedule || "Moderate - Every 2-3 days",
      idealConditions: cropData
        ? {
            moisture: `${cropData.moisture.min}-${cropData.moisture.max}%`,
            temperature: `${cropData.temperature.min}-${cropData.temperature.max}°C`,
            humidity: `${cropData.humidity.min}-${cropData.humidity.max}%`,
          }
        : undefined,
      source: "model",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in model prediction API:", error)
    return NextResponse.json({ error: "Failed to generate predictions" }, { status: 500 })
  }
}

/**
 * Generate model predictions using ML-like logic
 * In production, this would be replaced with actual model inference
 */
function generateModelPredictions(
  moisture: number,
  temperature: number,
  humidity: number
): {
  recommendations: string[]
  confidence: number
  crop: string
} {
  const recommendations: string[] = []
  let riskScore = 0
  let crop = "Wheat"

  // ML-like feature engineering
  const moistureNormalized = (moisture - 50) / 20 // Normalize to -1 to 1
  const tempNormalized = (temperature - 20) / 10
  const humidityNormalized = (humidity - 60) / 20

  // Crop prediction using Kaggle dataset (22+ crops)
  const bestCropResult = findBestCrop(moisture, temperature, humidity)
  crop = bestCropResult.crop.name

  // Risk assessment using weighted features
  if (moisture < 30) {
    recommendations.push("🚨 CRITICAL: Soil moisture critically low. Immediate irrigation required.")
    riskScore += 3
  } else if (moisture < 40) {
    recommendations.push("⚠️ Soil moisture below optimal. Schedule irrigation within 2-4 hours.")
    riskScore += 2
  } else if (moisture > 75) {
    recommendations.push("⚠️ Excessive soil moisture detected. Risk of root rot. Reduce irrigation.")
    riskScore += 2
  } else {
    recommendations.push("✅ Soil moisture levels are optimal for healthy crop growth.")
  }

  if (temperature > 35) {
    recommendations.push("🌡️ EXTREME HEAT: Temperatures exceed safe limits. Implement shade nets and increase irrigation.")
    riskScore += 3
  } else if (temperature > 30) {
    recommendations.push("🌡️ High temperature conditions. Increase irrigation and monitor for heat stress.")
    riskScore += 2
  } else if (temperature < 10) {
    recommendations.push("❄️ FREEZING RISK: Low temperatures detected. Use row covers or greenhouse protection.")
    riskScore += 3
  } else if (temperature < 15) {
    recommendations.push("🌡️ Cool conditions. Consider mulching for heat retention.")
    riskScore += 1
  } else {
    recommendations.push("✅ Temperature is within the ideal range for most agricultural crops.")
  }

  if (humidity > 85) {
    recommendations.push("💨 VERY HIGH HUMIDITY: Extreme risk of fungal diseases. Ensure maximum ventilation.")
    riskScore += 3
  } else if (humidity > 75) {
    recommendations.push("💨 High humidity detected. Monitor for fungal diseases and improve air circulation.")
    riskScore += 2
  } else if (humidity < 30) {
    recommendations.push("🌵 VERY LOW HUMIDITY: High evaporation risk. Increase irrigation frequency.")
    riskScore += 2
  } else if (humidity < 40) {
    recommendations.push("💨 Low humidity conditions. Slightly increase irrigation frequency.")
    riskScore += 1
  } else {
    recommendations.push("✅ Humidity levels are suitable for optimal crop development.")
  }

  // Combined condition analysis (ML-like pattern recognition)
  if (moisture < 40 && temperature > 30) {
    recommendations.push("🔥 CRITICAL COMBINATION: Dry soil + high temperature = extreme stress. Priority irrigation needed immediately.")
    riskScore += 2
  }

  if (humidity > 80 && temperature > 25) {
    recommendations.push("🌧️ DISEASE RISK: High humidity + warm temperature creates ideal conditions for fungal pathogens.")
    riskScore += 2
  }

  if (moisture > 70 && humidity > 75) {
    recommendations.push("💧 WATERLOGGING RISK: High moisture + high humidity. Improve drainage immediately.")
    riskScore += 2
  }

  // Overall assessment
  if (riskScore === 0) {
    recommendations.push("🌟 EXCELLENT CONDITIONS: All parameters are optimal. Maintain current irrigation schedule.")
  } else if (riskScore <= 2) {
    recommendations.push("📊 MODERATE CONDITIONS: Minor adjustments recommended. Continue regular monitoring.")
  } else if (riskScore <= 4) {
    recommendations.push("⚠️ ATTENTION REQUIRED: Some conditions need immediate attention.")
  } else {
    recommendations.push("🚨 URGENT ACTION NEEDED: Multiple critical conditions detected. Implement emergency measures.")
  }

  // Calculate confidence based on data quality and risk score
  const confidence = riskScore === 0 ? 0.95 : Math.max(0.7, 0.95 - riskScore * 0.05)

  return {
    recommendations,
    confidence,
    crop,
  }
}

