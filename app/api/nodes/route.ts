import { NextResponse } from "next/server"
import type { BlynkNodesData } from "@/lib/blynk-nodes"

// In-memory store for nodes (in production, use a database)
// This is a simple implementation - replace with Prisma/DB in production
const nodesStore = new Map<string, BlynkNodesData>()

// GET - Fetch all nodes for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "default"
    
    const data = nodesStore.get(userId) || { nodes: [], activeNodeId: null }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching nodes:", error)
    return NextResponse.json(
      { error: "Failed to fetch nodes" },
      { status: 500 }
    )
  }
}

// POST - Save nodes for a user
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "default"
    const body = await request.json()
    const { nodes, activeNodeId } = body as BlynkNodesData
    
    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json(
        { error: "Invalid nodes data" },
        { status: 400 }
      )
    }
    
    nodesStore.set(userId, { nodes, activeNodeId })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving nodes:", error)
    return NextResponse.json(
      { error: "Failed to save nodes" },
      { status: 500 }
    )
  }
}

