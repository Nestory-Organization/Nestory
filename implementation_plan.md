# Nestory — Full UI Enhancement on Google Stitch

## Overview
Nestory is a family-focused reading management platform for children and parents. The current Stitch project (`15366952300394253472`) contains 5 screens at a baseline quality. This plan fully enhances all existing screens and generates 5 new ones to complete the user journey, applying a consistent, premium, playful-but-refined design system.

---

## Step 1 — Design System Update

Update the existing design system to reflect a **"Warm Library"** aesthetic:

| Token | Value |
|-------|-------|
| **Primary** | `#E84A5F` (vibrant rose-red) |
| **Secondary** | `#5DA9E9` (sky blue) |
| **Tertiary** | `#66BB6A` (leaf green — for progress/gamification) |
| **Background** | `#FAFAF5` (warm paper white) |
| **Font (Headline)** | Lexend |
| **Font (Body)** | Plus Jakarta Sans |
| **Roundness** | 12px (friendly, soft corners) |
| **Mode** | Light |
| **Design MD** | Premium editorial + gamification feel; stacked-paper elevation; no hard borders; gradient CTAs; glassmorphism overlays |

---

## Step 2 — Enhance Existing Screens (5 screens)

### 1. Parent Dashboard (`7ebfa933dee444f2802a3dc73c3ef2a1`)
- Top nav with avatar, family name, notification bell
- Weekly reading analytics cards (hours, books, streaks)
- Children progress overview (progress bars per child)
- Quick-assign story shortcut
- Recent family activity feed
- Bottom navigation bar

### 2. Child Dashboard (`20a91f3f8c9e49938fd59f6c76b1486c`)
- Hero greeting with child's avatar and daily reading streak
- Gamification panel: XP bar, badges earned today, flame streak counter
- "Continue Reading" card with progress ring
- Assigned stories section with due dates
- Achievement pop-up teaser
- Playful, colorful layout with rounded cards

### 3. Story Library (`c56705a842b34d4b85c4142a6da306f7`)
- Search bar with category filter chips (Age Group, Genre, Length)
- Featured stories carousel (Google Books–style covers)
- Grid of story cards with rating, pages, difficulty badge
- "Assign to Child" CTA on each card
- Pagination / infinite scroll indicator

### 4. Family Chat (`736dba9d78e34d9cbf5ceb2f50dc8059`)
- Chat sidebar: family member avatars, online indicators
- Conversation area with message bubbles (parent vs child styles)
- Auto-posted reading session messages (e.g. "Emma just finished 30 min of reading! 🎉")
- Message input with emoji and attachment support
- Read receipts (double tick)

### 5. Admin Dashboard (`ad9efa33e9294c7ab6a5050a397c172f`)
- Stat cards: Total Users, Active Families, Stories, Sessions Today
- Charts: Weekly active users, reading minutes trend
- User management table with role badges
- Story import panel (Google Books search + import button)
- System health indicators

---

## Step 3 — Generate New Screens (5 screens)

### 6. Login Screen (Parent & Child)
- Split-role login: two cards — "I'm a Parent" / "I'm a Child"
- Role-specific form below the selector
- Forced password change notice for first child login
- Warm illustration/hero background

### 7. Achievements & Badges Screen (Child)
- Badge grid with locked/unlocked states
- Reading streak calendar (GitHub heatmap style)
- XP progress toward next level
- Recent achievements timeline

### 8. Reading Session Logger (Child)
- Book search / select active book
- Timer with Start / Pause / End controls
- Pages read input
- Auto-post to Family Chat toggle
- Session summary screen on completion

### 9. Assignments Screen (Parent)
- List of created assignments with status chips (Pending / Completed / Overdue)
- "Create Assignment" form: pick child, pick story, set deadline, add note
- Child completion confirmation panel

### 10. Reading Analytics / Progress Screen (Parent)
- Per-child analytics: reading time by day/week/month
- Genre breakdown donut chart
- Reading velocity (pages/hour trend)
- Comparison across children

---

## Verification Plan

Since this is a UI design project on Stitch (not a code deployment), verification is visual:

### Visual Review via Stitch
After each screen is generated/edited, screenshots will be retrieved via `get_screen` and embedded in a `walkthrough.md` artifact for the user to visually review.

### Manual Verification Steps
1. Open [Google Stitch](https://stitch.withgoogle.com) in the browser
2. Navigate to the **Nestory** project
3. Inspect each screen for:
   - Consistent color palette (rose-red primary, sky-blue secondary, green tertiary)
   - Correct fonts (Lexend headlines, Plus Jakarta Sans body)
   - Gamification elements present on child-facing screens
   - Parent-facing screens show analytics with charts/tables
   - Family Chat shows message bubbles with reading auto-posts
   - All new screens render without blank/placeholder content
