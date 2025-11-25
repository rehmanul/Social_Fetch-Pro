# OmniFetch 2025 Design Guidelines

## Design Approach
**Selected Approach:** Design System - Technical Dashboard  
**Primary References:** Linear (typography & minimalism), Vercel Dashboard (technical aesthetics), Stripe Dashboard (data layouts)  
**Design Principles:** Clarity over decoration, efficiency over flash, information density without clutter

## Typography System

**Font Stack:**
- Primary: Inter (Google Fonts) - All UI text, forms, data
- Monospace: JetBrains Mono - Code snippets, JSON outputs, API responses

**Hierarchy:**
- Page Titles: text-2xl font-semibold
- Section Headers: text-lg font-medium
- Card Titles: text-base font-medium
- Body/Labels: text-sm font-normal
- Captions/Meta: text-xs text-gray-500

## Layout System

**Spacing Units:** Tailwind primitives of 4, 6, 8, 12, 16, 24
- Component padding: p-6
- Section spacing: space-y-8
- Card gaps: gap-6
- Input spacing: space-y-4

**Grid Structure:**
- Dashboard layout: Sidebar (256px fixed) + Main content area
- Card grids: 2-column on desktop (grid-cols-2), 1-column mobile
- Data tables: Full-width with horizontal scroll on mobile

## Component Library

### Navigation
**Sidebar (Fixed Left):**
- Platform icons (YouTube/Twitter/Instagram/TikTok) with labels
- Active state: subtle background fill
- Dashboard, Jobs, Accounts, Settings sections
- Height: h-screen, Width: w-64

### Core Components

**Platform Selector Cards:**
- Large clickable cards (4 total) in 2x2 grid
- Platform icon + name + status indicator (connected/disconnected)
- Hover: subtle border highlight

**Scraping Configuration Panel:**
- Form layout with clear field grouping
- Input fields: border, rounded-lg, focus:ring-2
- Dropdowns: Custom select with chevron icons
- Submit button: Primary action, full-width mobile

**Results Display:**
- Tabbed interface: Raw JSON / Formatted View / Export
- Code block styling for JSON (dark background, syntax highlighting)
- Copy-to-clipboard button positioned top-right

**Job Queue Table:**
- Alternating row backgrounds for readability
- Status badges: Pills with status-specific colors (running/completed/failed)
- Action icons: Aligned right (view/retry/delete)

**Account Management:**
- Twitter swarm: List with status indicators per account
- Add account modal: Multi-step form (credentials → verify → activate)
- Health status: Visual indicators (green/yellow/red dots)

**Live Logs Panel:**
- Terminal-style output: Monospace font, dark background
- Auto-scroll to bottom
- Timestamps: Dimmed, left-aligned
- Log levels: Color-coded (info/warning/error)

**Analytics Dashboard:**
- Stat cards: 4-up grid showing total scrapes, success rate, active accounts, data volume
- Large numbers (text-3xl font-bold) with trend indicators
- Line charts: Request volume over time
- Bar charts: Platform usage distribution

### Data Display Elements

**Metric Cards:**
- White background, subtle border
- Large numeric value (text-3xl) centered
- Label below (text-sm text-gray-600)
- Optional trend indicator (small arrow + percentage)

**Status Indicators:**
- Dot + text pattern
- Running: Blue pulse animation
- Success: Green static
- Failed: Red static
- Queued: Gray static

**JSON Viewer:**
- Collapsible tree structure
- Syntax highlighting (keys, strings, numbers, booleans)
- Line numbers in gutter
- Dark theme (bg-gray-900)

## Page Layouts

### Dashboard Home
- Welcome header with user context
- Quick stats: 4 metric cards in row
- Platform status: 2x2 grid of platform cards
- Recent jobs: Table showing last 10 jobs

### Platform Scraping Page
- Split layout: Config form (left 40%) + Results preview (right 60%)
- Sticky form during scroll
- Real-time status updates in results pane

### Jobs Queue
- Filter bar: Platform dropdown, Status dropdown, Date range
- Jobs table: Full-width with pagination
- Bulk actions: Select checkboxes + action bar

### Account Management
- Tab navigation: Twitter Accounts / Instagram Account / Settings
- Twitter: Table list with add/remove actions
- Instagram: Single credential form with session status

## Visual Treatment

**Borders:** border-gray-200 (light mode default)
**Shadows:** shadow-sm for cards, shadow-md for modals
**Radius:** rounded-lg for cards/panels, rounded-md for inputs
**Focus States:** ring-2 ring-blue-500

## Icons
**Library:** Heroicons (outline for nav, solid for actions)
**Usage:**
- Platform logos: Custom SVG (can use simple colored circles with initials as placeholders)
- Actions: Heroicons (play, pause, trash, copy, download)
- Status: Heroicons (check-circle, x-circle, clock, exclamation)

## Images
**Not Applicable:** This is a technical dashboard - no hero images or marketing visuals needed. All visual communication through icons, charts, and data displays.

## Animation Guidelines
**Minimal Motion:**
- Status pulse: Subtle 2s infinite pulse for "running" state
- Transitions: 150ms ease for hovers, 200ms ease for modals
- NO scroll-triggered animations
- NO decorative motion

## Responsive Behavior
- Mobile: Stack all grids to single column, collapse sidebar to bottom nav
- Tablet: 2-column layouts remain, sidebar stays visible
- Desktop: Full layout with fixed sidebar