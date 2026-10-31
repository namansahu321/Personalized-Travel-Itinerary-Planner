from typing import List, Optional
from pydantic import BaseModel, Field

class Transportation(BaseModel):
    id: Optional[str] = None
    mode: str = "walking"  # walking, cab, transit, bus, bicycle
    duration: str = "15 mins"
    distance: Optional[str] = "1.0 km"
    cost: float = 0.0

class Activity(BaseModel):
    id: str
    day_id: str
    order: int = 1
    name: str
    location: str
    lat: float
    lng: float
    start_time: str
    end_time: str
    duration: str
    description: str
    cost: float = 0.0
    category: str = "Sightseeing"  # Sightseeing, Dining, Culture, Nature, Shopping, Relaxation, Entertainment
    image_url: str = ""
    transport_to_next: Optional[Transportation] = None

class ItineraryDay(BaseModel):
    id: str
    day_number: int
    date: str
    title: str
    theme: str
    activities: List[Activity] = []

class Trip(BaseModel):
    id: str
    title: str
    destination: str
    country: str
    start_date: str
    end_date: str
    travelers_count: int = 2
    travel_style: str = "Cultural & Gastronomy • Relaxed Pace"
    total_budget: float = 3800.0
    accommodation_budget: float = 1400.0
    days: List[ItineraryDay] = []

class RegenerateDayRequest(BaseModel):
    trip_id: str
    day_number: int
    pace: str = "moderate"  # relaxed, moderate, fast
    focus: str = "culture"   # culture, foodie, scenic, shopping, adventure
    budget_tier: str = "balanced" # budget, balanced, luxury
    custom_prompt: Optional[str] = ""

class UpdateTripRequest(BaseModel):
    title: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    travelers_count: Optional[int] = None
    travel_style: Optional[str] = None
    total_budget: Optional[float] = None
    accommodation_budget: Optional[float] = None
