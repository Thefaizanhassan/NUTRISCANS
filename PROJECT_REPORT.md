# Project Report

## Nutri Scans

Prepared for the Nutri Scans application as a structured project report covering objectives, architecture, implementation, outcomes, and future scope.

---

## Table Of Contents

1. Introduction
2. Objectives
3. Problem Statement
4. Methodology And System Architecture
5. Implementation Details
6. Technologies Used
7. Results And Outputs
8. Challenges Faced
9. Future Scope
10. Conclusion

---

## 1. Introduction

Nutri Scans is a nutrition-tracking application designed to simplify meal logging and improve nutritional awareness through a modern, mobile-friendly interface. The system combines meal scanning, manual nutrition logging, goal tracking, and weekly insights in a single user experience backed by Supabase for authentication, storage, and persistence.

The project was developed to address a common problem in personal nutrition tools: many applications either require tedious manual entry or provide shallow reporting after the meal is logged. Nutri Scans aims to bridge that gap by offering a lightweight scan flow, a manual quick-log fallback, richer nutritional context, and a profile-aware experience that evolves with the user's data.

The latest iteration of the project extends the original application by improving authentication, adding secure sign-out handling, surfacing previously unused schema data, and introducing stronger insight and profile management capabilities.

---

## 2. Objectives

The major objectives of the project are:

- To provide a simple and intuitive interface for logging meals
- To reduce friction in nutrition tracking using image-based scan flows and manual quick entry
- To persist nutrition history securely per user
- To help users compare intake against configurable daily nutrition goals
- To generate useful weekly insight summaries from stored scan data
- To expose profile and settings data in ways that improve personalization
- To maintain a production-oriented architecture using Supabase Auth, Postgres, Storage, and Row-Level Security

---

## 3. Problem Statement

Nutrition tracking applications often suffer from one or more of the following issues:

- Manual data entry is slow and discourages consistent use
- Logged data is stored, but not transformed into meaningful insights
- Users are shown calories and macros only, while other important nutrients such as sugar, sodium, and saturated fat remain hidden
- Profile information such as body metrics, activity level, unit preferences, and notification preferences are frequently stored but not actually used inside the product
- Authentication flows may support login, but lack complete session handling features such as secure sign-out and session-safe UI reset

Nutri Scans was built to address these issues by combining a friction-reducing meal logging workflow with a structured nutrition dashboard, meaningful history exploration, and profile-backed personalization.

---

## 4. Methodology And System Architecture

### 4.1 Development Approach

The project follows a frontend-first product workflow with persistent backend support. The methodology emphasizes:

- Strong typing through TypeScript
- Modular React component design
- Centralized client-state management with Zustand
- Supabase-driven authentication and persistence
- Progressive enhancement of stored data into user-facing insights

### 4.2 System Architecture

The system is organized into four major layers:

#### Presentation Layer

Implemented using React, route-based pages, reusable UI primitives, and Tailwind CSS. This layer includes:

- Authentication interface
- Dashboard
- Scan page
- Results page
- History page
- Insights page
- Profile page

#### State Layer

Zustand is used as the central application store. It handles:

- Hydration of user profile and scan history
- Current scan state
- Goal updates
- Profile updates
- History clearing
- Sign-out state reset

#### Data Layer

Supabase handles:

- Authentication
- Persistent Postgres tables
- Storage for uploaded scan images
- Auth-scoped row access through RLS

#### Summary Layer

The project includes a daily summary synchronization mechanism that aggregates scan data into `daily_summaries`. This improves weekly insights and chart performance while preserving a fallback path based on live scan history.

### 4.3 Database Architecture

The main schema consists of:

- `profiles`
  Stores user identity metadata, goals, health profile fields, theme, unit system, and notification preferences
- `scans`
  Stores scan-level nutrition totals, confidence, source metadata, processing time, and timestamps
- `food_items`
  Stores item-level nutrition rows linked to scans
- `daily_summaries`
  Stores aggregated daily totals and goal percentages

### 4.4 Storage Architecture

Uploaded meal images are stored in the `scan-images` bucket. Image paths are namespaced by user ID to support authenticated access control and safe deletion.

### 4.5 Security Model

Security is enforced using:

- Supabase Auth sessions
- Per-user row ownership via RLS policies
- Auth-scoped insert, update, select, and delete access
- User-scoped storage object policies for uploaded images

---

## 5. Implementation Details

### 5.1 Authentication Enhancement

The authentication module was expanded to support:

- Email sign-up
- Email sign-in
- Optional Google sign-in
- Fully functional sign-out

The sign-out implementation resets client state and invalidates the Supabase session. This prevents stale data from remaining visible after logout and keeps the application consistent across route changes and auth listener updates.

### 5.2 Profile Bootstrapping

To improve resilience, a profile bootstrap mechanism was added. If an authenticated user exists in Supabase Auth but a corresponding `profiles` row is missing, the system creates the profile automatically using available user metadata.

### 5.3 Richer Profile Usage

Several database-backed profile fields that were previously unused were integrated into the UI:

- Height
- Weight
- Age
- Activity level
- Unit system
- Theme preference
- Daily reminder preference
- Weekly summary preference

These fields are now surfaced in the Profile page and contribute to calculated values such as BMI and profile completeness.

### 5.4 Scan Metadata Exposure

Scan-level metadata was extended in the application layer to surface:

- Entry source: AI scan or manual log
- Model used
- Processing time
- Confidence score

These values are now visible in history cards, scan detail views, and analytics.

### 5.5 Dashboard Improvements

The Dashboard now includes:

- Quick actions for scan flow and manual quick log
- Nutrition signals for sugar, sodium, and saturated fat
- Real streak calculation from stored history
- Persistent scan detail and quick-log pathways

### 5.6 History Page Improvements

The History page was upgraded with:

- Search across meal names, context, and model metadata
- Filters for meal type
- Filters for AI scans vs manual logs
- Summary cards for total scans, manual entries, and average confidence
- Richer card metadata including sodium and scan source

### 5.7 Insight Engine Improvements

The Insights page now combines:

- Weekly calorie trends
- Meal-type distribution
- Goal consistency tracking
- Average sugar and sodium watchpoints
- Profile-based metrics such as activity level and BMI
- Dynamic recommendation cards derived from recent intake patterns

The page uses `daily_summaries` when available and falls back to scan-history aggregation when summary data is absent.

### 5.8 Database Synchronization Enhancements

Two important migrations were added:

- `002_daily_summary_sync.sql`
  Keeps `daily_summaries` synchronized with scan inserts, updates, deletes, and goal changes
- `003_storage_bucket_setup.sql`
  Creates the `scan-images` bucket and adds user-scoped storage policies

These changes improve performance, data consistency, and deployment reliability.

---

## 6. Technologies Used

### Frontend

- React 19
- TypeScript
- Vite 6
- React Router 7
- Tailwind CSS 4
- Base UI / shadcn-style component primitives
- Motion / Framer Motion
- Recharts

### State And Utility Layer

- Zustand
- Immer
- date-fns
- Sonner

### Backend And Persistence

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Row-Level Security

### Supporting Libraries

- Lucide React
- clsx
- tailwind-merge

---

## 7. Results And Outputs

The resulting application now provides a more complete and production-aligned experience.

### Functional Outcomes

- Users can sign up, sign in, and sign out safely
- Session transitions reset the UI correctly
- Manual logging and AI-style scan flows both work as valid entry paths
- Previously unused profile and scan fields now contribute to the user experience
- Weekly summaries are available for charting and analytics
- Insights are more actionable and data-driven

### User-Facing Outputs

- Dashboard with daily nutrition status and quick actions
- History page with filters and richer metadata
- Insights page with charts and recommendations
- Profile page with health metrics, preferences, and sign-out access
- CSV export for personal data portability

### Verification Outcome

The updated codebase was verified using:

- `npm run lint`
- `npm run build`

Both checks pass successfully after the implemented changes.

---

## 8. Challenges Faced

### 8.1 Incomplete Utilization Of Existing Schema

One major challenge was that the database already contained useful fields, but the frontend did not consume them. This required coordinated updates across types, API mapping, store state, UI screens, and summary logic.

### 8.2 Session And Logout Consistency

Adding sign-out is not only a UI change. The challenge was ensuring that the local store, route state, and Supabase session all remained synchronized after logout, especially when leaving mid-workflow.

### 8.3 Summary Aggregation

The `daily_summaries` table existed but was not kept in sync automatically. This limited its usefulness. A trigger-driven synchronization strategy was introduced to make the table operational rather than decorative.

### 8.4 Storage Setup Gap

The application depended on image uploads, but storage bucket configuration was not previously defined as code. This created deployment risk. A dedicated migration was added to codify the bucket and policies.

### 8.5 Balancing Simplicity With Depth

Another challenge was enhancing the product without overloading the interface. The final approach focused on progressive disclosure: high-level summaries first, deeper detail on History, Insights, and Profile screens.

---

## 9. Future Scope

The project can be extended in several meaningful directions:

- Real AI model integration for meal understanding instead of mock scan generation
- Password reset and account recovery workflows
- Image OCR and barcode scanning
- Editable scan results with item recalculation
- PDF report exports
- Nutrition scoring models for meal quality
- Push and email reminders driven by stored notification preferences
- Personalized recommendations using a richer health model
- Better storage and presentation of raw model outputs for auditing
- Admin analytics for product monitoring and confidence tracking

---

## 10. Conclusion

Nutri Scans demonstrates how a modern nutrition application can move beyond simple calorie logging into a richer, more personalized, and more usable experience. The project combines secure authentication, structured persistence, nutrition-aware UI design, and practical analytics in a cohesive system.

The latest improvements make the application more complete in three important ways:

- Authentication is stronger because the product now supports full sign-in, sign-up, and sign-out behavior
- Stored data is more valuable because previously hidden profile and scan fields are now surfaced meaningfully
- The project is more deployment-ready because database summary synchronization and storage bucket configuration are now codified in migrations

Overall, the project achieves its core purpose: helping users log meals, understand intake patterns, and engage with their nutrition data more effectively through a clean and scalable architecture.
