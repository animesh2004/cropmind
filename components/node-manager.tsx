"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Edit, Trash2, Check, Radio } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  getBlynkNodes,
  addBlynkNode,
  updateBlynkNode,
  deleteBlynkNode,
  setActiveNode,
  syncNodesToBackend,
  type BlynkNode,
} from "@/lib/blynk-nodes"

export default function NodeManager() {
  const [nodes, setNodes] = useState<BlynkNode[]>([])
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<BlynkNode | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    token: "",
    location: "",
    description: "",
  })

  useEffect(() => {
    loadNodes()
  }, [])

  const loadNodes = () => {
    const data = getBlynkNodes()
    setNodes(data.nodes)
    setActiveNodeId(data.activeNodeId)
  }

  const handleAddNode = () => {
    if (!formData.name || !formData.token) {
      alert("Name and token are required")
      return
    }
    
    const newNode = addBlynkNode({
      name: formData.name,
      token: formData.token,
      location: formData.location || undefined,
      description: formData.description || undefined,
    })
    
    setNodes([...nodes, newNode])
    setFormData({ name: "", token: "", location: "", description: "" })
    setIsAddDialogOpen(false)
    
    // Sync to backend
    syncNodesToBackend()
    
    // Notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("activeNodeChanged", { detail: { nodeId: newNode.id } }))
    }
  }

  const handleUpdateNode = () => {
    if (!editingNode) return
    
    updateBlynkNode(editingNode.id, {
      name: formData.name,
      token: formData.token,
      location: formData.location || undefined,
      description: formData.description || undefined,
    })
    
    loadNodes()
    setEditingNode(null)
    setFormData({ name: "", token: "", location: "", description: "" })
    setIsAddDialogOpen(false)
    syncNodesToBackend()
  }

  const handleDeleteNode = (id: string) => {
    if (!confirm("Are you sure you want to delete this node?")) return
    
    deleteBlynkNode(id)
    loadNodes()
    syncNodesToBackend()
    
    // Notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("activeNodeChanged"))
    }
  }

  const handleSetActive = (id: string) => {
    setActiveNode(id)
    loadNodes()
    syncNodesToBackend()
    
    // Notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("activeNodeChanged", { detail: { nodeId: id } }))
    }
  }

  const openEditDialog = (node: BlynkNode) => {
    setEditingNode(node)
    setFormData({
      name: node.name,
      token: node.token,
      location: node.location || "",
      description: node.description || "",
    })
    setIsAddDialogOpen(true)
  }

  const activeNode = nodes.find(n => n.id === activeNodeId)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors w-full"
          >
            <Radio className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium flex-1 text-left">
              {activeNode ? activeNode.name : "No Node Selected"}
            </span>
            {activeNode && (
              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                Active
              </span>
            )}
          </motion.button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Blynk Node Management</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Manage your Blynk IoT nodes and their authentication tokens
              </p>
              <Button
                onClick={() => {
                  setEditingNode(null)
                  setFormData({ name: "", token: "", location: "", description: "" })
                  setIsAddDialogOpen(true)
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Node
              </Button>
            </div>

            <AnimatePresence>
              {nodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No nodes configured. Add your first node to get started.</p>
                </div>
              ) : (
                nodes.map((node) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 rounded-lg border-2 ${
                      node.id === activeNodeId
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{node.name}</h3>
                          {node.id === activeNodeId && (
                            <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Token: {node.token.substring(0, 20)}...
                        </p>
                        {node.location && (
                          <p className="text-xs text-muted-foreground mb-1">
                            📍 {node.location}
                          </p>
                        )}
                        {node.description && (
                          <p className="text-sm text-muted-foreground">{node.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {node.id !== activeNodeId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetActive(node.id)}
                            className="flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Set Active
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(node)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteNode(node.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNode ? "Edit Node" : "Add New Node"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Node Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Greenhouse 1, Field Sensor A"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Blynk Auth Token *</label>
              <Input
                type="password"
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                placeholder="Paste your Blynk token"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location (Optional)</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., North Field, Greenhouse"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes about this node"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingNode ? handleUpdateNode : handleAddNode}>
                {editingNode ? "Update" : "Add"} Node
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

