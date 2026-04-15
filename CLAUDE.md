# Project Instructions

## Overview
GKLab — Professional goalkeeper training planner (UEFA A standards). React SPA with Supabase backend.

## Tech Stack
- TypeScript ~5.8, React 19, Vite 6, Tailwind CSS 4
- Supabase (PostgreSQL) for persistence, localStorage as offline fallback
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
- `src/App.tsx` — Thin shell (~230 lines), composes layout + tabs + modals
- `src/components/layout/` — AppLayout, Sidebar, Header
- `src/components/tabs/` — DashboardTab, TrainingTab, ExercisesTab, PlanningTab, GoalkeepersTab, VideosTab, SupportTab
- `src/components/forms/` — DrillForm (reusable), LibraryPickerModal
- `src/components/cards/` — GoalkeeperCard, VideoCard
- `src/components/ui/` — SidebarItem, Section, QuickSelect, Field
- `src/hooks/useAppData.ts` — Central CRUD hook (Supabase + localStorage dual persistence)
- `src/hooks/useSessionForm.ts` — Session creation form state and logic
- `src/hooks/useMicrocycle.ts` — Microcycle planner state and logic
- `src/hooks/useAttendance.ts` — Attendance tracking (with offline fallback)
- `src/hooks/useCustomPresets.ts` — Custom user presets management
- `src/hooks/useTranslation.tsx` — i18n context provider
- `src/types.ts` — All shared TypeScript interfaces
- `src/translations.ts` — i18n strings (PT/EN/DE)
- `src/data/` — Presets, session templates, objective mappings
- `src/lib/utils.ts` — Shared utilities (cn, getTodayDateString, videoStatusBadgeClass, category/status labels)
- `src/lib/supabase.ts` — Supabase client
- `src/lib/exportSession.ts` — PDF export utility
- `supabase/migrations/` — SQL migrations (5 files)
- `public/elements/` — Equipment sprites for tactical board
- `public/fields/` — Field background images
- `public/tools/` — Drawing tool icons

## Build & Run
- Dev: `npm run dev` (port 3001)
- Build: `npm run build`
- Lint: `npm run lint` (tsc --noEmit)

## Database
- 4 tables: goalkeepers, sessions, exercises, videos
- RLS enabled, currently with public read/write policies (no auth)
- Some Goalkeeper fields (birthDate, height, weight, membership, trial*) are localStorage-only

## Conventions
- Conventional commits: `feat:`, `fix:`, `chore:`
- No test framework configured yet
- No client-side router — tab navigation via React state
- Path alias: `@` → `src/`
- All modals have Escape-to-close, role="dialog", and aria-modal="true"
- Delete operations require window.confirm() before executing
- Mobile bottom nav includes "More" menu for secondary tabs
