"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, AlertCircle, SkipForward, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

interface ApiTestResult {
  name: string
  status: "success" | "error" | "skipped" | "warning"
  message: string
  responseTime?: number
  details?: any
}

interface HealthCheckResponse {
  status: string
  summary: {
    total: number
    success: number
    error: number
    skipped: number
    warning: number
    totalTime: string
  }
  results: ApiTestResult[]
  timestamp: string
}

export default function TestAPIsPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<HealthCheckResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runHealthCheck = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch("/api/health-check")
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }
      const data = (await response.json()) as HealthCheckResponse
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run health check")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "skipped":
        return <SkipForward className="w-5 h-5 text-gray-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: "bg-green-500/10 text-green-500 border-green-500/20",
      error: "bg-red-500/10 text-red-500 border-red-500/20",
      warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      skipped: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    }
    return variants[status] || variants.skipped
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">API Health Check</CardTitle>
          <CardDescription>
            Test all APIs to verify they are working correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runHealthCheck}
            disabled={loading}
            className="w-full sm:w-auto"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Health Check
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="w-5 h-5" />
              <p className="font-semibold">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <>
          {/* Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{results.summary.success}</div>
                  <div className="text-sm text-muted-foreground">Success</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{results.summary.error}</div>
                  <div className="text-sm text-muted-foreground">Error</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{results.summary.warning}</div>
                  <div className="text-sm text-muted-foreground">Warning</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500">{results.summary.skipped}</div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Total Time: <span className="font-semibold">{results.summary.totalTime}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Timestamp: <span className="font-semibold">{new Date(results.timestamp).toLocaleString()}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {results.results.map((result, index) => (
              <motion.div
                key={result.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(result.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{result.name}</h3>
                            <Badge className={getStatusBadge(result.status)}>
                              {result.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                          {result.responseTime && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Response Time: {result.responseTime}ms
                            </p>
                          )}
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                View Details
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}



