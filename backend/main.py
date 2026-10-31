import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.models import (
    Trip, ItineraryDay, Activity, Transportation,
    RegenerateDayRequest, UpdateTripRequest
)
from backend.database import (
    get_trip, save_trip, list_trips, get_database_status
)
from backend.ai_generator import generate_ai_day

app = FastAPI(
    title="Personalized Travel Itinerary Planner API",
    description="Backend API powering the Interactive Itinerary Dashboard, AI itinerary generation, and travel budgeting.",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"

@app.get("/api/status")
def get_system_status():
    """Return backend health, database connection status, and AI capabilities."""
    db_status = get_database_status()
    return {
        "status": "healthy",
        "app_name": "Personalized Travel Itinerary Planner",
        "version": "2.0.0",
        "database": db_status,
        "ai_engine": {
            "status": "Ready",
            "model": "Gemini 2.0 Flash / Contextual Travel Optimization Engine",
            "features": ["smart_time_scheduling", "geo_routing", "budget_optimization"]
        }
    }

@app.get("/api/trips")
def get_all_trips():
    """List all available trips."""
    return list_trips()

@app.get("/api/trips/{trip_id}", response_model=Trip)
def get_trip_details(trip_id: str):
    """Fetch complete itinerary details for a specific trip."""
    trip = get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip '{trip_id}' not found")
    return trip

@app.put("/api/trips/{trip_id}", response_model=Trip)
def update_trip_details(trip_id: str, update: UpdateTripRequest):
    """Update trip top-level metadata (dates, travelers, budget)."""
    trip = get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    trip_data = trip.dict()
    for field, val in update.dict(exclude_unset=True).items():
        if val is not None:
            trip_data[field] = val
    
    updated_trip = Trip(**trip_data)
    save_trip(updated_trip)
    return updated_trip

@app.post("/api/trips/{trip_id}/days", response_model=Trip)
def add_itinerary_day(trip_id: str, day_data: Optional[Dict[str, Any]] = None):
    """Add a new day to the trip itinerary."""
    trip = get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    new_day_num = len(trip.days) + 1
    new_day_id = f"day-{new_day_num}"
    
    title = day_data.get("title") if day_data else f"Day {new_day_num} Exploration"
    theme = day_data.get("theme") if day_data else "Free Discovery & Local Leisure"
    date = day_data.get("date") if day_data else trip.end_date

    new_day = ItineraryDay(
        id=new_day_id,
        day_number=new_day_num,
        date=date,
        title=title,
        theme=theme,
        activities=[]
    )
    trip.days.append(new_day)
    save_trip(trip)
    return trip

@app.delete("/api/trips/{trip_id}/days/{day_id}", response_model=Trip)
def delete_itinerary_day(trip_id: str, day_id: str):
    """Remove a day from the itinerary."""
    trip = get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    trip.days = [d for d in trip.days if d.id != day_id]
    # Re-index remaining days
    for idx, d in enumerate(trip.days):
        d.day_number = idx + 1
        d.id = f"day-{idx + 1}"
    
    save_trip(trip)
    return trip

@app.post("/api/trips/{trip_id}/days/{day_id}/activities", response_model=Trip)
def add_activity(trip_id: str, day_id: str, activity: Activity):
    """Add an activity to a specific day in the trip."""
    trip = get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    target_day = next((d for d in trip.days if d.id == day_id), None)
    if not target_day:
        raise HTTPException(status_code=404, detail=f"Day '{day_id}' not found")
    
    activity.order = len(target_day.activities) + 1
    target_day.activities.append(activity)
    save_trip(trip)
    return trip

@app.put("/api/trips/{trip_id}/days/{day_id}/activities/{activity_id}", response_model=Trip)
def update_activity(trip_id: str, day_id: str, activity_id: str, updated_act: Activity):
    """Update details of an existing activity."""
    trip = get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    target_day = next((d for d in trip.days if d.id == day_id), None)
    if not target_day:
        raise HTTPException(status_code=404, detail=f"Day '{day_id}' not found")
    
    act_index = next((i for i, a in enumerate(target_day.activities) if a.id == activity_id), -1)
    if act_index == -1:
        raise HTTPException(status_code=404, detail=f"Activity '{activity_id}' not found")
    
    target_day.activities[act_index] = updated_act
    save_trip(trip)
    return trip

@app.delete("/api/trips/{trip_id}/days/{day_id}/activities/{activity_id}", response_model=Trip)
def delete_activity(trip_id: str, day_id: str, activity_id: str):
    """Delete an activity from a day and adjust timeline order."""
    trip = get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    target_day = next((d for d in trip.days if d.id == day_id), None)
    if not target_day:
        raise HTTPException(status_code=404, detail=f"Day '{day_id}' not found")
    
    target_day.activities = [a for a in target_day.activities if a.id != activity_id]
    for idx, a in enumerate(target_day.activities):
        a.order = idx + 1
        if idx == len(target_day.activities) - 1:
            a.transport_to_next = None
            
    save_trip(trip)
    return trip

@app.put("/api/trips/{trip_id}/days/{day_id}/reorder", response_model=Trip)
def reorder_activities(trip_id: str, day_id: str, activity_ids: List[str] = Body(...)):
    """Reorder activities in a day based on array of IDs."""
    trip = get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    target_day = next((d for d in trip.days if d.id == day_id), None)
    if not target_day:
        raise HTTPException(status_code=404, detail=f"Day '{day_id}' not found")
    
    act_map = {a.id: a for a in target_day.activities}
    reordered: List[Activity] = []
    for idx, aid in enumerate(activity_ids):
        if aid in act_map:
            act = act_map[aid]
            act.order = idx + 1
            reordered.append(act)
    
    # Ensure remaining activities (if any) are appended
    for aid, act in act_map.items():
        if aid not in activity_ids:
            act.order = len(reordered) + 1
            reordered.append(act)
            
    target_day.activities = reordered
    save_trip(trip)
    return trip

@app.post("/api/trips/{trip_id}/days/{day_id}/regenerate")
def regenerate_day_ai(trip_id: str, day_id: str, req: RegenerateDayRequest):
    """
    Generate an improved day-wise itinerary with AI.
    Returns preview data with rationale so user can review before applying.
    """
    trip = get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    generated = generate_ai_day(trip, req)
    return generated

@app.post("/api/trips/{trip_id}/days/{day_id}/apply-ai", response_model=Trip)
def apply_ai_day(trip_id: str, day_id: str, ai_data: Dict[str, Any] = Body(...)):
    """Apply generated AI activities and title to the selected day."""
    trip = get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    target_day = next((d for d in trip.days if d.id == day_id), None)
    if not target_day:
        raise HTTPException(status_code=404, detail=f"Day '{day_id}' not found")
    
    if "title" in ai_data:
        target_day.title = ai_data["title"]
    if "theme" in ai_data:
        target_day.theme = ai_data["theme"]
    if "activities" in ai_data:
        target_day.activities = [Activity(**a) for a in ai_data["activities"]]
        
    save_trip(trip)
    return trip

# Mount frontend static directory if exists
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def serve_frontend():
        return FileResponse(FRONTEND_DIR / "index.html")

    @app.get("/{full_path:path}")
    def serve_spa_or_file(full_path: str):
        file_candidate = FRONTEND_DIR / full_path
        if file_candidate.is_file():
            return FileResponse(file_candidate)
        return FileResponse(FRONTEND_DIR / "index.html")
