/**
 * Dataset Loader for CropMind
 * Loads and queries the data_core.csv dataset for crop recommendations
 */

export interface CropRecord {
  Temperature: number
  Humidity: number
  Moisture: number
  "Soil Type": string
  Crop: string
  Fertilizer: string
}

export interface RecommendationQuery {
  temperature: number
  humidity: number
  moisture: number
  soilType?: string
}

export interface RecommendationResult {
  crop: string
  fertilizer: string
  soilType: string
  confidence: number
  matchCount: number
  similarRecords: CropRecord[]
}

class DatasetLoader {
  private data: CropRecord[] | null = null
  private loaded: boolean = false

  /**
   * Load dataset from CSV file
   */
  async loadDataset(): Promise<CropRecord[]> {
    if (this.loaded && this.data) {
      return this.data
    }

    try {
      // In Next.js, we need to fetch from public or use server-side
      // For now, we'll load it dynamically
      const response = await fetch("/api/dataset/load")
      if (!response.ok) {
        throw new Error("Failed to load dataset")
      }
      const data = await response.json()
      this.data = data
      this.loaded = true
      return this.data
    } catch (error) {
      console.error("Error loading dataset:", error)
      return []
    }
  }

  /**
   * Find best matching crop recommendations based on environmental conditions
   */
  async findRecommendations(query: RecommendationQuery): Promise<RecommendationResult[]> {
    const dataset = await this.loadDataset()
    if (dataset.length === 0) {
      return []
    }

    // Find records that match the query conditions
    const matches = dataset.filter((record) => {
      const tempMatch = Math.abs(Number(record.Temperature) - query.temperature) <= 5
      const humidityMatch = Math.abs(Number(record.Humidity) - query.humidity) <= 10
      const moistureMatch = Math.abs(Number(record.Moisture) - query.moisture) <= 10
      const soilMatch = !query.soilType || record["Soil Type"].toLowerCase() === query.soilType.toLowerCase()

      return tempMatch && humidityMatch && moistureMatch && soilMatch
    })

    if (matches.length === 0) {
      // If no exact matches, find closest matches
      return this.findClosestMatches(dataset, query)
    }

    // Group by crop and fertilizer combination
    const grouped = matches.reduce((acc, record) => {
      const key = `${record.Crop}|${record.Fertilizer}|${record["Soil Type"]}`
      if (!acc[key]) {
        acc[key] = {
          crop: record.Crop,
          fertilizer: record.Fertilizer,
          soilType: record["Soil Type"],
          records: [],
        }
      }
      acc[key].records.push(record)
      return acc
    }, {} as Record<string, { crop: string; fertilizer: string; soilType: string; records: CropRecord[] }>)

    // Convert to recommendations with confidence scores
    const recommendations: RecommendationResult[] = Object.values(grouped).map((group) => {
      const matchCount = group.records.length
      const confidence = Math.min(1.0, matchCount / 100) // Normalize confidence based on match count

      return {
        crop: group.crop,
        fertilizer: group.fertilizer,
        soilType: group.soilType,
        confidence,
        matchCount,
        similarRecords: group.records.slice(0, 5), // Top 5 similar records
      }
    })

    // Sort by confidence and match count
    recommendations.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence
      }
      return b.matchCount - a.matchCount
    })

    return recommendations.slice(0, 10) // Return top 10 recommendations
  }

  /**
   * Find closest matches when no exact matches are found
   */
  private findClosestMatches(dataset: CropRecord[], query: RecommendationQuery): RecommendationResult[] {
    // Calculate distance for each record
    const scored = dataset.map((record) => {
      const tempDiff = Math.abs(Number(record.Temperature) - query.temperature)
      const humidityDiff = Math.abs(Number(record.Humidity) - query.humidity)
      const moistureDiff = Math.abs(Number(record.Moisture) - query.moisture)

      // Weighted distance (temperature is more important)
      const distance = tempDiff * 2 + humidityDiff + moistureDiff

      return {
        record,
        distance,
      }
    })

    // Sort by distance and take top matches
    scored.sort((a, b) => a.distance - b.distance)
    const topMatches = scored.slice(0, 50).map((s) => s.record)

    // Group by crop and fertilizer
    const grouped = topMatches.reduce((acc, record) => {
      const key = `${record.Crop}|${record.Fertilizer}|${record["Soil Type"]}`
      if (!acc[key]) {
        acc[key] = {
          crop: record.Crop,
          fertilizer: record.Fertilizer,
          soilType: record["Soil Type"],
          records: [],
        }
      }
      acc[key].records.push(record)
      return acc
    }, {} as Record<string, { crop: string; fertilizer: string; soilType: string; records: CropRecord[] }>)

    // Convert to recommendations
    const recommendations: RecommendationResult[] = Object.values(grouped).map((group) => {
      const matchCount = group.records.length
      const confidence = Math.max(0.5, 1.0 - matchCount / 200) // Lower confidence for non-exact matches

      return {
        crop: group.crop,
        fertilizer: group.fertilizer,
        soilType: group.soilType,
        confidence,
        matchCount,
        similarRecords: group.records.slice(0, 3),
      }
    })

    recommendations.sort((a, b) => b.confidence - a.confidence)
    return recommendations.slice(0, 5) // Return top 5 recommendations
  }

  /**
   * Get all unique crops from dataset
   */
  async getCrops(): Promise<string[]> {
    const dataset = await this.loadDataset()
    const crops = new Set(dataset.map((r) => r.Crop))
    return Array.from(crops).sort()
  }

  /**
   * Get all unique fertilizers from dataset
   */
  async getFertilizers(): Promise<string[]> {
    const dataset = await this.loadDataset()
    const fertilizers = new Set(dataset.map((r) => r.Fertilizer))
    return Array.from(fertilizers).sort()
  }

  /**
   * Get all unique soil types from dataset
   */
  async getSoilTypes(): Promise<string[]> {
    const dataset = await this.loadDataset()
    const soilTypes = new Set(dataset.map((r) => r["Soil Type"]))
    return Array.from(soilTypes).sort()
  }
}

// Singleton instance
export const datasetLoader = new DatasetLoader()


