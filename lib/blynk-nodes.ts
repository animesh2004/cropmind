export interface BlynkNode {
  id: string
  name: string
  token: string
  location?: string
  description?: string
  createdAt: string
  isActive: boolean
}

export interface BlynkNodesData {
  nodes: BlynkNode[]
  activeNodeId: string | null
}

const STORAGE_KEY = "cropMind_blynkNodes"

export function getBlynkNodes(): BlynkNodesData {
  if (typeof window === "undefined") {
    return { nodes: [], activeNodeId: null }
  }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    // Migrate old single token if exists
    const oldToken = localStorage.getItem("cropMind_blynkToken")
    if (oldToken) {
      const migratedNode: BlynkNode = {
        id: "node-1",
        name: "Default Node",
        token: oldToken,
        createdAt: new Date().toISOString(),
        isActive: true,
      }
      const data: BlynkNodesData = {
        nodes: [migratedNode],
        activeNodeId: "node-1",
      }
      saveBlynkNodes(data)
      // Remove old token
      localStorage.removeItem("cropMind_blynkToken")
      return data
    }
    return { nodes: [], activeNodeId: null }
  }
  
  try {
    return JSON.parse(stored)
  } catch {
    return { nodes: [], activeNodeId: null }
  }
}

export function saveBlynkNodes(data: BlynkNodesData): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getActiveNodeToken(): string | null {
  const data = getBlynkNodes()
  if (!data.activeNodeId) return null
  
  const activeNode = data.nodes.find(n => n.id === data.activeNodeId)
  return activeNode?.token || null
}

export function getActiveNode(): BlynkNode | null {
  const data = getBlynkNodes()
  if (!data.activeNodeId) return null
  
  return data.nodes.find(n => n.id === data.activeNodeId) || null
}

export function addBlynkNode(node: Omit<BlynkNode, "id" | "createdAt" | "isActive">): BlynkNode {
  const data = getBlynkNodes()
  const newNode: BlynkNode = {
    ...node,
    id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    isActive: data.nodes.length === 0, // First node is active by default
  }
  
  data.nodes.push(newNode)
  if (data.nodes.length === 1) {
    data.activeNodeId = newNode.id
  }
  
  saveBlynkNodes(data)
  return newNode
}

export function updateBlynkNode(id: string, updates: Partial<BlynkNode>): boolean {
  const data = getBlynkNodes()
  const index = data.nodes.findIndex(n => n.id === id)
  if (index === -1) return false
  
  data.nodes[index] = { ...data.nodes[index], ...updates }
  saveBlynkNodes(data)
  return true
}

export function deleteBlynkNode(id: string): boolean {
  const data = getBlynkNodes()
  const index = data.nodes.findIndex(n => n.id === id)
  if (index === -1) return false
  
  data.nodes.splice(index, 1)
  
  // If deleted node was active, set another as active
  if (data.activeNodeId === id) {
    data.activeNodeId = data.nodes.length > 0 ? data.nodes[0].id : null
  }
  
  saveBlynkNodes(data)
  return true
}

export function setActiveNode(id: string): boolean {
  const data = getBlynkNodes()
  const node = data.nodes.find(n => n.id === id)
  if (!node) return false
  
  // Set all nodes to inactive, then set selected one as active
  data.nodes.forEach(n => n.isActive = false)
  node.isActive = true
  data.activeNodeId = id
  
  saveBlynkNodes(data)
  return true
}

// Sync with backend API
export async function syncNodesToBackend(userId: string = "default"): Promise<void> {
  try {
    const data = getBlynkNodes()
    
    const response = await fetch(`/api/nodes?userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to sync to backend")
    }
  } catch (error) {
    console.error("Backend sync failed (using localStorage):", error)
    // Continue with localStorage as fallback
  }
}

// Load from backend API
export async function loadNodesFromBackend(userId: string = "default"): Promise<BlynkNodesData | null> {
  try {
    const response = await fetch(`/api/nodes?userId=${userId}`)
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json() as BlynkNodesData
    saveBlynkNodes(data)
    return data
  } catch (error) {
    console.error("Failed to load from backend:", error)
    return null
  }
}

