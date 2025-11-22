/**
 * Google Gemini AI API Integration for Crop Recommendations
 * Provides intelligent, context-aware agricultural recommendations
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

export interface RecommendationInput {
  moisture: number
  temperature: number
  humidity: number
}

export interface GeminiRecommendationResponse {
  crop: string
  soilType: string
  fertilizer: string
  npkRatio: string
  irrigationSchedule: string
  confidence: number
  recommendations: string[]
  insights: string[]
  conditionMatch: string
  idealConditions: {
    moisture: string
    temperature: string
    humidity: string
  }
  source: "gemini"
}

/**
 * Generate comprehensive agricultural recommendations using Gemini AI
 */
export async function getGeminiRecommendations(
  input: RecommendationInput
): Promise<GeminiRecommendationResponse | null> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length === 0) {
    console.log("Gemini API key not configured")
    return null
  }

  try {
    const prompt = buildAgriculturalPrompt(input)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("Gemini API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200)
      })
      return null
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("Invalid Gemini API response structure")
      return null
    }

    const generatedText = data.candidates[0].content.parts[0].text
    
    // Parse JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("No JSON found in Gemini response")
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Transform to our expected format
    return {
      crop: parsed.recommendedCrop || parsed.crop || "Wheat",
      soilType: parsed.optimalSoilType || parsed.soilType || "Loamy Soil",
      fertilizer: parsed.recommendedFertilizer || parsed.fertilizer || "NPK 80-40-40",
      npkRatio: parsed.npkRatio || extractNPKFromFertilizer(parsed.recommendedFertilizer || parsed.fertilizer) || "80-40-40",
      irrigationSchedule: parsed.irrigationSchedule || parsed.irrigation || "Moderate - Every 2-3 days",
      confidence: Math.min(0.95, Math.max(0.7, parsed.confidence || 0.85)),
      recommendations: parsed.actionableRecommendations || parsed.recommendations || [],
      insights: parsed.insights || parsed.analysis || [],
      conditionMatch: parsed.conditionAssessment || determineConditionMatch(input),
      idealConditions: parsed.idealConditions || {
        moisture: parsed.idealMoisture || "50-70%",
        temperature: parsed.idealTemperature || "15-28°C",
        humidity: parsed.idealHumidity || "50-75%"
      },
      source: "gemini"
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Gemini API request timeout")
    } else {
      console.error("Error calling Gemini API:", error)
    }
    return null
  }
}

/**
 * Build comprehensive agricultural analysis prompt for Gemini
 */
function buildAgriculturalPrompt(input: RecommendationInput): string {
  const { moisture, temperature, humidity } = input

  return `You are an expert agricultural AI advisor specializing in precision farming and crop management. Analyze the following environmental conditions and provide comprehensive, actionable recommendations.

**Current Environmental Conditions:**
- Soil Moisture: ${moisture}%
- Temperature: ${temperature}°C
- Humidity: ${humidity}%

**Your Task:**
Provide a detailed agricultural analysis and recommendations in JSON format. Consider:

1. **Crop Recommendation**: Based on these conditions, recommend the most suitable crop(s) for cultivation. Consider:
   - Temperature tolerance ranges
   - Moisture requirements
   - Humidity preferences
   - Seasonal suitability
   - Yield potential
   - Market demand

2. **Soil Analysis**: Determine the optimal soil type for the recommended crop(s).

3. **Fertilizer Recommendation**: Suggest appropriate NPK fertilizer ratios and specific fertilizer types based on:
   - Crop nutrient requirements
   - Soil conditions
   - Growth stage considerations
   - Organic vs. synthetic options

4. **Irrigation Schedule**: Provide detailed irrigation recommendations:
   - Frequency (daily, every 2-3 days, weekly, etc.)
   - Timing (morning, evening)
   - Amount considerations
   - Drip vs. flood irrigation suggestions

5. **Condition Assessment**: Evaluate how well current conditions match ideal growing conditions:
   - Optimal
   - Good
   - Fair
   - Needs Improvement

6. **Actionable Recommendations**: Provide 5-7 specific, actionable recommendations including:
   - Immediate actions (if any critical issues)
   - Short-term improvements (next 1-2 weeks)
   - Long-term strategies
   - Risk mitigation measures
   - Best practices

7. **Insights**: Provide 3-5 key insights about:
   - Why this crop is suitable
   - Potential challenges
   - Growth optimization opportunities
   - Expected yield considerations

8. **Ideal Conditions**: Specify the ideal ranges for:
   - Soil moisture (%)
   - Temperature (°C)
   - Humidity (%)

**Important Considerations:**
- If soil moisture is below 30%, prioritize drought-resistant crops
- If temperature exceeds 35°C, recommend heat-tolerant varieties
- If humidity is above 80%, warn about fungal disease risks
- If temperature is below 10°C, suggest cold-tolerant crops or protective measures
- Consider crop rotation and sustainability
- Factor in regional agricultural practices (Indian subcontinent context)

**Response Format (JSON only):**
{
  "recommendedCrop": "Crop Name",
  "optimalSoilType": "Soil Type",
  "recommendedFertilizer": "Fertilizer Name with NPK ratio",
  "npkRatio": "XX-XX-XX",
  "irrigationSchedule": "Detailed schedule description",
  "confidence": 0.85,
  "conditionAssessment": "Optimal/Good/Fair/Needs Improvement",
  "actionableRecommendations": [
    "Recommendation 1",
    "Recommendation 2",
    ...
  ],
  "insights": [
    "Insight 1",
    "Insight 2",
    ...
  ],
  "idealConditions": {
    "moisture": "XX-XX%",
    "temperature": "XX-XX°C",
    "humidity": "XX-XX%"
  }
}

Provide ONLY valid JSON. Do not include any explanatory text outside the JSON object.`
}

/**
 * Extract NPK ratio from fertilizer string
 */
function extractNPKFromFertilizer(fertilizer: string): string {
  const npkMatch = fertilizer.match(/(\d+)[-\s]+(\d+)[-\s]+(\d+)/)
  if (npkMatch) {
    return `${npkMatch[1]}-${npkMatch[2]}-${npkMatch[3]}`
  }
  return "80-40-40"
}

/**
 * Determine condition match based on input
 */
function determineConditionMatch(input: RecommendationInput): string {
  const { moisture, temperature, humidity } = input
  const optimalMoisture = moisture >= 50 && moisture <= 70
  const optimalTemp = temperature >= 15 && temperature <= 28
  const optimalHumidity = humidity >= 50 && humidity <= 75

  if (optimalMoisture && optimalTemp && optimalHumidity) {
    return "Optimal"
  }
  if (optimalMoisture && optimalTemp) {
    return "Good"
  }
  if (optimalMoisture || optimalTemp || optimalHumidity) {
    return "Fair"
  }
  return "Needs Improvement"
}

