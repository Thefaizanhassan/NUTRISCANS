# Nutri Scans

Nutri Scans is a nutrition-tracking web application that helps users scan meals, estimate nutritional values, log manual meals, monitor progress against goals, and review weekly health insights backed by Supabase.

---

## One-line Summary

Nutri Scans is a React and Supabase powered nutrition companion that combines AI-style meal analysis, manual meal logging, profile-aware tracking, and weekly insight dashboards in a single mobile-friendly experience.

---

## UI Preview

Screenshot placeholders can be added later in a `docs/assets/` folder.

- Authentication screen
  Email sign-up, email sign-in, and optional Google sign-in
- Dashboard
  Daily calorie ring, macro cards, quick log actions, and nutrition signals
- Scan flow
  Image capture, context input, meal-type selection, and results review
- History
  Search, meal filters, AI/manual entry filters, and detailed scan review
- Insights
  Weekly calorie trends, meal distribution, consistency metrics, and recommendations
- Profile
  Body metrics, goal management, dietary preferences, persisted app settings, and sign out

---

## Core Features

- Email/password authentication with Supabase Auth
- Optional Google OAuth sign-in
- Secure sign out with session reset handling
- AI-style meal scan flow with captured context and confidence scoring
- Manual meal logging for quick entries without image upload
- Daily macro tracking for calories, protein, carbs, fat, fibre, sugar, sodium, and saturated fat
- Weekly insights using stored summaries plus scan-history fallback
- History filtering by meal type and AI/manual entry type
- Rich scan detail modal with confidence, model metadata, processing time, and nutrient progress
- Profile-aware settings for age, height, weight, activity level, theme, unit system, and notifications
- CSV export of nutrition history
- Supabase-backed persistence for profiles, scans, food items, daily summaries, and storage uploads

---

## Data Now Surfaced From The Schema

The application now surfaces several fields that were previously stored but unused or mostly hidden:

- `profiles.height_cm`
- `profiles.weight_kg`
- `profiles.age`
- `profiles.activity_level`
- `profiles.unit_system`
- `profiles.theme`
- `profiles.notifications_daily_reminder`
- `profiles.notifications_weekly_summary`
- `scans.is_manual_entry`
- `scans.model_used`
- `scans.processing_time_ms`
- `scans.total_sugar`
- `scans.total_sodium`
- `scans.total_saturated_fat`
- `food_items.portion_grams` when available
- `daily_summaries.scan_count`
- `daily_summaries.goal_*_pct`

---

## Technical Stack

- Frontend: React 19, TypeScript, Vite 6
- Routing: React Router 7
- State Management: Zustand with Immer
- Styling: Tailwind CSS 4, Base UI, shadcn-style components
- Animation: Motion / Framer Motion
- Charts: Recharts
- Backend: Supabase Auth, Postgres, Storage, RLS
- Utilities: date-fns, Sonner, clsx, tailwind-merge

---

## Project Structure

```text
nutriscans/
|
|-- src/
|   |-- components/              Reusable app components
|   |-- hooks/                   Shared hooks
|   |-- lib/                     Utilities, mock data, Supabase helpers
|   |   |-- supabase/
|   |       |-- api.ts           Database and storage operations
|   |       |-- client.ts        Browser Supabase client
|   |       |-- server.ts        SSR-compatible client helper
|   |-- pages/                   Route-level screens
|   |-- store/                   Zustand store and derived helpers
|   |-- types/                   Shared TypeScript types
|   |-- App.tsx                  App shell and routing
|   |-- main.tsx                 Entry point
|   |-- index.css                Global styling and theme tokens
|
|-- components/ui/               Shared UI primitives
|-- supabase/migrations/         Database and storage migrations
|-- README.md
|-- PROJECT_REPORT.md
|-- package.json
|-- vite.config.ts
```

---

## Architecture Overview

### Frontend Flow

1. Users authenticate through Supabase Auth.
2. The app hydrates profile and scan history into the Zustand store.
3. Scans can be created through the camera/upload flow or manual logging.
4. Scan results are stored in `scans` and `food_items`.
5. Weekly insights are rendered from `daily_summaries` when present, with a scan-history fallback for resilience.

### Persistence Model

- `profiles`
  Stores user identity metadata, daily goals, body metrics, theme, unit preference, and notification settings
- `scans`
  Stores each meal scan or manual log, total nutrient values, confidence, model metadata, and processing timing
- `food_items`
  Stores per-item nutrition rows for each scan
- `daily_summaries`
  Stores pre-aggregated daily totals and goal percentages
- `storage.objects`
  Stores uploaded meal images in the `scan-images` bucket

---

## Setup And Installation

### Prerequisites

- Node.js 20 or newer
- A Supabase project

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Apply Supabase Migrations

Run the SQL from the following files in order:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_daily_summary_sync.sql`
- `supabase/migrations/003_storage_bucket_setup.sql`

If you use the Supabase CLI, you can push the migrations directly. If not, copy each file into the Supabase SQL Editor and run them in sequence.

### 4. Configure Supabase Auth

Enable the providers you need in Supabase Auth:

- Email
- Google (optional)

Set the following in Supabase Auth settings:

- Site URL: `http://localhost:3000`
- Redirect URLs:
  - `http://localhost:3000`
  - Your production domain, if applicable

If email confirmation is enabled, new users must confirm their email before signing in.

### 5. Start The Development Server

```bash
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

---

## Storage Requirements

The application uploads meal images to a Supabase Storage bucket named `scan-images`.

This is now included in `003_storage_bucket_setup.sql`, along with authenticated upload, update, and delete policies scoped to the signed-in user.

---

## Usage Guide

### Authentication

- Create an account using email and password
- Sign in with email and password
- Optionally sign in with Google
- Sign out from the sidebar or profile page

### Scanning A Meal

1. Go to the Scan page
2. Capture or upload a meal image
3. Add optional context such as cooking style or ingredients
4. Select the meal type
5. Review the generated result
6. Save it to your history

### Manual Logging

1. Open the Dashboard
2. Click `Quick Log`
3. Enter the meal name and nutrition values
4. Save the manual entry

### Reviewing Progress

- Dashboard shows daily totals, macro progress, and sugar/sodium/saturated fat watchpoints
- History shows searchable and filterable entries
- Insights shows weekly trends, meal distribution, consistency, and profile signals
- Profile lets users manage goals, health details, preferences, notifications, and exports

---

## API And Data Layer Notes

The app uses Supabase directly from `src/lib/supabase/api.ts`.

### Key Operations

- `ensureProfile(user)`
  Ensures every authenticated user has a `profiles` row
- `getProfile(userId)`
  Loads the authenticated user profile
- `updateProfile(userId, data)`
  Persists profile and preference updates
- `updateDailyGoals(userId, goals)`
  Updates calorie and macro goals
- `createScan(input)`
  Creates a scan and associated food item rows
- `getUserScans(userId, options)`
  Loads scan history
- `deleteScan(scanId)`
  Deletes a scan and associated storage image if present
- `clearUserScans(userId)`
  Clears the user's history
- `getDailySummary(userId, date)`
  Fetches one aggregated daily summary
- `getWeeklySummaries(userId)`
  Fetches recent daily summaries for charts and insights
- `uploadScanImage(userId, file)`
  Uploads images to Supabase Storage

---

## Build And Verification

Run the following checks:

```bash
npm run lint
npm run build
```

---

## Production Notes

- Apply all three Supabase migrations before deploying
- Confirm Auth redirect URLs for both local and production environments
- Keep the `scan-images` bucket configured
- If you want branded confirmation emails or password reset flows, configure SMTP in Supabase Auth
- Daily summaries are maintained by trigger logic in `002_daily_summary_sync.sql`

---

## Future Enhancements

- Real AI nutrition analysis instead of mock scan generation
- Password reset and email change flows
- Barcode scanning and OCR-based food recognition
- Push notifications based on stored notification preferences
- Better analytics around sodium, sugar, and meal timing
- PDF exports using the already installed PDF dependencies
- Meal editing with nutrient recalculation
- Admin or nutritionist review tools for higher-confidence recommendations

---

## Project Report

A detailed project report for this application is available in:

- [PROJECT_REPORT.md](/Users/faizanhassan/MajorProjects/Nutri_Scans/nutriscans/PROJECT_REPORT.md)
