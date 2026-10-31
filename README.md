# 🧭 Personalized Travel Itinerary Planner

An AI-powered, full-stack **Personalized Travel Itinerary Planner** that generates customized, day-wise travel itineraries based on destination, budget, interests, travel style, and trip duration. Featuring an interactive chronological timeline, live Leaflet map routing, dynamic budget utilization tracking, and smart AI day regeneration.

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/namansahu321/Personalized-Travel-Itinerary-Planner)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](https://python.org)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet.js-199900?logo=leaflet)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Problem Statement

Planning a multi-day trip is often tedious, overwhelming, and fragmented across dozens of browser tabs:
- Travelers struggle to sequence attractions logically to avoid backtracking and long transit times.
- Estimating realistic travel budgets across accommodations, food, tickets, and transit is cumbersome.
- Most itinerary apps offer static lists without interactive geographic context or dynamic schedule reordering.
- Generic recommendations do not match individual travel styles (e.g. relaxed culture vs. fast-paced foodie discovery).

**Personalized Travel Itinerary Planner** solves this by unifying smart AI schedule generation, chronological timeline planning, live map navigation, and dynamic budget tracking into a single, cohesive travel dashboard.

---

## 🚀 Key Features

### 1. ⏱️ Interactive Day-Wise Itinerary Timeline
- **Chronological Sequencing**: Activities organized from morning to night with start/end timings and durations.
- **Rich Activity Cards**: Displays high-resolution imagery, location tags, category badges (*Dining, Culture, Sightseeing, Nature, Shopping*), descriptions, and estimated costs.
- **Live Reordering**: Effortlessly reorder activities with **Move Up (▲)** and **Move Down (▼)** controls with auto-persisted order.
- **CRUD Operations**: Add custom activities, edit activity details via pre-filled modal, and safely remove stops with confirmation dialogs.

### 2. 🤖 AI-Powered Day Regeneration
- Dedicated **"Regenerate Day with AI"** engine.
- Customize generation by:
  - **Travel Pace**: Relaxed (4–5 stops), Moderate (6 stops), or Fast (7 stops).
  - **Focus Area**: Cultural Heritage, Foodie & Gastronomy, Scenic Landscapes, Artisans & Shopping, or Rapids & Adventure.
  - **Budget Tier**: Budget Conscious, Balanced Comfort, or Luxury Experience.
- **Review Before Applying**: Generates a live preview schedule with an **AI Rationale** explaining geographic route optimization before modifying the itinerary.

### 3. 🗺️ Interactive Map & Transportation Routing (Leaflet.js)
- Embedded interactive map synchronized with the active day's timeline.
- **Numbered Map Pins**: Custom teal markers (`1, 2, 3...`) matching the timeline activities.
- **Dashed Route Polylines**: Visual path connecting all daily waypoints chronologically.
- **Two-Way Synchronization**:
  - Clicking an activity card centers and highlights the marker on the map with a popup summary.
  - Clicking a marker on the map scrolls to and highlights the corresponding timeline activity card.
- **Transportation Connectors**: Indicators for transit between stops (*Walking, Cab, Subway/Metro, Bus*) with travel times, distances, and an inline dropdown to change transit modes on the fly.

### 4. 💰 Dynamic Budget & Expense Estimation
- Real-time expense breakdown categorized by:
  - **Accommodation** (Budget allocation)
  - **Food & Dining** (Aggregated from dining activities)
  - **Activities & Tickets** (Aggregated from sightseeing, cultural, and nature stops)
  - **Transportation** (Calculated from transit connector legs)
- **Visual Progress Bar**: Displays budget utilization percentage with color-coded status pills (*On Track*, *Near Limit*, *Over Budget*).
- Instantly recalculates whenever activities or transit options are updated.

### 5. 🗂️ Trip Management & Sharing
- Multi-day support with smooth day tab switching (*Day 1, Day 2, Day 3...*) and a `+ Add Day` button.
- Trip metadata editor (*Destination, Dates, Travelers, Total Budget*).
- Share itinerary dialog with copyable direct link.
- **Download PDF / Print Voucher**: Clean print layout (`@media print`) hiding controls for offline itineraries.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS3, ES6+ JavaScript | Zero external compilation step required; pure modular architecture |
| **Design System** | Custom CSS3 Design System | Plus Jakarta Sans & Inter typography, teal accent (`#0d9488`), navy typography (`#0f172a`), responsive grid |
| **Maps & Routing** | Leaflet.js 1.9.4 & OpenStreetMap | Custom vector marker pins, polyline routes, auto-fit bounding box |
| **Backend API** | Python 3.12, FastAPI, Uvicorn | High-performance asynchronous REST API with Pydantic validation |
| **Database** | Supabase (PostgreSQL) / Local JSON Sync | Dual persistence layer: production-ready Supabase RLS schema + offline local storage fallback |
| **AI Engine** | Contextual Optimization Engine | Intelligent scheduling, tempo pacing, and geographic east-to-west clustering |

---

## 🏗️ System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │               Browser (Client Application)             │
                    │   ┌───────────────────────┬────────────────────────┐   │
                    │   │  Timeline & Controls  │  Leaflet Map & Budget  │   │
                    │   └───────────────────────┴────────────────────────┘   │
                    └───────────────────────────┬────────────────────────────┘
                                                │ REST API Requests
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                   FastAPI Backend                      │
                    │  ├── /api/trips & /api/status                          │
                    │  ├── /api/trips/{id}/days                              │
                    │  ├── /api/trips/{id}/days/{day_id}/activities          │
                    │  └── /api/trips/{id}/days/{day_id}/regenerate (AI)     │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
        ┌─────────────────────────────┐                   ┌─────────────────────────────┐
        │     Supabase PostgreSQL     │                   │     Local Persistence       │
        │   (Trips, Days, Activities, │                   │   (backend/data/trips.json) │
        │    Row-Level Security RLS)  │                   │     Auto-Sync Fallback      │
        └─────────────────────────────┘                   └─────────────────────────────┘
```

---

## 📁 Project Folder Structure

```
Personalized-Travel-Itinerary-Planner/
├── backend/
│   ├── __init__.py              # Python package marker
│   ├── main.py                  # FastAPI server, REST endpoints, static hosting
│   ├── models.py                # Pydantic schemas (Trip, ItineraryDay, Activity, etc.)
│   ├── database.py              # Data access layer (Supabase + Local JSON sync)
│   ├── ai_generator.py          # AI itinerary generation & topology routing
│   └── data/
│       └── trips.json           # Seed data (Kyoto & Tokyo 7-Day Cultural Odyssey)
├── frontend/
│   ├── index.html               # Main HTML entry point & layout mounts
│   ├── css/
│   │   └── style.css            # Complete design system & responsive styling
│   └── js/
│       ├── api.js               # Frontend API client with fallback handling
│       └── app.js               # UI controller, state management, Leaflet map sync
├── tests/
│   └── test_full_flow.py        # Automated end-to-end integration test suite
├── supabase_schema.sql          # Supabase PostgreSQL schema with RLS security policies
├── requirements.txt             # Backend Python dependencies
├── .env.example                 # Environment variable template
├── .gitignore                   # Git exclusions (secrets, env, venv, cache)
└── README.md                    # Project documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/namansahu321/Personalized-Travel-Itinerary-Planner.git
cd Personalized-Travel-Itinerary-Planner
```

### 2. Backend Setup
Create and activate a virtual environment:

**On Windows:**
```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

**On macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment Configuration (Optional)
Copy the example environment configuration:
```bash
cp .env.example .env
```
Edit `.env` to configure your settings (optional):
```env
HOST=127.0.0.1
PORT=8000

# Optional: Supabase Integration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-or-service-role-key

# Optional: Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
```
> **Note**: If Supabase or Gemini keys are omitted, the application runs seamlessly out-of-the-box using local persistence and its built-in contextual AI generation engine.

### 4. Running the Application
Start the full-stack server with hot reload:

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Open your browser and navigate to:
👉 **`http://localhost:8000`**

---

## 📡 API Documentation

Interactive OpenAPI documentation is automatically served by FastAPI:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | System health, database connection, and AI capabilities |
| `GET` | `/api/trips` | List all saved trips |
| `GET` | `/api/trips/{trip_id}` | Fetch full trip details, days, and activities |
| `PUT` | `/api/trips/{trip_id}` | Update top-level trip metadata (dates, budget, travelers) |
| `POST` | `/api/trips/{trip_id}/days` | Add a new day to the itinerary |
| `DELETE` | `/api/trips/{trip_id}/days/{day_id}` | Remove a day from the itinerary |
| `POST` | `/api/trips/{trip_id}/days/{day_id}/activities` | Add a new activity to a day |
| `PUT` | `/api/trips/{trip_id}/days/{day_id}/activities/{activity_id}` | Update an existing activity |
| `DELETE` | `/api/trips/{trip_id}/days/{day_id}/activities/{activity_id}` | Delete an activity |
| `PUT` | `/api/trips/{trip_id}/days/{day_id}/reorder` | Reorder activities in a day |
| `POST` | `/api/trips/{trip_id}/days/{day_id}/regenerate` | Generate AI itinerary preview for a day |
| `POST` | `/api/trips/{trip_id}/days/{day_id}/apply-ai` | Apply AI-generated itinerary to a day |

---

## 🧪 Testing

The repository includes a comprehensive 12-point automated integration test suite:

```bash
python tests/test_full_flow.py
```

**Test Coverage Highlights:**
- System health and static asset delivery
- Trip and multi-day itinerary retrieval
- Activity addition, editing, reordering, and deletion
- AI day regeneration and preview application
- Dynamic budget recalculation verification

---

## 🔮 Future Enhancements (Roadmap)

- [ ] **Collaborative Planning**: Real-time collaborative editing with travel companions via WebSockets.
- [ ] **Weather Forecast Integration**: Live destination weather alerts with indoor rainy-day itinerary backups.
- [ ] **Turn-by-Turn GPS Directions**: Direct deep linking with Google Maps and Apple Maps navigation.
- [ ] **Currency Conversion**: Automatic multi-currency conversion based on real-time exchange rates.
- [ ] **Flight & Hotel Booking Import**: Automatic parsing of confirmation emails and flight boarding passes.

---

## 👤 Author

**Naman Sahu**
- GitHub: [@namansahu321](https://github.com/namansahu321)
- Project: [Personalized-Travel-Itinerary-Planner](https://github.com/namansahu321/Personalized-Travel-Itinerary-Planner)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
