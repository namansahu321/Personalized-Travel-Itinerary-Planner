-- Supabase Database Schema for Personalized Travel Itinerary Planner
-- Compatible with Supabase Postgres, RLS, and Auth

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    country TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    travelers_count INTEGER DEFAULT 1,
    travel_style TEXT DEFAULT 'Balanced Exploration',
    total_budget NUMERIC(10, 2) DEFAULT 0.00,
    accommodation_budget NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ITINERARY DAYS TABLE
CREATE TABLE IF NOT EXISTS public.itinerary_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    theme TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(trip_id, day_number)
);

-- 3. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration TEXT NOT NULL,
    description TEXT,
    cost NUMERIC(10, 2) DEFAULT 0.00,
    category TEXT DEFAULT 'Sightseeing',
    image_url TEXT,
    transport_to_next JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES for fast lookup
CREATE INDEX IF NOT EXISTS idx_trips_user ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_days_trip ON public.itinerary_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_day ON public.activities(day_id);
CREATE INDEX IF NOT EXISTS idx_activities_order ON public.activities(day_id, "order");

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Trip Policies: Users can view and manage their own trips
CREATE POLICY "Users can manage own trips" ON public.trips
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Day Policies: Users can access days belonging to their trips
CREATE POLICY "Users can manage own itinerary days" ON public.itinerary_days
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = itinerary_days.trip_id
            AND trips.user_id = auth.uid()
        )
    );

-- Activity Policies: Users can access activities belonging to their trip days
CREATE POLICY "Users can manage own activities" ON public.activities
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.itinerary_days
            JOIN public.trips ON trips.id = itinerary_days.trip_id
            WHERE itinerary_days.id = activities.day_id
            AND trips.user_id = auth.uid()
        )
    );
