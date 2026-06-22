# Project Process & Analysis: Bangladesh Flood Risk & Vulnerability Dashboard

## 1. Concept & Analysis
The objective was to build a portfolio piece demonstrating advanced data visualization and UI
design constraints. The chosen topic—Bangladesh's flood vulnerability—carries significant
weight. Bangladesh is geographically positioned as one of the most flood-relevant countries on
Earth. Building a dashboard around this shows an understanding of high-impact, real-world data
problems rather than generic CRUD apps.

## 2. Design Thinking & UI Philosophy
To avoid generic "AI UI" patterns, an "Editorial Data Terminal" aesthetic was used, taking
inspiration from Bloomberg Terminals and modern data journalism sites like The Pudding.

Specific design decisions based on constraints:
- **Typography:** Rejected Inter/Roboto. Paired Space Grotesk (display) with JetBrains Mono
  (data/body) for a technical, analytical feel.
- **Color Palette:** Rejected pure black/gray and pastel blue/purple. Used a tinted neutral
  palette based on deep teal/charcoal (#0c1416 to #182629). The accent is a stark amber
  (#e8b04b), with sharp red/teal for risk indicators.
- **Layout & Spacing:** Rejected nesting cards and soft shadows. Used a rigid grid with 1px
  solid borders. Panels have sharp corners (border-radius: 0) and rely on intentional padding.
- **Iconography:** Rejected big rounded icons. Replaced with minimal typographic markers (e.g.,
  >> prompts, small geometric squares before panel titles).

## 3. Development Process
1. **Architecture:** Vite + React for fast bundling.
2. **Data Handling:** Mock GeoJSON-style data for Bangladesh divisions instead of live APIs
   (rate-limit/availability risk).
3. **Map Integration:** `react-leaflet` rendering the GeoJSON, styled with the tinted neutral
   palette. Click events update global state.
4. **State Management:** `useState` in `App.jsx` holds `activeRegion`; updates propagate to
   Stats and Charts panels.
5. **Data Visualization:** `recharts` line chart, strictly linear easing (no bounce/elastic),
   axes/tooltips styled to match the terminal aesthetic.

## 4. Data Sources (Simulated)
The prototype uses mock data for reliability; the architecture is designed to ingest data from:
- **GADM** (Database of Global Administrative Areas): exact polygon boundaries.
- **WorldPop**: high-resolution population density estimates.
- **BWDB** (Bangladesh Water Development Board): historical flood data and infrastructure
  gap indices.
- **NOAA**: precipitation patterns and cyclone tracking data.

## 5. How to Run
1. Ensure Node.js is installed.
2. Run `npm install` in the project directory.
3. Run `npm run dev` to start the local development server.
