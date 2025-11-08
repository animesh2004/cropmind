/**
 * Crop Data from Kaggle Dataset
 * Based on atharvaingle/crop-recommendation-dataset
 * Contains all 22+ crops with their ideal growing conditions
 */

export interface CropData {
  name: string
  category: "Cereal" | "Pulse" | "Fruit" | "Cash Crop" | "Oilseed" | "Vegetable"
  moisture: { min: number; max: number; ideal: number }
  temperature: { min: number; max: number; ideal: number }
  humidity: { min: number; max: number; ideal: number }
  npkRatio: string
  soilType: string
  irrigationSchedule: string
  phRange: { min: number; max: number }
}

/**
 * All crops from Kaggle Crop Recommendation Dataset
 */
export const CROP_DATABASE: CropData[] = [
  // Cereals
  {
    name: "Rice",
    category: "Cereal",
    moisture: { min: 60, max: 80, ideal: 70 },
    temperature: { min: 20, max: 35, ideal: 28 },
    humidity: { min: 70, max: 90, ideal: 80 },
    npkRatio: "100-50-50",
    soilType: "Clay",
    irrigationSchedule: "Frequent - Every 1-2 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Wheat",
    category: "Cereal",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 12, max: 25, ideal: 20 },
    humidity: { min: 50, max: 70, ideal: 60 },
    npkRatio: "80-40-40",
    soilType: "Sandy Loam",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 6.0, max: 7.5 },
  },
  {
    name: "Maize",
    category: "Cereal",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 15, max: 30, ideal: 24 },
    humidity: { min: 50, max: 70, ideal: 60 },
    npkRatio: "120-60-60",
    soilType: "Loamy",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 5.8, max: 7.0 },
  },
  {
    name: "Barley",
    category: "Cereal",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 10, max: 20, ideal: 15 },
    humidity: { min: 50, max: 70, ideal: 60 },
    npkRatio: "80-40-40",
    soilType: "Sandy Loam",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 6.0, max: 7.5 },
  },
  // Pulses
  {
    name: "Chickpea",
    category: "Pulse",
    moisture: { min: 40, max: 60, ideal: 50 },
    temperature: { min: 20, max: 30, ideal: 25 },
    humidity: { min: 50, max: 70, ideal: 60 },
    npkRatio: "0-0-60",
    soilType: "Sandy Loam",
    irrigationSchedule: "Less Frequent - Every 3-4 days",
    phRange: { min: 6.0, max: 7.5 },
  },
  {
    name: "Kidney Beans",
    category: "Pulse",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 20, max: 30, ideal: 25 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "0-0-60",
    soilType: "Loamy",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 6.0, max: 7.0 },
  },
  {
    name: "Pigeon Pea",
    category: "Pulse",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 20, max: 30, ideal: 25 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "0-0-60",
    soilType: "Loamy",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 6.0, max: 7.5 },
  },
  {
    name: "Moth Beans",
    category: "Pulse",
    moisture: { min: 40, max: 60, ideal: 50 },
    temperature: { min: 20, max: 30, ideal: 25 },
    humidity: { min: 50, max: 70, ideal: 60 },
    npkRatio: "0-0-60",
    soilType: "Sandy Loam",
    irrigationSchedule: "Less Frequent - Every 3-4 days",
    phRange: { min: 6.0, max: 7.5 },
  },
  {
    name: "Mung Bean",
    category: "Pulse",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 20, max: 30, ideal: 25 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "0-0-60",
    soilType: "Loamy",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 6.0, max: 7.0 },
  },
  {
    name: "Black Gram",
    category: "Pulse",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 20, max: 30, ideal: 25 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "0-0-60",
    soilType: "Loamy",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 6.0, max: 7.0 },
  },
  {
    name: "Lentil",
    category: "Pulse",
    moisture: { min: 40, max: 60, ideal: 50 },
    temperature: { min: 15, max: 25, ideal: 20 },
    humidity: { min: 50, max: 70, ideal: 60 },
    npkRatio: "0-0-60",
    soilType: "Sandy Loam",
    irrigationSchedule: "Less Frequent - Every 3-4 days",
    phRange: { min: 6.0, max: 7.5 },
  },
  // Fruits
  {
    name: "Pomegranate",
    category: "Fruit",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 20, max: 30, ideal: 25 },
    humidity: { min: 50, max: 70, ideal: 60 },
    npkRatio: "100-50-50",
    soilType: "Sandy Loam",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Banana",
    category: "Fruit",
    moisture: { min: 60, max: 80, ideal: 70 },
    temperature: { min: 25, max: 35, ideal: 30 },
    humidity: { min: 70, max: 90, ideal: 80 },
    npkRatio: "150-50-200",
    soilType: "Loamy",
    irrigationSchedule: "Frequent - Every 1-2 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Mango",
    category: "Fruit",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 25, max: 35, ideal: 30 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "100-50-50",
    soilType: "Loamy",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 5.5, max: 7.5 },
  },
  {
    name: "Grapes",
    category: "Fruit",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 20, max: 30, ideal: 25 },
    humidity: { min: 50, max: 70, ideal: 60 },
    npkRatio: "100-50-50",
    soilType: "Sandy Loam",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Watermelon",
    category: "Fruit",
    moisture: { min: 60, max: 80, ideal: 70 },
    temperature: { min: 25, max: 35, ideal: 30 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "100-50-50",
    soilType: "Sandy Loam",
    irrigationSchedule: "Frequent - Every 1-2 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Muskmelon",
    category: "Fruit",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 25, max: 35, ideal: 30 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "100-50-50",
    soilType: "Sandy Loam",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Apple",
    category: "Fruit",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 10, max: 20, ideal: 15 },
    humidity: { min: 50, max: 70, ideal: 60 },
    npkRatio: "100-50-50",
    soilType: "Loamy",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Orange",
    category: "Fruit",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 20, max: 30, ideal: 25 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "100-50-50",
    soilType: "Loamy",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Papaya",
    category: "Fruit",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 25, max: 35, ideal: 30 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "100-50-50",
    soilType: "Sandy Loam",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Coconut",
    category: "Fruit",
    moisture: { min: 60, max: 80, ideal: 70 },
    temperature: { min: 25, max: 35, ideal: 30 },
    humidity: { min: 70, max: 90, ideal: 80 },
    npkRatio: "100-50-50",
    soilType: "Sandy Loam",
    irrigationSchedule: "Frequent - Every 1-2 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  // Cash Crops
  {
    name: "Cotton",
    category: "Cash Crop",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 21, max: 30, ideal: 26 },
    humidity: { min: 50, max: 70, ideal: 60 },
    npkRatio: "100-50-50",
    soilType: "Loamy",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 5.5, max: 7.5 },
  },
  {
    name: "Jute",
    category: "Cash Crop",
    moisture: { min: 60, max: 80, ideal: 70 },
    temperature: { min: 25, max: 35, ideal: 30 },
    humidity: { min: 70, max: 90, ideal: 80 },
    npkRatio: "100-50-50",
    soilType: "Loamy",
    irrigationSchedule: "Frequent - Every 1-2 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Coffee",
    category: "Cash Crop",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 15, max: 25, ideal: 20 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "100-50-50",
    soilType: "Loamy",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 5.5, max: 6.5 },
  },
  // Additional crops from other datasets
  {
    name: "Soybean",
    category: "Oilseed",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 20, max: 30, ideal: 25 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "0-0-60",
    soilType: "Loamy",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 6.0, max: 7.0 },
  },
  {
    name: "Groundnut",
    category: "Oilseed",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 25, max: 30, ideal: 28 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "0-0-60",
    soilType: "Sandy Loam",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Sunflower",
    category: "Oilseed",
    moisture: { min: 50, max: 70, ideal: 60 },
    temperature: { min: 20, max: 30, ideal: 25 },
    humidity: { min: 50, max: 70, ideal: 60 },
    npkRatio: "80-40-40",
    soilType: "Sandy Loam",
    irrigationSchedule: "Moderate - Every 2-3 days",
    phRange: { min: 6.0, max: 7.5 },
  },
  {
    name: "Tomato",
    category: "Vegetable",
    moisture: { min: 60, max: 80, ideal: 70 },
    temperature: { min: 18, max: 25, ideal: 22 },
    humidity: { min: 60, max: 80, ideal: 70 },
    npkRatio: "100-50-100",
    soilType: "Sandy Loam",
    irrigationSchedule: "Frequent - Every 1-2 days",
    phRange: { min: 5.5, max: 7.0 },
  },
  {
    name: "Potato",
    category: "Vegetable",
    moisture: { min: 60, max: 80, ideal: 70 },
    temperature: { min: 15, max: 20, ideal: 18 },
    humidity: { min: 70, max: 85, ideal: 80 },
    npkRatio: "120-80-120",
    soilType: "Loamy",
    irrigationSchedule: "Frequent - Every 1-2 days",
    phRange: { min: 5.0, max: 6.5 },
  },
  {
    name: "Sugarcane",
    category: "Cash Crop",
    moisture: { min: 70, max: 85, ideal: 80 },
    temperature: { min: 26, max: 32, ideal: 29 },
    humidity: { min: 70, max: 90, ideal: 80 },
    npkRatio: "200-100-100",
    soilType: "Loamy",
    irrigationSchedule: "Frequent - Every 1-2 days",
    phRange: { min: 5.5, max: 7.5 },
  },
]

/**
 * Get crop data by name
 */
export function getCropData(cropName: string): CropData | null {
  return CROP_DATABASE.find((crop) => crop.name.toLowerCase() === cropName.toLowerCase()) || null
}

/**
 * Get all crops in a category
 */
export function getCropsByCategory(category: CropData["category"]): CropData[] {
  return CROP_DATABASE.filter((crop) => crop.category === category)
}

/**
 * Find best matching crop based on environmental conditions
 */
export function findBestCrop(
  moisture: number,
  temperature: number,
  humidity: number
): { crop: CropData; score: number } {
  const cropScores = CROP_DATABASE.map((crop) => {
    let score = 0

    // Moisture score (closer to ideal = higher score)
    if (moisture >= crop.moisture.min && moisture <= crop.moisture.max) {
      const distance = Math.abs(moisture - crop.moisture.ideal)
      const range = crop.moisture.max - crop.moisture.min
      score += (1 - distance / range) * 100
    } else {
      // Penalty for being outside range
      const distance = Math.min(
        Math.abs(moisture - crop.moisture.min),
        Math.abs(moisture - crop.moisture.max)
      )
      score -= distance * 2
    }

    // Temperature score
    if (temperature >= crop.temperature.min && temperature <= crop.temperature.max) {
      const distance = Math.abs(temperature - crop.temperature.ideal)
      const range = crop.temperature.max - crop.temperature.min
      score += (1 - distance / range) * 100
    } else {
      const distance = Math.min(
        Math.abs(temperature - crop.temperature.min),
        Math.abs(temperature - crop.temperature.max)
      )
      score -= distance * 2
    }

    // Humidity score
    if (humidity >= crop.humidity.min && humidity <= crop.humidity.max) {
      const distance = Math.abs(humidity - crop.humidity.ideal)
      const range = crop.humidity.max - crop.humidity.min
      score += (1 - distance / range) * 100
    } else {
      const distance = Math.min(
        Math.abs(humidity - crop.humidity.min),
        Math.abs(humidity - crop.humidity.max)
      )
      score -= distance * 2
    }

    return { crop, score: score / 3 } // Average of three scores
  })

  // Sort by score (highest first)
  cropScores.sort((a, b) => b.score - a.score)

  // Return the crop with highest score (or Wheat if all scores are negative)
  const bestCrop = cropScores[0]
  return bestCrop.score > 0 ? bestCrop : { crop: CROP_DATABASE.find((c) => c.name === "Wheat")!, score: 0 }
}


