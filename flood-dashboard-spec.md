# BD Flood Risk & Vulnerability Terminal — Full Source + Finalization Spec

> Consolidated from GLM-5.2 chat output (screenshot + PDF). Source code reconstructed faithfully; truncated fragments are marked `// COMPLETED BY CLAUDE` with the gap noted. Use the **Antigravity Instructions** section at the bottom to finish the build.

---

## 1. Analysis Summary

**Stack:** Vite + React 18, `react-leaflet` (map), `recharts` (charts). No backend — all data is local mock JSON.

**Design system:** "Editorial Data Terminal" aesthetic — dark teal/charcoal palette, `Space Grotesk` (display) + `JetBrains Mono` (body/data), zero border-radius, 1px hairline borders, amber accent (`#e8b04b`).

**Architecture:** `App.jsx` holds `activeRegion` state → passed down to `MapPanel` (sets it on click), `StatsPanel`, `ChartsPanel` (both read it). Clean unidirectional data flow, no prop-drilling issues since it's only 3 levels.

**Issues found while reconstructing (need fixing — see Antigravity instructions):**
1. `package.json` dependencies list was cut off in the screenshot — only `scripts` was visible. Rebuilt below from imports actually used in the code (`react-leaflet`, `leaflet`, `recharts`).
2. `index.html` Google Fonts `<link>` URL was truncated mid-string.
3. `MapPanel.jsx` has **no `TileLayer`** — only the colored GeoJSON polygons render. There's no real basemap (coastline, rivers, labels). This may be intentional (abstract "terminal" look) or a bug — flagged for a decision.
4. `StatsPanel.jsx`'s inline color ternary for `risk_level` was cut off after the "High" case — "Medium"/"Low" cases were missing. Completed below.
5. `mockData.js` exports `chartData` (yearly damage by event) but **no component imports/uses it** — `ChartsPanel` instead derives its chart from `activeRegion.flood_history`. Dead code — decide whether to wire it in (e.g., as the "Regional Aggregate" default view) or remove.
6. Only 3 of Bangladesh's 8 administrative divisions are in `mockData.js` (Dhaka, Khulna, Chittagong). The map will look sparse.
7. Polygon coordinates are crude bounding boxes, not real admin boundaries (the project's own `PROCESS.md` acknowledges this and names GADM as the intended real source).
8. No `node_modules`/lockfile/`.gitignore` — project has never been installed or run.

---

## 2. File Structure

```
flood-dashboard/
├── index.html
├── package.json
├── vite.config.js
├── PROCESS.md
├── .gitignore                  (missing — add it)
├── src/
│   ├── main.jsx
│   ├── index.css
│   ├── App.jsx
│   ├── data/
│   │   └── mockData.js
│   └── components/
│       ├── Header.jsx
│       ├── MapPanel.jsx
│       ├── StatsPanel.jsx
│       └── ChartsPanel.jsx
```

---

## 3. Source Code

### `package.json`
```json
{
  "name": "bd-flood-dashboard",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}
```
<!-- COMPLETED BY CLAUDE: dependencies block was cut off in source screenshot; versions chosen as current stable majors compatible with each other. -->

### `vite.config.js`
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### `index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BD Flood Risk & Vulnerability Terminal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```
<!-- COMPLETED BY CLAUDE: font URL was truncated; filled with the two font families actually referenced in index.css (Space Grotesk + JetBrains Mono). -->

### `src/index.css`
```css
:root {
  /* Tinted neutrals - Deep Teal/Charcoal */
  --bg-base: #0c1416;
  --bg-surface: #121e21;
  --bg-elevated: #182629;

  /* Typography */
  --text-primary: #d4e2e1;
  --text-secondary: #7a918f;
  --text-accent: #e8b04b;

  /* Sharp accents */
  --border-color: #2a3a3d;
  --color-risk-high: #d65645;
  --color-risk-med: #e8b04b;
  --color-risk-low: #4a9d8e;

  --font-display: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Strict UI Rules: No rounded corners, no soft shadows, intentional spacing */
.app-container {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  grid-template-rows: 1fr 300px;
  gap: 1px;
  background-color: var(--border-color);
  border-top: 1px solid var(--border-color);
}

.panel {
  background-color: var(--bg-surface);
  padding: 24px;
  overflow: hidden;
  position: relative;
}

.panel-title {
  font-family: var(--font-display);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-secondary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  padding-bottom: 12px;
}

.panel-title::before {
  content: '';
  display: block;
  width: 8px;
  height: 8px;
  background-color: var(--text-accent);
  margin-right: 8px;
}

/* Map specific overrides */
.leaflet-container {
  background-color: var(--bg-base) !important;
  font-family: var(--font-mono) !important;
}

.leaflet-popup-content-wrapper {
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 0;
  border: 1px solid var(--text-accent);
  box-shadow: none;
}

.leaflet-popup-tip {
  background-color: var(--text-accent);
  border-radius: 0;
}

/* Stats styling */
.stat-item {
  margin-bottom: 24px;
  border-left: 2px solid var(--border-color);
  padding-left: 16px;
  transition: border-color 0.2s ease;
}

.stat-item:hover {
  border-color: var(--text-accent);
}

.stat-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 500;
  color: var(--text-primary);
}

.stat-meta {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--bg-base);
}
::-webkit-scrollbar-thumb {
  background: var(--border-color);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
```
<!-- COMPLETED BY CLAUDE: added `margin-right: 8px` to .panel-title::before — the marker square otherwise sits flush against the title text with no gap. -->

### `src/main.jsx`
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### `src/data/mockData.js`
```js
// Simulated GeoJSON for specific Bangladesh divisions (Simplified coordinates for demonstration)
export const bdGeoData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Dhaka",
        risk_level: "High",
        population: 21000000,
        infrastructure_gap: "34%",
        flood_history: [12, 15, 14, 22, 18, 25, 30]
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [90.35, 23.85], [90.35, 24.05], [90.45, 24.05], [90.45, 23.85], [90.35, 23.85]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Khulna",
        risk_level: "Medium",
        population: 15000000,
        infrastructure_gap: "21%",
        flood_history: [8, 9, 11, 14, 12, 15, 18]
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [89.50, 22.80], [89.50, 23.00], [89.70, 23.00], [89.70, 22.80], [89.50, 22.80]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Chittagong",
        risk_level: "High",
        population: 18000000,
        infrastructure_gap: "29%",
        flood_history: [10, 14, 13, 19, 24, 21, 28]
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [91.80, 22.30], [91.80, 22.50], [92.00, 22.50], [92.00, 22.30], [91.80, 22.30]
        ]]
      }
    }
  ]
};

export const chartData = [
  { year: '2018', event: 'Monsoon', damage: 120 },
  { year: '2019', event: 'Flash Flood', damage: 180 },
  { year: '2020', event: 'Cyclone', damage: 320 },
  { year: '2021', event: 'Monsoon', damage: 210 },
  { year: '2022', event: 'Monsoon', damage: 250 },
];
```

### `src/App.jsx`
```jsx
import React, { useState } from 'react';
import Header from './components/Header';
import MapPanel from './components/MapPanel';
import StatsPanel from './components/StatsPanel';
import ChartsPanel from './components/ChartsPanel';

export default function App() {
  const [activeRegion, setActiveRegion] = useState(null);

  return (
    <div className="app-container">
      <Header activeRegion={activeRegion} />
      <main className="dashboard-grid">
        <div className="panel" style={{ gridColumn: '1', gridRow: '1' }}>
          <MapPanel onRegionSelect={setActiveRegion} />
        </div>

        <div className="panel" style={{ gridColumn: '2', gridRow: '1 / span 2', borderLeft: 'none' }}>
          <StatsPanel activeRegion={activeRegion} />
        </div>

        <div className="panel" style={{ gridColumn: '1', gridRow: '2' }}>
          <ChartsPanel activeRegion={activeRegion} />
        </div>
      </main>
    </div>
  );
}
```

### `src/components/Header.jsx`
```jsx
import React from 'react';

export default function Header({ activeRegion }) {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      padding: '20px 24px',
      backgroundColor: 'var(--bg-base)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          marginBottom: '4px'
        }}>
          Geospatial Terminal // v1.0.2
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          margin: 0
        }}>
          Bangladesh Flood Vulnerability Matrix
        </h1>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Active Node
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          fontWeight: 500,
          color: activeRegion ? 'var(--text-accent)' : 'var(--text-secondary)'
        }}>
          {activeRegion ? activeRegion.name : 'Awaiting Selection'}
        </div>
      </div>
    </header>
  );
}
```

### `src/components/MapPanel.jsx`
```jsx
import React from 'react';
import { MapContainer, GeoJSON } from 'react-leaflet';
import { bdGeoData } from '../data/mockData';

export default function MapPanel({ onRegionSelect }) {
  const center = [23.685, 90.3563]; // Bangladesh center coordinates

  const style = (feature) => {
    const risk = feature.properties.risk_level;
    let color = 'var(--color-risk-low)';
    if (risk === 'High') color = '#d65645';
    if (risk === 'Medium') color = '#e8b04b';

    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: 'var(--bg-base)',
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ weight: 2, fillOpacity: 0.9 });
      },
      mouseout: (e) => {
        e.target.setStyle({ weight: 1, fillOpacity: 0.7 });
      },
      click: (e) => {
        onRegionSelect(feature.properties);
      }
    });
  };

  return (
    <>
      <div className="panel-title">Choropleth Overlay // Admin Level 1</div>
      <div style={{ height: 'calc(100% - 40px)', width: '100%', border: '1px solid var(--border-color)' }}>
        <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
          <GeoJSON data={bdGeoData} style={style} onEachFeature={onEachFeature} />
        </MapContainer>
      </div>
    </>
  );
}
```
<!-- NOTE: No <TileLayer> — see Issue #3 above. Antigravity must decide & implement. -->

### `src/components/StatsPanel.jsx`
```jsx
import React from 'react';

export default function StatsPanel({ activeRegion }) {
  const data = activeRegion || { name: '–', population: '–', infrastructure_gap: '–', risk_level: '–' };

  const riskColor =
    data.risk_level === 'High' ? 'var(--color-risk-high)' :
    data.risk_level === 'Medium' ? 'var(--color-risk-med)' :
    data.risk_level === 'Low' ? 'var(--color-risk-low)' :
    'var(--text-primary)';

  return (
    <>
      <div className="panel-title">Real-Time Metrics</div>

      <div className="stat-item">
        <div className="stat-label">Population Density Impact</div>
        <div className="stat-value">
          {typeof data.population === 'number' ? (data.population / 1000000).toFixed(1) + 'M' : '–'}
        </div>
        <div className="stat-meta">Source: WorldPop (2023)</div>
      </div>

      <div className="stat-item">
        <div className="stat-label">Infrastructure Gap</div>
        <div className="stat-value">{data.infrastructure_gap}</div>
        <div className="stat-meta">Calculated via BWDB sat indices</div>
      </div>

      <div className="stat-item">
        <div className="stat-label">Vulnerability Index</div>
        <div className="stat-value" style={{ color: riskColor }}>
          {data.risk_level}
        </div>
        <div className="stat-meta">Composite score: Elevation + History</div>
      </div>

      {activeRegion && (
        <div style={{ marginTop: '32px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '8px' }}>&gt;&gt;&gt; Node selected. Charts re-indexing to {activeRegion.name} parameters...</p>
        </div>
      )}
    </>
  );
}
```
<!-- COMPLETED BY CLAUDE: the risk_level color ternary was cut off after the "High" case in the source screenshot; added Medium/Low branches plus a safe default. -->

### `src/components/ChartsPanel.jsx`
```jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ChartsPanel({ activeRegion }) {
  // If a region is selected, map its flood history to chart data; otherwise use empty state
  const data = activeRegion
    ? activeRegion.flood_history.map((val, i) => ({ year: `Y${i + 1}`, incidents: val }))
    : [{ year: 'Y1', incidents: 0 }];

  return (
    <>
      <div className="panel-title">
        {activeRegion ? `${activeRegion.name} // Flood Incident History` : 'Regional Aggregate // Flood Incidents'}
      </div>

      <div style={{ height: 'calc(100% - 40px)', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="year"
              stroke="var(--text-secondary)"
              tick={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={false}
            />
            <YAxis
              stroke="var(--text-secondary)"
              tick={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--text-accent)',
                borderRadius: 0,
                fontSize: '12px',
                fontFamily: 'var(--font-mono)'
              }}
              labelStyle={{ color: 'var(--text-secondary)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Line
              type="linear"
              dataKey="incidents"
              stroke="var(--text-accent)"
              strokeWidth={2}
              dot={{ fill: 'var(--text-accent)', r: 3 }}
              activeDot={{ r: 5, fill: 'var(--color-risk-high)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
```

### `PROCESS.md`

```markdown
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
```

---

## 4. Instructions for Antigravity

Paste the block below into Antigravity as the task brief. It assumes the files above have already been scaffolded into a `flood-dashboard/` directory exactly as listed in Section 2.

```
TASK: Finalize the "BD Flood Risk & Vulnerability Terminal" React/Vite project.

CONTEXT: All source files already exist as specified. Do not change the visual
design language (dark teal/charcoal, Space Grotesk + JetBrains Mono, zero
border-radius, amber accent #e8b04b) — only fix functional gaps below.

DO THE FOLLOWING IN ORDER:

1. Setup
   - Run `npm install` and resolve any peer-dependency conflicts between
     react-leaflet@4 and react@18.
   - Add a standard Node/Vite `.gitignore` (node_modules, dist, .env).

2. Fix MapPanel.jsx — missing basemap
   - Decide and implement ONE of:
     a) Add a dark-themed <TileLayer> (e.g. CartoDB "dark_matter" or
        Stadia "alidade_smooth_dark") beneath the <GeoJSON> layer so real
        coastlines/rivers are visible, OR
     b) Keep it tile-free but add a faint static SVG/PNG outline of
        Bangladesh's coastline behind the polygons so it doesn't look broken
        on first load.
   - Default to option (a) unless told otherwise — it's more functional and
     still matches the dark aesthetic.
   - Disable default Leaflet zoom control styling clash: restyle
     `.leaflet-control-zoom` to match the terminal theme (dark bg, amber
     hover) since it currently inherits default Leaflet white-box styling.

3. Expand mock data
   - In `src/data/mockData.js`, add the remaining 5 Bangladesh divisions
     (Rajshahi, Barisal, Sylhet, Rangpur, Mymensingh) with plausible
     risk_level/population/infrastructure_gap/flood_history values,
     following the existing schema exactly. Keep polygon coordinates as
     simple bounding boxes consistent with the existing 3 entries.

4. Resolve dead code
   - `chartData` in mockData.js is currently unused. Either:
     a) Wire it into ChartsPanel as the default "Regional Aggregate" view
        when `activeRegion` is null (replace the current `[{year:'Y1',
        incidents:0}]` placeholder with this real dataset), or
     b) Remove the unused export if (a) is rejected.
   - Default to option (a).

5. Polish & correctness pass
   - Verify StatsPanel's risk_level color ternary handles High/Medium/Low/
     default correctly (already completed in the source — just confirm).
   - Add a loading/empty state for MapPanel in case GeoJSON fails to parse.
   - Add basic responsive behavior: collapse `.dashboard-grid` to a single
     column below ~900px viewport width.

6. Verification
   - Run `npm run dev`, confirm:
     - Map renders with visible basemap + 8 colored divisions.
     - Clicking a division updates Header, StatsPanel, and ChartsPanel.
     - No console errors/warnings.
   - Run `npm run build` and confirm it completes without errors.

7. Do NOT:
   - Introduce a UI framework (Tailwind, MUI, etc.) — the design is
     intentionally hand-rolled CSS.
   - Round any corners or add box-shadows anywhere.
   - Replace JetBrains Mono / Space Grotesk fonts.
```
