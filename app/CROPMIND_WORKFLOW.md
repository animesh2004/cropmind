# CropMind System Workflow

## Basic System Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CROPMIND SYSTEM WORKFLOW                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Field Sensors│
│  (6 Sensors) │
└──────┬───────┘
       │
       │ ESP-NOW Protocol
       ▼
┌─────────────────┐
│  ESP8266 Field  │
│     Units       │
│  (3 Units)      │
└──────┬──────────┘
       │
       │ ESP-NOW
       ▼
┌─────────────────┐
│ ESP8266 Central │
│     Unit        │
└──────┬──────────┘
       │
       │ WiFi / HTTP POST
       ▼
┌─────────────────┐
│  Blynk Cloud    │
│    Platform     │
│  (Virtual Pins) │
└──────┬──────────┘
       │
       │ Webhook / API
       ▼
┌─────────────────┐
│ CropMind Webhook│
│     API         │
│ /api/webhooks/  │
│     blynk       │
└──────┬──────────┘
       │
       │ Process & Store
       ▼
┌─────────────────┐
│  Data Processing│
│  & Validation   │
└──────┬──────────┘
       │
       │ Update Dashboard
       ▼
┌─────────────────┐
│ CropMind        │
│   Dashboard     │
│                 │
│ • Real-time     │
│   Monitoring    │
│ • AI            │
│   Recommendations│
│ • Voice         │
│   Commands      │
│ • Historical    │
│   Data          │
└─────────────────┘
       │
       │ User Interaction
       ▼
┌─────────────────┐
│     Farmer      │
│   (End User)    │
└─────────────────┘
```

## Data Flow Process

```
START
  │
  ├─► [Sensors Read Data]
  │   • Soil Moisture (V0)
  │   • Temperature (V3)
  │   • Humidity (V4)
  │   • pH (V8)
  │   • PIR (V1)
  │   • Flame (V2)
  │
  ├─► [ESP8266 Field Units]
  │   • Collect readings
  │   • Format data
  │
  ├─► [ESP8266 Central Unit]
  │   • Aggregate data
  │   • Connect to WiFi
  │
  ├─► [Blynk Cloud]
  │   • Store in Virtual Pins
  │   • Trigger Webhook
  │
  ├─► [CropMind API]
  │   • Receive webhook
  │   • Validate data
  │   • Store in cache
  │
  ├─► [Dashboard Update]
  │   • Display real-time values
  │   • Check thresholds
  │   • Generate alerts
  │
  ├─► [AI Processing]
  │   • Analyze conditions
  │   • Generate recommendations
  │   • Suggest crops
  │
  └─► [User Interface]
      • View data
      • Voice commands
      • Download reports
      END
```

## Sensor Data Processing Flow

```
┌─────────────┐
│   Sensor    │──► Read Value ──► Validate Range ──► Format Data
└─────────────┘
       │
       ▼
┌─────────────┐
│  Blynk Pin  │──► V0 (Moisture) ──► 0-100%
│  Mapping    │──► V1 (PIR) ──────► 0 or 1
│             │──► V2 (Flame) ─────► 0 or 1
│             │──► V3 (Temp) ──────► -40 to 80°C
│             │──► V4 (Humidity) ──► 0-100%
│             │──► V8 (pH) ────────► 0-14
└─────────────┘
       │
       ▼
┌─────────────┐
│  Dashboard  │──► Display Card ──► Color Code ──► Show Alert
└─────────────┘
```

## User Interaction Flow

```
┌─────────────┐
│    User     │
│  (Farmer)   │
└──────┬──────┘
       │
       ├─► [View Dashboard]
       │   • Real-time sensor data
       │   • Historical graphs
       │   • Weather information
       │
       ├─► [Voice Commands]
       │   • "What is soil moisture?"
       │   • "Which crop to plant?"
       │   • "How is weather?"
       │
       ├─► [AI Recommendations]
       │   • Crop suggestions
       │   • Fertilizer advice
       │   • Irrigation schedule
       │
       └─► [Data Export]
           • Download CSV
           • Historical reports
```

## Complete End-to-End Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    CROPMIND COMPLETE WORKFLOW                 │
└──────────────────────────────────────────────────────────────┘

[Field] ──► [ESP8266] ──► [Blynk] ──► [CropMind] ──► [Farmer]
Sensors     Units        Cloud       Dashboard      Decision

   │            │           │            │              │
   │            │           │            │              │
   ▼            ▼           ▼            ▼              ▼
Read Data   Aggregate   Store Data   Process &    View & Act
            & Send      in Pins      Analyze      on Insights
```

---

## Key Components

1. **IoT Layer**: Field sensors collecting environmental data
2. **Communication Layer**: ESP-NOW and WiFi for data transmission
3. **Cloud Layer**: Blynk platform for data aggregation
4. **Application Layer**: CropMind dashboard for processing and display
5. **User Layer**: Farmers accessing insights and recommendations

---

**Note**: This flowchart can be easily converted to visual diagrams using tools like:
- Draw.io / diagrams.net
- Lucidchart
- Microsoft Visio
- PowerPoint SmartArt

