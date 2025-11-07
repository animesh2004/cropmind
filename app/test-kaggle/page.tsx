"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import { ArrowLeft } from "lucide-react"

export default function TestKagglePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/test-kaggle?username=animeshtri12&key=b3a9bb041929fa6d6378f9086cbdf7da")
      const data = await response.json()
      setResult(data)
      if (!response.ok) {
        setError(data.message || "Connection failed")
      }
    } catch (e) {
      setError("Failed to test connection: " + (e instanceof Error ? e.message : String(e)))
    } finally {
      setLoading(false)
    }
  }

  const testRecommendations = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moisture: 55.3,
          temperature: 24.5,
          humidity: 62.1,
        }),
      })
      const data = await response.json()
      setResult(data)
      if (!response.ok) {
        setError(data.error || "Failed to get recommendations")
      }
    } catch (e) {
      setError("Failed to test recommendations: " + (e instanceof Error ? e.message : String(e)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Kaggle API Test</h1>
        </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Test Kaggle Connection</CardTitle>
            <CardDescription>Test if Kaggle API credentials are working</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testConnection} disabled={loading}>
              {loading ? "Testing..." : "Test Connection"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Recommendations API</CardTitle>
            <CardDescription>Test the recommendations endpoint with Kaggle integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testRecommendations} disabled={loading}>
              {loading ? "Testing..." : "Test Recommendations"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded overflow-auto">{error}</pre>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  )
}

