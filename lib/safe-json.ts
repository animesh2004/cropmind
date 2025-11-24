/**
 * Safe JSON parsing utilities
 * Prevents errors when API returns HTML instead of JSON
 */

/**
 * Safely parse JSON from a Response object
 * Returns null if response is not JSON or parsing fails
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T | null> {
  try {
    // Check content type
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("Response is not JSON, content-type:", contentType)
      return null
    }

    // Try to parse JSON
    const text = await response.text()
    if (!text || text.trim().length === 0) {
      return null
    }

    // Check if it looks like HTML (starts with <)
    if (text.trim().startsWith("<")) {
      console.warn("Response appears to be HTML, not JSON")
      return null
    }

    return JSON.parse(text) as T
  } catch (error) {
    console.error("Failed to parse JSON:", error)
    return null
  }
}

/**
 * Fetch and safely parse JSON
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null; response: Response | null }> {
  try {
    const response = await fetch(url, options)
    const data = await safeJsonParse<T>(response)
    
    if (!response.ok) {
      return {
        data: null,
        error: data?.error || `HTTP ${response.status}: ${response.statusText}`,
        response,
      }
    }

    return {
      data,
      error: data ? null : "Failed to parse response",
      response,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error),
      response: null,
    }
  }
}



