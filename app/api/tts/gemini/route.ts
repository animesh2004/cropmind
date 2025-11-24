import { NextRequest, NextResponse } from "next/server"
// Import GoogleGenAI for server-side (Node.js) usage
// The package exports "./node" for server-side usage
import { GoogleGenAI } from "@google/genai/node"
import { 
  getGeminiApiKey, 
  GEMINI_MODEL_NAME, 
  GEMINI_API_URL,
  GEMINI_VOICES,
  isGeminiConfigured 
} from "@/lib/ai"

/**
 * Gemini Text-to-Speech API Route
 * Uses Gemini 2.5 Flash Preview TTS model with official @google/genai SDK
 * Based on the official example code
 */

const GEMINI_API_KEY = getGeminiApiKey()
const MODEL_NAME = GEMINI_MODEL_NAME

interface WavConversionOptions {
  numChannels: number
  sampleRate: number
  bitsPerSample: number
}

export async function POST(request: NextRequest) {
  try {
    const { text, language = "en", speaker = "Callirrhoe" } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      )
    }

    if (!isGeminiConfigured()) {
      console.error("GEMINI_API_KEY is not configured")
      return NextResponse.json(
        { 
          error: "Gemini API key not configured",
          details: "Please set GEMINI_API_KEY in your .env.local file"
        },
        { status: 500 }
      )
    }

    // Map language to appropriate voice
    // Only two voices: Callirrhoe (English), Puck (Hindi)
    const voiceName = language === "hi" ? GEMINI_VOICES.HINDI : GEMINI_VOICES.ENGLISH

    console.log("Gemini TTS Request:", {
      model: MODEL_NAME,
      voiceName,
      textLength: text.length,
      language,
    })

    // Initialize GoogleGenAI
    let ai: GoogleGenAI
    try {
      ai = new GoogleGenAI({
        apiKey: GEMINI_API_KEY,
      })
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI:", error)
      return NextResponse.json(
        {
          error: "Failed to initialize Gemini AI",
          details: error instanceof Error ? error.message : String(error),
          hint: "Check if @google/genai package is installed correctly",
        },
        { status: 500 }
      )
    }

    // Configure TTS - structure based on Gemini API
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: text,
          },
        ],
      },
    ]

    // Generate content stream with TTS configuration
    let response: any
    try {
      console.log("Attempting to generate content stream with:", {
        model: MODEL_NAME,
        voiceName,
        hasContents: !!contents,
        contentsLength: contents.length,
      })
      
      // Try the API call - responseModalities should be uppercase
      response = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: contents,
        config: {
          temperature: 1,
          responseModalities: ["AUDIO"], // Must be uppercase
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName,
              },
            },
          },
        },
      })
      
      console.log("Content stream generated successfully, response type:", typeof response)
    } catch (error) {
      console.error("Failed to generate content stream - Full error:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      
      console.error("Error details:", {
        message: errorMessage,
        stack: errorStack,
        model: MODEL_NAME,
        voiceName,
        apiKeyLength: GEMINI_API_KEY.length,
      })
      
      // Try fallback REST API approach if SDK fails
      console.log("SDK approach failed, trying REST API fallback...")
      try {
        // Use the model name directly in the URL (it already includes 'models/' prefix)
        const restResponse = await fetch(
          `${GEMINI_API_URL}/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: contents,
              generationConfig: {
                temperature: 1,
                responseModalities: ["AUDIO"], // Must be uppercase
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: voiceName,
                    },
                  },
                },
              },
            }),
          }
        )

        if (!restResponse.ok) {
          const restErrorText = await restResponse.text()
          console.error("REST API also failed:", restErrorText)
          throw new Error(`REST API failed: ${restResponse.status} - ${restErrorText}`)
        }

        // Process REST API response - handle non-streaming response
        const restData = await restResponse.json()
        console.log("REST API response received:", {
          hasCandidates: !!restData.candidates,
          candidatesLength: restData.candidates?.length,
        })
        
        // Initialize audio chunks array for REST API response
        let restAudioChunks: Buffer[] = []
        
        // If REST API returns data, process it
        if (restData.candidates && restData.candidates[0]?.content?.parts) {
          const parts = restData.candidates[0].content.parts
          for (const part of parts) {
            if (part.inlineData) {
              const mime = await import("mime")
              let buffer: Buffer
              const fileExtension = mime.default.getExtension(part.inlineData.mimeType || "")
              
              if (!fileExtension) {
                buffer = convertToWav(part.inlineData.data || "", part.inlineData.mimeType || "")
              } else {
                buffer = Buffer.from(part.inlineData.data || "", "base64")
              }
              
              restAudioChunks.push(buffer)
            }
          }
          
          if (restAudioChunks.length > 0) {
            const combinedAudio = Buffer.concat(restAudioChunks)
            console.log("REST API Success - returning audio:", {
              audioSize: combinedAudio.length,
              chunks: restAudioChunks.length,
            })
            return new NextResponse(combinedAudio, {
              status: 200,
              headers: {
                "Content-Type": "audio/wav",
                "Content-Length": combinedAudio.length.toString(),
                "Cache-Control": "no-cache",
              },
            })
          }
        }
        
        throw new Error("REST API returned no audio data")
      } catch (fallbackError) {
        console.error("Fallback REST API also failed:", fallbackError)
        return NextResponse.json(
          {
            error: "Failed to generate speech stream",
            details: errorMessage,
            hint: `Check your API key (length: ${GEMINI_API_KEY.length}), model name ('${MODEL_NAME}'), voice name ('${voiceName}'), and network connection. Both SDK and REST API approaches failed.`,
            debug: process.env.NODE_ENV === "development" ? { 
              stack: errorStack,
              fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
            } : undefined,
          },
          { status: 500 }
        )
      }
    }

    // Collect audio chunks
    let audioChunks: Buffer[] = []
    let mimeType = "audio/wav"

    // Process stream chunks with detailed logging
    let chunkCount = 0
    try {
      for await (const chunk of response) {
        chunkCount++
        console.log(`Processing chunk ${chunkCount}:`, {
          hasCandidates: !!chunk.candidates,
          candidatesLength: chunk.candidates?.length,
          hasContent: !!chunk.candidates?.[0]?.content,
          hasParts: !!chunk.candidates?.[0]?.content?.parts,
          partsLength: chunk.candidates?.[0]?.content?.parts?.length,
          hasInlineData: !!chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData,
          hasText: !!chunk.text,
        })
        
        if (!chunk.candidates || !chunk.candidates[0]?.content || !chunk.candidates[0].content.parts) {
          console.log("Skipping chunk - missing structure")
          continue
        }

        const part = chunk.candidates[0].content.parts[0]
        
        if (part?.inlineData) {
          const inlineData = part.inlineData
          console.log("Found inlineData:", {
            mimeType: inlineData.mimeType,
            dataLength: inlineData.data?.length,
          })

          // Get file extension from mime type
          const mime = await import("mime")
          let fileExtension = mime.default.getExtension(inlineData.mimeType || "")

          // Process audio data
          let buffer: Buffer

          if (!fileExtension) {
            fileExtension = "wav"
            // Convert to WAV if needed
            buffer = convertToWav(inlineData.data || "", inlineData.mimeType || "")
          } else {
            // Decode base64 audio data directly
            buffer = Buffer.from(inlineData.data || "", "base64")
          }

          if (inlineData.mimeType) {
            mimeType = inlineData.mimeType
          }

          audioChunks.push(buffer)
          console.log(`Added audio chunk ${audioChunks.length}, size: ${buffer.length}`)
        } else if (chunk.text) {
          // Log text if received (shouldn't happen with audio modality)
          console.log("Received text instead of audio:", chunk.text.substring(0, 100))
        } else {
          console.log("Chunk has no inlineData or text")
        }
      }
      
      console.log(`Finished processing ${chunkCount} chunks, collected ${audioChunks.length} audio chunks`)
    } catch (streamError) {
      console.error("Error processing stream:", streamError)
      throw streamError
    }

    if (audioChunks.length === 0) {
      console.error("No audio chunks received from Gemini TTS", {
        model: MODEL_NAME,
        voiceName,
        textLength: text.length,
      })
      return NextResponse.json(
        {
          error: "No audio data received from Gemini TTS",
          details: "The model did not return any audio data. This might indicate the model doesn't support TTS or the request format is incorrect.",
          hint: `Check if model '${MODEL_NAME}' supports TTS and voice '${voiceName}' is valid. Available voices: Callirrhoe (English), Puck (Hindi)`,
        },
        { status: 500 }
      )
    }

    // Combine all audio chunks
    const combinedAudio = Buffer.concat(audioChunks)

    console.log("Gemini TTS Success:", {
      audioSize: combinedAudio.length,
      mimeType,
      chunks: audioChunks.length,
    })

    // Return audio as WAV
    return new NextResponse(combinedAudio, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": combinedAudio.length.toString(),
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Gemini TTS error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json(
      {
        error: "Failed to generate speech",
        details: errorMessage,
        hint: "Check your GEMINI_API_KEY, model name, and network connection",
      },
      { status: 500 }
    )
  }
}

// Convert to WAV format (exactly as in example)
function convertToWav(rawData: string, mimeType: string): Buffer {
  const options = parseMimeType(mimeType)
  const wavHeader = createWavHeader(rawData.length, options)
  const buffer = Buffer.from(rawData, "base64")
  return Buffer.concat([wavHeader, buffer])
}

// Parse MIME type (exactly as in example)
function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(";").map((s) => s.trim())
  const [_, format] = fileType.split("/")

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
  }

  if (format && format.startsWith("L")) {
    const bits = parseInt(format.slice(1), 10)
    if (!isNaN(bits)) {
      options.bitsPerSample = bits
    }
  }

  for (const param of params) {
    const [key, value] = param.split("=").map((s) => s.trim())
    if (key === "rate") {
      options.sampleRate = parseInt(value, 10)
    }
  }

  return options as WavConversionOptions
}

// Create WAV header (exactly as in example)
function createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
  const { numChannels, sampleRate, bitsPerSample } = options

  // http://soundfile.sapp.org/doc/WaveFormat
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8

  const buffer = Buffer.alloc(44)

  buffer.write("RIFF", 0) // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4) // ChunkSize
  buffer.write("WAVE", 8) // Format
  buffer.write("fmt ", 12) // Subchunk1ID
  buffer.writeUInt32LE(16, 16) // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20) // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22) // NumChannels
  buffer.writeUInt32LE(sampleRate, 24) // SampleRate
  buffer.writeUInt32LE(byteRate, 28) // ByteRate
  buffer.writeUInt16LE(blockAlign, 32) // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34) // BitsPerSample
  buffer.write("data", 36) // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40) // Subchunk2Size

  return buffer
}
