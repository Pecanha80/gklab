# Project Instructions

## Overview
GKLab — Professional goalkeeper training planner (UEFA A standards). React SPA with Supabase backend.

## Tech Stack
- TypeScript ~5.8, React 19, Vite 6, Tailwind CSS 4
- Supabase (PostgreSQL) for persistence + Supabase Auth for authentication
- Konva/react-konva for tactical board canvas
- Motion (framer-motion) for animations
- html2canvas + jsPDF for PDF export
- lucide-react for icons
- i18n: custom context-based (PT/EN/DE) via `useTranslation()`

## Code Style
- Components: PascalCase files in `src/components/`
- Hooks: camelCase with `use` prefix in `src/hooks/`
- Always use translation keys via `t('key')`, never hardcoded user-facing strings
- Tailwind utility classes; custom theme vars defined in `src/index.css`
- Data fields that accept multiple values use `string | string[]` union types

## Project Structure
- `src/App.tsx` — Thin shell, composes auth gate + layout + tabs + modals
- `src/components/AuthPage.tsx` — Login/register page (email/password)
- `src/components/layout/` — AppLayout, Sidebar, Header
- `src/components/tabs/` — DashboardTab, TrainingTab, ExercisesTab, PlanningTab, GoalkeepersTab, MethodologyTab, WellnessTab, RPETab, VideosTab, SupportTab
- `src/components/forms/` — DrillForm (reusable), LibraryPickerModal
- `src/components/cards/` — GoalkeeperCard, VideoCard
- `src/components/ui/` — SidebarItem, Section, QuickSelect, Field
- `src/hooks/useAuth.tsx` — Auth context provider (Supabase Auth)
- `src/hooks/useAppData.ts` — Central CRUD hook (Supabase-only, user-scoped)
- `src/hooks/useSessionForm.ts` — Session creation form state and logic
- `src/hooks/useMicrocycle.ts` — Microcycle planner state and logic (localStorage)
- `src/hooks/useAttendance.ts` — Attendance tracking (Supabase-only)
- `src/hooks/useWellness.ts` — Wellness log management (Supabase-only)
- `src/hooks/useMethodology.ts` — Methodology data management (Supabase-only)
- `src/hooks/useGoalkeeperMetrics.ts` — GK metrics calculation (Supabase-only)
- `src/hooks/useCustomPresets.ts` — Custom user presets management (localStorage)
- `src/hooks/useTranslation.tsx` — i18n context provider
- `src/types.ts` — All shared TypeScript interfaces
- `src/translations.ts` — i18n strings (PT/EN)
- `src/data/` — Presets, session templates, objective mappings
- `src/lib/utils.ts` — Shared utilities (cn, getTodayDateString, videoStatusBadgeClass, category/status labels)
- `src/lib/supabase.ts` — Supabase client (required, no fallback)
- `src/lib/exportSession.ts` — PDF export utility
- `supabase/migrations/` — SQL migrations (7 files)
- `public/elements/` — Equipment sprites for tactical board
- `public/fields/` — Field background images
- `public/tools/` — Drawing tool icons

## Build & Run
- Dev: `npm run dev` (port 3001)
- Build: `npm run build`
- Lint: `npm run lint` (tsc --noEmit)

## Authentication
- Supabase Auth with email/password sign-up and sign-in
- AuthProvider wraps the entire app in `main.tsx`
- All data hooks receive `user` from `useAuth()` and include `user_id` in inserts
- RLS policies scope all rows to `auth.uid() = user_id`
- Unauthenticated users see the AuthPage (login/register)

## Database
- 7 tables: goalkeepers, sessions, exercises, videos, attendance, wellness_logs, methodology
- All tables have `user_id` column referencing `auth.users(id)`
- RLS enabled, policies scope to authenticated user (`auth.uid()`)
- Supabase environment variables are required (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

## Conventions
- Conventional commits: `feat:`, `fix:`, `chore:`
- No test framework configured yet
- No client-side router — tab navigation via React state
- Path alias: `@` → `src/`
- All modals have Escape-to-close, role="dialog", and aria-modal="true"
- Delete operations require window.confirm() before executing
- Mobile bottom nav includes "More" menu for secondary tabs
- All data persistence goes through Supabase (no localStorage for data)
- localStorage only for user preferences (language, presets, microcycle planning)
