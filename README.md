# BD Flood Risk & Vulnerability Terminal

> An "Editorial Data Terminal" — an interactive geospatial dashboard visualizing Bangladesh's flood vulnerability across all 8 administrative divisions, built as a portfolio-grade data visualization project.

[![Deploy to GitHub Pages](https://github.com/Nawfatnahin/bd-flood-dashboard/actions/workflows/deploy.yml/badge.svg)](https://github.com/Nawfatnahin/bd-flood-dashboard/actions/workflows/deploy.yml)

## 🌊 Live Site

**[nawfatnahin.github.io/bd-flood-dashboard](https://nawfatnahin.github.io/bd-flood-dashboard/)**

---

## 📌 Overview

Bangladesh is one of the most flood-affected countries on Earth. Sitting at the confluence of the Padma, Jamuna, and Meghna river systems — with over 80% of its land area classified as floodplain — it experiences severe monsoon flooding, flash floods, and cyclones every year.

This dashboard provides an interactive terminal-style interface to explore flood vulnerability data across Bangladesh's 8 administrative divisions (Dhaka, Chittagong, Khulna, Rajshahi, Sylhet, Barisal, Rangpur, and Mymensingh), surfacing population impact, infrastructure gaps, risk classification, and historical flood incident trends.


---

## 🎨 Design System — Editorial Data Terminal

| Design Token | Value |
|---|---|
| **Primary Background** | `#0c1416` (Deep Teal-Charcoal) |
| **Surface** | `#121e21` |
| **Elevated Surface** | `#182629` |
| **Text Primary** | `#d4e2e1` |
| **Text Secondary** | `#7a918f` |
| **Accent** | `#e8b04b` (Amber) |
| **Risk High** | `#d65645` (Red) |
| **Risk Medium** | `#e8b04b` (Amber) |
| **Risk Low** | `#4a9d8e` (Teal) |
| **Border** | `#2a3a3d` (1px hairline) |
| **Display Font** | Space Grotesk (300, 500, 700) |
| **Body/Data Font** | JetBrains Mono (400, 500) |
| **Border Radius** | `0` everywhere — zero rounding |

**Design decisions made:**
- **Typography:** Rejected Inter/Roboto. Paired `Space Grotesk` (headers, stats) with `JetBrains Mono` (data labels, body) for an analytical terminal feel.
- **Color Palette:** Rejected generic blue/gray. Deep teal-charcoal base with stark amber accent — high contrast, zero softness.
- **Layout:** Rigid CSS Grid with 1px solid borders. No card shadows. Panels snap to integer pixel edges.
- **Iconography:** Replaced icons with typographic markers — small amber geometric squares before panel titles, `>>>` prompts in terminal output.

---

## 🗺️ Features

### Interactive Choropleth Map
- Bangladesh rendered as 8 clickable GeoJSON division polygons
- Risk-level color coding: Red (High) → Amber (Medium) → Teal (Low)
- Hover states with fill-opacity transitions
- CartoDB Dark Matter tile basemap for geographic context
- Leaflet zoom controls restyled to match the terminal palette
- Click any division to drill into its data

### Real-Time Stats Panel
- **Population Density Impact** — Division population in millions (source: Bangladesh Bureau of Statistics 2022 Census)
- **Infrastructure Gap** — Composite index derived from BWDB infrastructure indices (shown as %)
- **Vulnerability Index** — Risk classification (High / Medium / Low), color-coded in the accent palette
- **Area** — Division area in km²
- **Major Rivers** — Primary river systems crossing the division
- **Live Population Clock** — National population ticker, base 173,500,000 (BBS 2024 estimate), updating every 1.5 seconds
- **Live News Feed** — Situation reports from IFRC, BWDB, and MoDMR, auto-rotating every 6 seconds with live API fallback

### Historical Charts Panel
- **Global view:** Bar chart of Bangladesh national flood damage by year (2018–2024, calibrated to World Bank GRADE report data)
- **Region view:** Line chart of division-specific flood incident history (7-year window) when a division is selected
- Recharts-powered, terminal-styled axes — no bounce/elastic easing, monospace tick labels

### Header Terminal Bar
- Live BDT clock (UTC+6, updated every second)
- "Last Updated" timestamp with force-refresh pill (clears `localStorage` cache and recomputes)
- Active node indicator — shows the currently selected division name in amber

---

## 🏗️ Architecture

```
App.jsx (activeRegion state)
    │
    ├──► Header.jsx          — BDT clock, active node, last-updated pill
    ├──► MapPanel.jsx        — Leaflet map, GeoJSON choropleth, click events
    ├──► StatsPanel.jsx      — Region stat cards + LiveFeed + population clock
    └──► ChartsPanel.jsx     — Recharts bar/line chart, data from context
             ▲
    DataProvider.jsx (React context)
             ▲
    dataEngine.js  (cadence-based update engine, localStorage cache)
             ▲
    mockData.js    (seed GeoJSON + chartData)
```

**State management:** `useState` in `App.jsx` holds `activeRegion`. Clicking a division polygon fires `onRegionSelect(feature.properties)` → updates Header, StatsPanel, and ChartsPanel simultaneously. No prop-drilling beyond 3 levels.

**Data context:** `DataProvider.jsx` wraps the app and exposes `{ geoData, chartData, meta, forceRefresh }` via `useData()` hook. All components consume from context rather than passing props through intermediaries.

---

## ⚙️ Data Engine (`src/data/dataEngine.js`)

The engine applies cadence-based updates to seed data and caches results in `localStorage`. On app load, it checks each field's last-update timestamp against its cadence and only recomputes stale fields.

| Category | Fields | Cadence | Logic |
|---|---|---|---|
| Geographic | `area_km2`, `major_rivers` | Static (never) | Fixed seed |
| Demographic | `population` | Yearly (365d) | 1.22% annual growth with seeded LCG randomness |
| Flood Metrics | `flood_history`, `infrastructure_gap`, `risk_level` | Monthly (30d) | Seasonal multipliers + drift |
| Damages | `chartData[].damage` | Yearly (365d) | Year-over-year drift, auto-appends new years |
| News | Situation reports | On load | Live API fetch with fallback |
| Clock | BDT time | Every 1s | `Date.toLocaleString()` — `Asia/Dhaka` |

**Seeded randomness:** Uses a Linear Congruential Generator (LCG) seeded by year/month and division name character codes — guaranteeing the same period always produces the same "random" values (deterministic updates across sessions).

---

## 📊 Data Sources

All data in the current build is **simulated seed data**, calibrated to real-world figures. The architecture is designed to swap in live API endpoints.

### Administrative & Geographic
| Source | Data |
|---|---|
| [GADM](https://gadm.org/) | Administrative boundary shapefiles (real polygons for future version) |
| Bangladesh Bureau of Statistics (2022 Census) | Division population, area |

### Flood & Infrastructure
| Source | Data |
|---|---|
| [BWDB](http://www.hydrology.bwdb.gov.bd/) | Infrastructure gap indices, historical flood data |
| [FFWC](http://ffwc.gov.bd/) | Flood Forecasting and Warning Centre |
| IFRC & World Bank GRADE Report (2024) | Damage estimates (`chartData`), calibrated to $1.68B national total |
| MoDMR | Ministry of Disaster Management situation reports |

### Population
| Source | Data |
|---|---|
| [WorldPop](https://www.worldpop.org/) | High-resolution population density |
| Bangladesh Bureau of Statistics 2024 estimate | National population base (173,500,000) |

### News Feed
| Source | Data |
|---|---|
| `https://news.knowivate.com/api/latest` | Live news articles filtered for "bangladesh", "flood", "cyclone" |
| IFRC / BWDB / MoDMR curated reports | Fallback static situation reports |

### Risk Classification Formula
```
avg(last 3 flood_history values):
  > 18  →  High
  > 10  →  Medium
  else  →  Low
```

---

## 📁 Repository Structure

```
flood-dashboard/
├── index.html                   # Entry point — Google Fonts, Leaflet CSS
├── package.json                 # React 18, react-leaflet, recharts, Vite
├── vite.config.js               # Vite + React plugin config
├── .gitignore
├── src/
│   ├── main.jsx                 # ReactDOM entry
│   ├── App.jsx                  # Root — holds activeRegion state
│   ├── index.css                # Full design system (CSS custom properties)
│   ├── data/
│   │   ├── mockData.js          # Seed GeoJSON (8 divisions) + chartData
│   │   └── dataEngine.js        # Cadence engine — localStorage caching
│   └── components/
│       ├── DataProvider.jsx     # React context — geoData, chartData, meta
│       ├── Header.jsx           # BDT clock, active node, last-updated pill
│       ├── MapPanel.jsx         # react-leaflet — choropleth + basemap
│       ├── StatsPanel.jsx       # Division stats + population clock + news feed
│       └── ChartsPanel.jsx      # recharts — bar (global) / line (region)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18

### Install & Run
```bash
git clone https://github.com/Nawfatnahin/bd-flood-dashboard.git
cd bd-flood-dashboard
npm install
npm run dev
```
Then open the localhost.

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🖥️ How to Use the Terminal

1. **Select a Division** — Click any colored polygon on the map. The Header shows the division name in amber; StatsPanel and ChartsPanel update immediately.
2. **Global View** — With no division selected, StatsPanel shows national aggregate stats; ChartsPanel shows the full annual damage bar chart (2018–2024).
3. **Regional View** — After selecting a division, ChartsPanel switches to a 7-year flood incident line chart for that division.
4. **Force Refresh** — Click the "Last Updated" pill in the Header to clear the `localStorage` cache and recompute all cadence-based fields.
5. **Live Population** — The national population counter in StatsPanel ticks upward in real time.
6. **News Feed** — Situation reports rotate every 6 seconds; sourced live if available, falling back to curated IFRC/BWDB reports.

---

## 🧰 Technical Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + Vite 5 |
| Mapping Engine | [react-leaflet](https://react-leaflet.js.org/) v4 + Leaflet v1.9.4 |
| Basemap | CartoDB Dark Matter (via Leaflet TileLayer) |
| Charts | [Recharts](https://recharts.org/) v2 |
| Styling | Hand-rolled CSS (zero frameworks — no Tailwind, no MUI) |
| Fonts | Space Grotesk + JetBrains Mono via Google Fonts |
| Data Persistence | `localStorage` (cadence cache) |
| State Management | React `useState` + Context API |
| Bundler | Vite 5 |

---

## 📐 Design Philosophy

This project was built to demonstrate that **data-heavy geospatial interfaces don't have to look like off-the-shelf dashboards**. Specific anti-patterns that were intentionally avoided:

| Common Pattern | Decision Made |
|---|---|
| Generic card shadows and rounded corners | `border-radius: 0` everywhere, `box-shadow: none` |
| Inter / Roboto typography | Space Grotesk (display) + JetBrains Mono (data) |
| Pastel blue/purple data palette | Deep teal/charcoal + stark amber + semantic risk colors |
| Icon-heavy navigation | Typographic markers (`>>>`, amber squares) |
| Soft map tiles | CartoDB Dark Matter — high contrast, no noise |
| Bounce/elastic chart animations | `type="linear"` only — no easing theatrics |

---

## 🔮 Roadmap (Real Data Integration)

To replace the simulated seed with live data:

1. **Admin boundaries** → Replace bounding-box GeoJSON polygons with real [GADM](https://gadm.org/) shapefiles at Admin Level 1 for Bangladesh.
2. **Flood data** → Wire `dataEngine.js` flood history updater to [FFWC API](http://ffwc.gov.bd/) for live river levels and forecasts.
3. **Population** → Swap the growth formula for [WorldPop API](https://www.worldpop.org/) raster estimates.
4. **Infrastructure gap** → Connect to BWDB data feeds.
5. **Damage figures** → Pull from [ReliefWeb API](https://reliefweb.int/api) for verified situation reports and loss estimates.

---

## 🏛️ Institutional Acknowledgement

This project references data frameworks maintained by:

- **Bangladesh Water Development Board (BWDB)** — Infrastructure indices and historical flood monitoring
- **Flood Forecasting and Warning Centre (FFWC)** — National flood forecasting authority
- **Bangladesh Bureau of Statistics (BBS)** — Population and demographic data
- **World Bank GRADE Programme** — Disaster loss estimates
- **IFRC (International Federation of Red Cross)** — Humanitarian situation reports
- **Ministry of Disaster Management and Relief (MoDMR)** — Official emergency management data
- **WorldPop, University of Southampton** — High-resolution population grids

---