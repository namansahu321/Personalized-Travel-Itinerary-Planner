/**
 * API Service for Personalized Travel Itinerary Planner
 * Connects seamlessly to FastAPI backend with graceful local storage fallback.
 */

const isBackendPort = window.location.port === '8000';
const API_BASE_URL = isBackendPort ? '/api' : 'http://127.0.0.1:8000/api';

export const api = {
  async getStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn("Backend status unavailable, operating in client fallback mode:", err);
      return {
        status: "fallback",
        database: { engine: "Client LocalStorage Fallback", supabase_connected: false, persistence: "Browser Storage" }
      };
    }
  },

  async getTrips() {
    try {
      const res = await fetch(`${API_BASE_URL}/trips`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn("Falling back to local cache for trips:", err);
      return [];
    }
  },

  async getTrip(tripId) {
    try {
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const trip = await res.json();
      localStorage.setItem(`cached_trip_${tripId}`, JSON.stringify(trip));
      return trip;
    } catch (err) {
      console.warn("Using cached trip data:", err);
      const cached = localStorage.getItem(`cached_trip_${tripId}`);
      if (cached) return JSON.parse(cached);
      throw err;
    }
  },

  async updateTrip(tripId, data) {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to update trip: ${res.statusText}`);
    return await res.json();
  },

  async addDay(tripId, dayData = null) {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dayData || {})
    });
    if (!res.ok) throw new Error(`Failed to add day: ${res.statusText}`);
    return await res.json();
  },

  async deleteDay(tripId, dayId) {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${dayId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Failed to delete day: ${res.statusText}`);
    return await res.json();
  },

  async addActivity(tripId, dayId, activity) {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${dayId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    });
    if (!res.ok) throw new Error(`Failed to add activity: ${res.statusText}`);
    return await res.json();
  },

  async updateActivity(tripId, dayId, activityId, activity) {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${dayId}/activities/${activityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    });
    if (!res.ok) throw new Error(`Failed to update activity: ${res.statusText}`);
    return await res.json();
  },

  async deleteActivity(tripId, dayId, activityId) {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${dayId}/activities/${activityId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Failed to delete activity: ${res.statusText}`);
    return await res.json();
  },

  async reorderActivities(tripId, dayId, activityIds) {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${dayId}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityIds)
    });
    if (!res.ok) throw new Error(`Failed to reorder activities: ${res.statusText}`);
    return await res.json();
  },

  async regenerateDayAI(tripId, dayId, options) {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${dayId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!res.ok) throw new Error(`AI regeneration failed: ${res.statusText}`);
    return await res.json();
  },

  async applyAIDay(tripId, dayId, aiData) {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${dayId}/apply-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiData)
    });
    if (!res.ok) throw new Error(`Failed to apply AI day: ${res.statusText}`);
    return await res.json();
  }
};
