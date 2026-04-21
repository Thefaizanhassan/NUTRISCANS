-- ==========================================
-- 001_initial_schema.sql
-- Initial database schema for Nutri Scans
-- ==========================================

-- 4a. Custom Types
-- Enum for meal types
CREATE TYPE meal_type AS ENUM (
  'breakfast', 
  'lunch', 
  'dinner', 
  'snack'
);

-- Enum for dietary preferences
CREATE TYPE dietary_preference AS ENUM (
  'vegetarian', 
  'vegan', 
  'keto', 
  'low_carb', 
  'gluten_free', 
  'dairy_free', 
  'halal', 
  'none'
);

-- Enum for unit systems
CREATE TYPE unit_system AS ENUM (
  'metric', 
  'imperial'
);

-- Enum for theme preferences
CREATE TYPE theme_preference AS ENUM (
  'light', 
  'dark', 
  'system'
);

-- 4b. Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'User',
  avatar_url TEXT,
  
  -- Daily nutrition goals
  goal_calories INTEGER NOT NULL DEFAULT 2000,
  goal_protein INTEGER NOT NULL DEFAULT 150,
  goal_carbs INTEGER NOT NULL DEFAULT 250,
  goal_fat INTEGER NOT NULL DEFAULT 65,
  goal_fibre INTEGER NOT NULL DEFAULT 30,
  
  -- Body metrics (optional)
  height_cm NUMERIC(5,1),
  weight_kg NUMERIC(5,1),
  age INTEGER,
  activity_level TEXT DEFAULT 'moderate' 
    CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  
  -- Preferences
  dietary_preferences dietary_preference[] DEFAULT ARRAY['none']::dietary_preference[],
  unit_system unit_system NOT NULL DEFAULT 'metric',
  theme theme_preference NOT NULL DEFAULT 'system',
  notifications_daily_reminder BOOLEAN NOT NULL DEFAULT true,
  notifications_weekly_summary BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users cannot delete their profile directly"
  ON public.profiles FOR DELETE
  USING (false);
  -- Profile deletion handled via cascade from auth.users

-- 4c. Scans Table (Primary scan records)
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Image data
  image_url TEXT,
  image_storage_path TEXT,
  
  -- Context
  context_text TEXT CHECK (char_length(context_text) <= 500),
  meal_type meal_type NOT NULL DEFAULT 'snack',
  
  -- Total nutrition (aggregated from all food items)
  total_calories NUMERIC(7,1) NOT NULL DEFAULT 0,
  total_protein NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_carbs NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_fat NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_fibre NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_sugar NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_sodium NUMERIC(7,1) NOT NULL DEFAULT 0,
  total_saturated_fat NUMERIC(6,1) NOT NULL DEFAULT 0,
  
  -- AI metadata
  overall_confidence NUMERIC(5,2) DEFAULT 0 
    CHECK (overall_confidence >= 0 AND overall_confidence <= 100),
  model_used TEXT DEFAULT 'gemini-1.5-flash',
  is_manual_entry BOOLEAN NOT NULL DEFAULT false,
  
  -- Processing
  processing_time_ms INTEGER,
  raw_ai_response JSONB,
  
  -- Timestamps
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_scans_user_id ON public.scans(user_id);
CREATE INDEX idx_scans_scanned_at ON public.scans(scanned_at DESC);
CREATE INDEX idx_scans_user_date ON public.scans(user_id, scanned_at DESC);
CREATE INDEX idx_scans_meal_type ON public.scans(user_id, meal_type);

-- RLS
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scans"
  ON public.scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
  ON public.scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans"
  ON public.scans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
  ON public.scans FOR DELETE
  USING (auth.uid() = user_id);

-- 4d. Food Items Table (Individual items within a scan)
CREATE TABLE public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Food identification
  name TEXT NOT NULL,
  portion_size TEXT,
  portion_grams NUMERIC(6,1),
  
  -- Nutrition per item
  calories NUMERIC(7,1) NOT NULL DEFAULT 0,
  protein NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat NUMERIC(6,1) NOT NULL DEFAULT 0,
  fibre NUMERIC(6,1) NOT NULL DEFAULT 0,
  sugar NUMERIC(6,1) NOT NULL DEFAULT 0,
  sodium NUMERIC(7,1) NOT NULL DEFAULT 0,
  saturated_fat NUMERIC(6,1) NOT NULL DEFAULT 0,
  
  -- Confidence for this specific item
  confidence NUMERIC(5,2) DEFAULT 0 
    CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Ordering within the scan
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_food_items_scan_id ON public.food_items(scan_id);
CREATE INDEX idx_food_items_user_id ON public.food_items(user_id);

-- RLS
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own food items"
  ON public.food_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food items"
  ON public.food_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food items"
  ON public.food_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food items"
  ON public.food_items FOR DELETE
  USING (auth.uid() = user_id);

-- 4e. Daily Summaries Table (Pre-aggregated daily stats)
CREATE TABLE public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  
  -- Aggregated totals
  total_calories NUMERIC(7,1) NOT NULL DEFAULT 0,
  total_protein NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_carbs NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_fat NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_fibre NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_sugar NUMERIC(6,1) NOT NULL DEFAULT 0,
  total_sodium NUMERIC(7,1) NOT NULL DEFAULT 0,
  
  -- Metadata
  scan_count INTEGER NOT NULL DEFAULT 0,
  
  -- Goal progress (percentage 0-100+)
  goal_calories_pct NUMERIC(5,1) DEFAULT 0,
  goal_protein_pct NUMERIC(5,1) DEFAULT 0,
  goal_carbs_pct NUMERIC(5,1) DEFAULT 0,
  goal_fat_pct NUMERIC(5,1) DEFAULT 0,
  goal_fibre_pct NUMERIC(5,1) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure one summary per user per day
  UNIQUE(user_id, summary_date)
);

-- Indexes
CREATE INDEX idx_daily_summaries_user_date 
  ON public.daily_summaries(user_id, summary_date DESC);

-- RLS
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily summaries"
  ON public.daily_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily summaries"
  ON public.daily_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily summaries"
  ON public.daily_summaries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily summaries"
  ON public.daily_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- 4f. Database Functions & Triggers

-- Auto-update the `updated_at` timestamp on any row modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS 
$$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_scans_updated_at
  BEFORE UPDATE ON public.scans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_daily_summaries_updated_at
  BEFORE UPDATE ON public.daily_summaries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create a profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS 
$$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 
             NEW.raw_user_meta_data->>'name', 
             'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to recalculate daily summary for a given user and date
CREATE OR REPLACE FUNCTION public.recalculate_daily_summary(
  p_user_id UUID,
  p_date DATE
)
RETURNS VOID AS 
$$
DECLARE
  v_goals RECORD;
BEGIN
  -- Fetch user goals
  SELECT goal_calories, goal_protein, goal_carbs, goal_fat, goal_fibre
  INTO v_goals
  FROM public.profiles
  WHERE id = p_user_id;

  INSERT INTO public.daily_summaries (
    user_id, summary_date,
    total_calories, total_protein, total_carbs, total_fat,
    total_fibre, total_sugar, total_sodium,
    scan_count,
    goal_calories_pct, goal_protein_pct, goal_carbs_pct,
    goal_fat_pct, goal_fibre_pct
  )
  SELECT
    p_user_id,
    p_date,
    COALESCE(SUM(total_calories), 0),
    COALESCE(SUM(total_protein), 0),
    COALESCE(SUM(total_carbs), 0),
    COALESCE(SUM(total_fat), 0),
    COALESCE(SUM(total_fibre), 0),
    COALESCE(SUM(total_sugar), 0),
    COALESCE(SUM(total_sodium), 0),
    COUNT(*),
    CASE WHEN v_goals.goal_calories > 0 
      THEN ROUND((COALESCE(SUM(total_calories),0) / v_goals.goal_calories) * 100, 1) 
      ELSE 0 END,
    CASE WHEN v_goals.goal_protein > 0 
      THEN ROUND((COALESCE(SUM(total_protein),0) / v_goals.goal_protein) * 100, 1) 
      ELSE 0 END,
    CASE WHEN v_goals.goal_carbs > 0 
      THEN ROUND((COALESCE(SUM(total_carbs),0) / v_goals.goal_carbs) * 100, 1) 
      ELSE 0 END,
    CASE WHEN v_goals.goal_fat > 0 
      THEN ROUND((COALESCE(SUM(total_fat),0) / v_goals.goal_fat) * 100, 1) 
      ELSE 0 END,
    CASE WHEN v_goals.goal_fibre > 0 
      THEN ROUND((COALESCE(SUM(total_fibre),0) / v_goals.goal_fibre) * 100, 1) 
      ELSE 0 END
  FROM public.scans
  WHERE user_id = p_user_id
    AND DATE(scanned_at) = p_date
  ON CONFLICT (user_id, summary_date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fat = EXCLUDED.total_fat,
    total_fibre = EXCLUDED.total_fibre,
    total_sugar = EXCLUDED.total_sugar,
    total_sodium = EXCLUDED.total_sodium,
    scan_count = EXCLUDED.scan_count,
    goal_calories_pct = EXCLUDED.goal_calories_pct,
    goal_protein_pct = EXCLUDED.goal_protein_pct,
    goal_carbs_pct = EXCLUDED.goal_carbs_pct,
    goal_fat_pct = EXCLUDED.goal_fat_pct,
    goal_fibre_pct = EXCLUDED.goal_fibre_pct,
    updated_at = now();
END;
$$
 LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-recalculate daily summary when a scan is added, 
-- updated, or deleted
CREATE OR REPLACE FUNCTION public.trigger_recalculate_summary()
RETURNS TRIGGER AS 
$$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_daily_summary(
      OLD.user_id, DATE(OLD.scanned_at)
    );
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_daily_summary(
      NEW.user_id, DATE(NEW.scanned_at)
    );
    RETURN NEW;
  END IF;
END;
$$
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER recalculate_summary_on_scan_change
  AFTER INSERT OR UPDATE OR DELETE ON public.scans
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_summary();

-- 4g. Supabase Storage Bucket
-- Run this via the Supabase Dashboard → Storage → Create Bucket
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scan-images',
  'scan-images',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- Storage RLS policies
CREATE POLICY "Users can upload their own scan images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'scan-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own scan images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'scan-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own scan images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'scan-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
