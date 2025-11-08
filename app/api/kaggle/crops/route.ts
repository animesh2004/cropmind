import { NextResponse } from "next/server"

/**
 * Kaggle Crops API
 * Lists all crops available in Kaggle crop recommendation datasets
 */

// Common crops found in crop recommendation datasets
// This is based on typical Indian agriculture datasets
const CROPS_IN_DATASET = [
  "Rice",
  "Maize",
  "Chickpea",
  "Kidneybeans",
  "Pigeonpeas",
  "Mothbeans",
  "Mungbean",
  "Blackgram",
  "Lentil",
  "Pomegranate",
  "Banana",
  "Mango",
  "Grapes",
  "Watermelon",
  "Muskmelon",
  "Apple",
  "Orange",
  "Papaya",
  "Coconut",
  "Cotton",
  "Jute",
  "Coffee",
]

export async function GET(request: Request) {
  try {
    const username = "animeshtri12"
    const key = "b3a9bb041929fa6d6378f9086cbdf7da"
    const credentials = Buffer.from(`${username}:${key}`).toString("base64")

    // Try to get dataset information
    const datasetRef = "atharvaingle/crop-recommendation-dataset"
    const url = `https://www.kaggle.com/api/v1/datasets/view/${datasetRef}`

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const dataset = await response.json()
        return NextResponse.json({
          success: true,
          dataset: {
            title: dataset.title,
            ref: datasetRef,
            description: dataset.description,
            crops: CROPS_IN_DATASET,
            totalCrops: CROPS_IN_DATASET.length,
            source: "kaggle-dataset",
          },
        })
      }
    } catch (error) {
      console.error("Error fetching dataset:", error)
    }

    // Return crops list even if dataset fetch fails
    return NextResponse.json({
      success: true,
      dataset: {
        title: "Crop Recommendation Dataset",
        ref: "atharvaingle/crop-recommendation-dataset",
        crops: CROPS_IN_DATASET,
        totalCrops: CROPS_IN_DATASET.length,
        source: "known-dataset",
        note: "Based on common crops in Indian agriculture datasets",
      },
    })
  } catch (error) {
    console.error("Error in crops API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch crops information",
        crops: CROPS_IN_DATASET,
        totalCrops: CROPS_IN_DATASET.length,
      },
      { status: 500 }
    )
  }
}

