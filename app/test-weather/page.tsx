"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Navbar from "@/components/navbar"
import { ArrowLeft, Cloud, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const POPULAR_LOCATIONS = [
  "Gorakhpur",
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Kolkata",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
]

export default function TestWeatherPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState("Gorakhpur")
  const [results, setResults] = useState<Record<string, any>>({})
  const [testingLocations, setTestingLocations] = useState<string[]>([])

  const testWeatherAPIs = async (testLocation?: string) => {
    const loc = testLocation || location
    setLoading(true)
    setError(null)
    if (!testLocation) {
      setResult(null)
    }

    try {
      const response = await fetch(`/api/test-weather?location=${encodeURIComponent(loc)}`)
      const data = await response.json()
      
      if (testLocation) {
        // Batch test - store in results
        setResults((prev) => ({
          ...prev,
          [loc]: data,
        }))
      } else {
        // Single test - show in main result
        setResult(data)
      }
      
      if (!response.ok) {
        setError(data.error || "Test failed")
      }
    } catch (e) {
      const errorMsg = "Failed to test weather APIs: " + (e instanceof Error ? e.message : String(e))
      setError(errorMsg)
      if (testLocation) {
        setResults((prev) => ({
          ...prev,
          [loc]: { error: errorMsg },
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const testMultipleLocations = async (locations: string[]) => {
    setTestingLocations(locations)
    setResults({})
    setError(null)
    
    for (const loc of locations) {
      await testWeatherAPIs(loc)
      // Small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    
    setTestingLocations([])
  }

  const testQuickLocation = (loc: string) => {
    setLocation(loc)
    testWeatherAPIs(loc)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "failed":
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Success</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      case "error":
        return <Badge className="bg-red-600">Error</Badge>
      default:
        return <Badge variant="outline">Not Tested</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-8 max-w-6xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cloud className="w-8 h-8" />
            Weather API Test
          </h1>
          <p className="text-muted-foreground mt-2">
            Test both OpenWeatherMap and AccuWeather APIs to verify they're working correctly
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>Enter a location to test weather APIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter location (e.g., Gorakhpur, Delhi, Mumbai)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && testWeatherAPIs()}
                />
                <Button onClick={() => testWeatherAPIs()} disabled={loading || !location}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test APIs"
                  )}
                </Button>
              </div>

              {/* Quick Location Buttons */}
              <div>
                <p className="text-sm font-semibold mb-2">Quick Test Locations:</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <Button
                      key={loc}
                      variant="outline"
                      size="sm"
                      onClick={() => testQuickLocation(loc)}
                      disabled={loading}
                      className={location === loc ? "bg-primary text-primary-foreground" : ""}
                    >
                      {loc}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Batch Test */}
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-2">Batch Test Multiple Locations:</p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => testMultipleLocations(POPULAR_LOCATIONS.slice(0, 5))}
                    disabled={testingLocations.length > 0}
                  >
                    {testingLocations.length > 0 ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing {testingLocations.length} locations...
                      </>
                    ) : (
                      "Test Top 5 Cities"
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => testMultipleLocations(POPULAR_LOCATIONS)}
                    disabled={testingLocations.length > 0}
                  >
                    {testingLocations.length > 0 ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing {testingLocations.length} locations...
                      </>
                    ) : (
                      "Test All Cities"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded overflow-auto">{error}</pre>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              {/* Summary Card */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Test Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">OpenWeatherMap</span>
                        {getStatusIcon(result.tests?.openweathermap?.status)}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Configured:</span>{" "}
                          {result.tests?.openweathermap?.configured ? (
                            <Badge variant="outline" className="bg-green-50">Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50">No</Badge>
                          )}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          {getStatusBadge(result.tests?.openweathermap?.status)}
                        </p>
                        {result.tests?.openweathermap?.responseTime && (
                          <p>
                            <span className="text-muted-foreground">Response Time:</span>{" "}
                            {result.tests?.openweathermap?.responseTime}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">AccuWeather</span>
                        {getStatusIcon(result.tests?.accuweather?.status)}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Configured:</span>{" "}
                          {result.tests?.accuweather?.configured ? (
                            <Badge variant="outline" className="bg-green-50">Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50">No</Badge>
                          )}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          {getStatusBadge(result.tests?.accuweather?.status)}
                        </p>
                        {result.tests?.accuweather?.responseTime && (
                          <p>
                            <span className="text-muted-foreground">Response Time:</span>{" "}
                            {result.tests?.accuweather?.responseTime}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {result.summary && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="font-semibold mb-2">Recommendation:</p>
                      <p className="text-sm">{result.summary.recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* OpenWeatherMap Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    OpenWeatherMap API Test
                    {getStatusBadge(result.tests?.openweathermap?.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.tests?.openweathermap?.error ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Error:</p>
                      <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap">
                        {result.tests.openweathermap.error}
                      </pre>
                    </div>
                  ) : result.tests?.openweathermap?.data ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Temperature</p>
                          <p className="text-lg font-bold">{result.tests.openweathermap.data.temperature}°C</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Condition</p>
                          <p className="text-lg font-bold">{result.tests.openweathermap.data.condition}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Humidity</p>
                          <p className="text-lg font-bold">{result.tests.openweathermap.data.humidity}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Wind Speed</p>
                          <p className="text-lg font-bold">{result.tests.openweathermap.data.windSpeed} m/s</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Location</p>
                        <p className="font-semibold">
                          {result.tests.openweathermap.data.location}
                          {result.tests.openweathermap.data.country && `, ${result.tests.openweathermap.data.country}`}
                        </p>
                      </div>
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">
                          View Raw Response
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto">
                          {JSON.stringify(result.tests.openweathermap.raw, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {result.tests?.openweathermap?.configured
                        ? "API key configured but test not run"
                        : "API key not configured (OPENWEATHER_API_KEY)"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* AccuWeather Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    AccuWeather API Test
                    {getStatusBadge(result.tests?.accuweather?.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.tests?.accuweather?.error ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Error:</p>
                      <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap">
                        {result.tests.accuweather.error}
                      </pre>
                    </div>
                  ) : result.tests?.accuweather?.data ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Temperature</p>
                          <p className="text-lg font-bold">{result.tests.accuweather.data.temperature}°C</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Condition</p>
                          <p className="text-lg font-bold">{result.tests.accuweather.data.condition}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Humidity</p>
                          <p className="text-lg font-bold">{result.tests.accuweather.data.humidity}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Wind Speed</p>
                          <p className="text-lg font-bold">{result.tests.accuweather.data.windSpeed} km/h</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Location</p>
                        <p className="font-semibold">{result.tests.accuweather.data.location}</p>
                      </div>
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">
                          View Raw Response
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto">
                          {JSON.stringify(result.tests.accuweather.raw, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {result.tests?.accuweather?.configured
                        ? "API key configured but test not run"
                        : "API key not configured (ACCUWEATHER_API_KEY)"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Full JSON Response */}
              <Card>
                <CardHeader>
                  <CardTitle>Full Test Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-muted-foreground mb-2">
                      View Complete JSON Response
                    </summary>
                    <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </CardContent>
              </Card>
            </>
          )}

          {/* Batch Test Results */}
          {Object.keys(results).length > 0 && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle>Batch Test Results ({Object.keys(results).length} locations)</CardTitle>
                <CardDescription>Results from testing multiple locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(results).map(([loc, data]: [string, any]) => (
                    <div key={loc} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{loc}</h3>
                        <div className="flex gap-2">
                          {data.tests?.openweathermap?.status === "success" && (
                            <Badge className="bg-green-500">OWM ✓</Badge>
                          )}
                          {data.tests?.accuweather?.status === "success" && (
                            <Badge className="bg-blue-500">AW ✓</Badge>
                          )}
                          {(data.tests?.openweathermap?.status === "failed" ||
                            data.tests?.accuweather?.status === "failed") && (
                            <Badge className="bg-red-500">Failed</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* OpenWeatherMap Result */}
                        <div className="p-3 bg-muted/50 rounded">
                          <p className="text-xs font-semibold mb-2">OpenWeatherMap</p>
                          {data.tests?.openweathermap?.data ? (
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-muted-foreground">Temp:</span>{" "}
                                {data.tests.openweathermap.data.temperature}°C
                              </p>
                              <p>
                                <span className="text-muted-foreground">Condition:</span>{" "}
                                {data.tests.openweathermap.data.condition}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Humidity:</span>{" "}
                                {data.tests.openweathermap.data.humidity}%
                              </p>
                              {data.tests.openweathermap.responseTime && (
                                <p className="text-xs text-muted-foreground">
                                  Response: {data.tests.openweathermap.responseTime}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {data.tests?.openweathermap?.error || "Not tested"}
                            </p>
                          )}
                        </div>

                        {/* AccuWeather Result */}
                        <div className="p-3 bg-muted/50 rounded">
                          <p className="text-xs font-semibold mb-2">AccuWeather</p>
                          {data.tests?.accuweather?.data ? (
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-muted-foreground">Temp:</span>{" "}
                                {data.tests.accuweather.data.temperature}°C
                              </p>
                              <p>
                                <span className="text-muted-foreground">Condition:</span>{" "}
                                {data.tests.accuweather.data.condition}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Humidity:</span>{" "}
                                {data.tests.accuweather.data.humidity}%
                              </p>
                              {data.tests.accuweather.responseTime && (
                                <p className="text-xs text-muted-foreground">
                                  Response: {data.tests.accuweather.responseTime}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {data.tests?.accuweather?.error || "Not tested"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Stats */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-semibold mb-2">Summary:</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Tested</p>
                      <p className="text-lg font-bold">{Object.keys(results).length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">OpenWeatherMap Success</p>
                      <p className="text-lg font-bold text-green-600">
                        {
                          Object.values(results).filter(
                            (r: any) => r.tests?.openweathermap?.status === "success"
                          ).length
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">AccuWeather Success</p>
                      <p className="text-lg font-bold text-blue-600">
                        {
                          Object.values(results).filter(
                            (r: any) => r.tests?.accuweather?.status === "success"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

