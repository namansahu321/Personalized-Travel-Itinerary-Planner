import httpx
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_full_itinerary_flow():
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)
    print(">>> 1. Testing System Status & Health...")
    r = client.get("/api/status")
    assert r.status_code == 200, f"Status failed: {r.status_code}"
    status_data = r.json()
    assert status_data["status"] == "healthy"
    print("    [PASS] Health check passed:", status_data["database"]["engine"])

    print(">>> 2. Testing Frontend Static Delivery...")
    r = client.get("/")
    assert r.status_code == 200 and "WanderWise" in r.text
    r_css = client.get("/css/style.css")
    assert r_css.status_code == 200 and "--primary:" in r_css.text
    r_js = client.get("/js/app.js")
    assert r_js.status_code == 200 and "CATEGORY_MAP" in r_js.text
    r_api = client.get("/js/api.js")
    assert r_api.status_code == 200 and "API_BASE_URL" in r_api.text
    print("    [PASS] All frontend static assets delivered with 200 OK")

    print(">>> 3. Testing Trips Fetch...")
    r = client.get("/api/trips")
    assert r.status_code == 200
    trips = r.json()
    assert len(trips) > 0
    trip_id = trips[0]["id"]
    print(f"    [PASS] Found trip '{trip_id}' with {trips[0]['days_count']} days")

    print(">>> 4. Testing Trip Details...")
    r = client.get(f"/api/trips/{trip_id}")
    assert r.status_code == 200
    trip = r.json()
    assert len(trip["days"]) >= 3
    day_1 = trip["days"][0]
    assert len(day_1["activities"]) >= 4
    print(f"    [PASS] Day 1 has {len(day_1['activities'])} activities")

    print(">>> 5. Testing Adding an Activity...")
    new_act_payload = {
        "id": "act-test-tea",
        "day_id": day_1["id"],
        "order": len(day_1["activities"]) + 1,
        "name": "Gion Tea Ceremony at Dusk",
        "location": "Gion Shinbashi-dori, Higashiyama, Kyoto",
        "lat": 35.0045,
        "lng": 135.7750,
        "start_time": "05:30 PM",
        "end_time": "06:45 PM",
        "duration": "1 hr 15 mins",
        "description": "Experience an authentic twilight tea ritual in a preserved 19th-century teahouse.",
        "cost": 35.0,
        "category": "Culture",
        "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
        "transport_to_next": {
            "mode": "walking",
            "duration": "10 mins",
            "distance": "0.6 km",
            "cost": 0.0
        }
    }
    r = client.post(f"/api/trips/{trip_id}/days/{day_1['id']}/activities", json=new_act_payload)
    assert r.status_code == 200
    updated_trip = r.json()
    act_names = [a["name"] for a in updated_trip["days"][0]["activities"]]
    assert "Gion Tea Ceremony at Dusk" in act_names
    print("    [PASS] Successfully added 'Gion Tea Ceremony at Dusk'")

    print(">>> 6. Testing Updating an Activity...")
    new_act_payload["cost"] = 40.0
    new_act_payload["duration"] = "1 hr 30 mins"
    r = client.put(f"/api/trips/{trip_id}/days/{day_1['id']}/activities/act-test-tea", json=new_act_payload)
    assert r.status_code == 200
    updated_act = next(a for a in r.json()["days"][0]["activities"] if a["id"] == "act-test-tea")
    assert updated_act["cost"] == 40.0
    print("    [PASS] Activity cost updated to $40.0")

    print(">>> 7. Testing Reordering Activities...")
    current_ids = [a["id"] for a in r.json()["days"][0]["activities"]]
    reversed_ids = list(reversed(current_ids))
    r = client.put(f"/api/trips/{trip_id}/days/{day_1['id']}/reorder", json=reversed_ids)
    assert r.status_code == 200
    new_order = [a["id"] for a in r.json()["days"][0]["activities"]]
    assert new_order == reversed_ids
    print("    [PASS] Activities reordered successfully")

    # Restore original order
    client.put(f"/api/trips/{trip_id}/days/{day_1['id']}/reorder", json=current_ids)

    print(">>> 8. Testing AI Day Regeneration...")
    ai_req = {
        "trip_id": trip_id,
        "day_number": 1,
        "pace": "moderate",
        "focus": "culture",
        "budget_tier": "balanced",
        "custom_prompt": "Focus on historic Zen temples and evening teahouses"
    }
    r = client.post(f"/api/trips/{trip_id}/days/{day_1['id']}/regenerate", json=ai_req)
    assert r.status_code == 200
    ai_data = r.json()
    assert "activities" in ai_data and len(ai_data["activities"]) >= 4
    assert "rationale" in ai_data and len(ai_data["rationale"]) > 10
    print(f"    [PASS] AI generated {len(ai_data['activities'])} activities. Rationale: {ai_data['rationale'][:60]}...")

    print(">>> 9. Testing Applying AI Itinerary...")
    r = client.post(f"/api/trips/{trip_id}/days/{day_1['id']}/apply-ai", json=ai_data)
    assert r.status_code == 200
    print("    [PASS] AI Itinerary applied to day")

    print(">>> 10. Testing Deleting Activity...")
    first_act_id = ai_data["activities"][0]["id"]
    r = client.delete(f"/api/trips/{trip_id}/days/{day_1['id']}/activities/{first_act_id}")
    assert r.status_code == 200
    remaining_ids = [a["id"] for a in r.json()["days"][0]["activities"]]
    assert first_act_id not in remaining_ids
    print(f"    [PASS] Deleted activity '{first_act_id}'")

    print(">>> 11. Testing Adding & Deleting Day...")
    r = client.post(f"/api/trips/{trip_id}/days", json={"title": "Day 4: Nara Deer Park & Giant Buddha", "theme": "Wildlife & Ancient Capital", "date": "2026-10-15"})
    assert r.status_code == 200
    trip_with_day_4 = r.json()
    assert len(trip_with_day_4["days"]) == 4
    day_4_id = trip_with_day_4["days"][-1]["id"]
    print("    [PASS] Added Day 4 successfully")

    r = client.delete(f"/api/trips/{trip_id}/days/{day_4_id}")
    assert r.status_code == 200
    assert len(r.json()["days"]) == 3
    print("    [PASS] Deleted Day 4 successfully and re-indexed remaining days")

    print(">>> 12. Testing Trip Metadata Update...")
    r = client.put(f"/api/trips/{trip_id}", json={"total_budget": 4200.0, "travelers_count": 3})
    assert r.status_code == 200
    assert r.json()["total_budget"] == 4200.0
    assert r.json()["travelers_count"] == 3
    print("    [PASS] Trip budget updated to $4,200 for 3 travelers")

    print("\n=============================================")
    print(" ALL 12 INTEGRATION TESTS PASSED PERFECTLY! ")
    print("=============================================")

if __name__ == "__main__":
    test_full_itinerary_flow()
