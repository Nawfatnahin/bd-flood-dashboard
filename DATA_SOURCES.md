# Data Sources & Collection Process

> This document describes every data source, how data is collected, updated, and propagated through the dashboard. Designed so another AI agent can understand the full data pipeline.

---

## 1. Data Architecture Overview

```
mockData.js (seed)
     │
     ▼
dataEngine.js (cadence-based updater)
     │
     ▼
DataProvider.jsx (React context)
     │
     ├──► MapPanel.jsx          — choropleth overlay
     ├──► ChartsPanel.jsx       — line/bar charts
     └──► [activeRegion props]  ► StatsPanel.jsx — stat cards
```

All data originates from `src/data/mockData.js` as seed values. The engine (`dataEngine.js`) applies time-based transformations and caches results in `localStorage`. The `DataProvider` React context distributes updated data to all components.

---

## 2. Data Categories & Update Cadences

| Category | Fields | Cadence | Source Type |
|----------|--------|---------|-------------|
| Geographic | `area_km2`, `major_rivers` | Static (never) | Fixed seed |
| Demographic | `population` | Yearly (365d) | Simulated growth |
| Flood Metrics | `flood_history[]`, `infrastructure_gap`, `risk_level` | Monthly (30d) | Simulated + seasonal |
| Damages | `chartData[].damage` | Yearly (365d) | Simulated drift |
| News Feed | Situation reports | On load | Live API fetch |
| Clock | BDT time | Every 1s | `Date` object |

---

## 3. Seed Data (`src/data/mockData.js`)

### 3.1 GeoJSON Features (`bdGeoData`)
Eight Bangladesh divisions stored as GeoJSON `FeatureCollection`. Each feature has:

```json
{
  "type": "Feature",
  "properties": {
    "name": "Dhaka",
    "risk_level": "High",
    "population": 21000000,
    "infrastructure_gap": "34%",
    "area_km2": 20594,
    "major_rivers": "Padma, Jamuna, Meghna, Buriganga",
    "flood_history": [12, 15, 14, 22, 18, 25, 30]
  },
  "geometry": { ... }
}
```

Polygon coordinates are simplified bounding boxes for demonstration. Real boundaries require GADM shapefiles.

Sources for seed values:
- **Population**: Bangladesh Bureau of Statistics (2022 Census)
- **Area**: Bangladesh Bureau of Statistics (via Wikipedia Divisions of Bangladesh)
- **Major rivers**: Geographic knowledge — primary river systems crossing each division
- **Infrastructure gap**: Composite index based on BWDB (Bangladesh Water Development Board) infrastructure reports
- **Flood history**: Simulated incident counts per year (2018–2024), calibrated to IFRC and World Bank GRADE report trends
- **Risk level**: Derived from flood history averages (>18 = High, >10 = Medium, else Low)

### 3.2 Chart Data (`chartData`)
Annual damage estimates in millions USD:

```js
[
  { year: '2018', event: 'Monsoon',     damage: 120 },
  { year: '2019', event: 'Flash Flood', damage: 180 },
  { year: '2020', event: 'Cyclone',     damage: 320 },
  { year: '2021', event: 'Monsoon',     damage: 210 },
  { year: '2022', event: 'Monsoon',     damage: 250 },
  { year: '2023', event: 'Flash Flood', damage: 290 },
  { year: '2024', event: 'Cyclone',     damage: 340 },
]
```

- **Source**: Calibrated to World Bank GRADE report (2024: $1.68B total) and Ministry of Disaster Management historical records.
- The chart shows one event type per year; actual damage figures are scaled for visualization.

---

## 4. Data Update Engine (`src/data/dataEngine.js`)

### 4.1 Cadence Configuration
```js
const CADENCE = {
  STATIC:   { intervalMs: Infinity,        label: 'static'  },
  MONTHLY:  { intervalMs: 30 * 86400000,   label: 'monthly' },
  YEARLY:   { intervalMs: 365 * 86400000,  label: 'yearly'  },
};
```

### 4.2 Update Rules

#### Population (Yearly)
- Growth rate: 1.22% per year (Bangladesh national average)
- Formula: `population × (1 + 0.0122 × (0.95 + random × 0.1))`
- Seeded random ensures determinism within each year
- Stored under key `pop_{DivisionName}`

#### Flood History (Monthly)
- Seasonal multiplier based on monsoon calendar:
  - July–August (peak): ×1.0
  - June, September (shoulder): ×0.85
  - October–May (dry): ×0.65
- Drift: `(random - 0.45) × 4` applied per value
- Minimum value: 1
- Stored under key `fh_{DivisionName}`

#### Infrastructure Gap (Monthly)
- Improves 0–0.4% per month (infrastructure development)
- Formula: `max(5, current - random × 0.4)`
- Stored under key `infra_{DivisionName}`

#### Risk Level (Monthly)
- Recalculated from 3 most recent flood history values:
  - Average > 18 → `High`
  - Average > 10 → `Medium`
  - Else → `Low`
- Stored under key `risk_{DivisionName}`

#### Chart Damages (Yearly)
- Each year's damage value drifts by `× (1 + (random - 0.45) × 0.06)`
- Auto-appends new years when calendar year advances:
  - Damage = previous year × (1.08 + random × 0.12)
  - Event type cycles: Monsoon → Flash Flood → Cyclone
- Stored under key `chart_damage`

### 4.3 Seed Random Generator
Uses a Linear Congruential Generator (LCG) seeded by:
- Year number for yearly data
- `year × 12 + month` for monthly data
- Division name character codes for per-division uniqueness

This ensures the same calendar period always produces the same "random" values, making updates deterministic.

### 4.4 Caching Strategy
- **Cache key**: `bd_flood_engine_cache` (full computed dataset)
- **Meta key**: `bd_flood_engine_meta` (per-field timestamps)
- Storage: `localStorage` (persists across sessions)
- Freshness check: On app load, compares each field's timestamp against its cadence
- If ALL fields are fresh, returns cached data without recomputation

---

## 5. Live Data Sources

### 5.1 News Feed
- **Endpoint**: `https://news.knowivate.com/api/latest`
- **Filter**: Articles containing "bangladesh", "flood", or "cyclone" in title/description
- **Fallback**: Predefined `GENERAL_REPORTS` array (6 curated reports from IFRC, BWDB, MoDMR)
- **Per-region fallback**: `REGION_NEWS` object with 4 reports per division
- **Rotation**: Auto-cycles every 6 seconds

### 5.2 Live Population Clock
- **Base**: 173,500,000 (Bangladesh Bureau of Statistics 2024 estimate)
- **Tick**: +3 every 1.5 seconds (scaled-up simulation of ~1.7M/year growth)

### 5.3 BDT Clock
- **Source**: `Date.toLocaleString()` with `timeZone: 'Asia/Dhaka'`
- **Update**: Every 1 second

---

## 6. Data Flow Per Component

### MapPanel (`src/components/MapPanel.jsx`)
- Consumes `geoData` from `useData()` context
- Renders Leaflet `GeoJSON` layer with risk-colored polygons
- On click: passes `feature.properties` to `onRegionSelect` → StatsPanel

### StatsPanel (`src/components/StatsPanel.jsx`)
- Receives `activeRegion` (feature properties) via props
- **Global view**: 7 stat cards with national aggregate data
- **Region view**: 7 stat cards with per-division data (including `area_km2`, `major_rivers`)
- Also renders LiveFeed sub-component

### ChartsPanel (`src/components/ChartsPanel.jsx`)
- Consumes `chartData` from `useData()` context
- **Global view**: Bar chart of annual damages
- **Region view**: Line chart of flood incident history for selected division

### Header (`src/components/Header.jsx`)
- Shows `Last Updated` timestamp from `useData().meta.lastFullUpdate`
- Clicking the pill triggers `forceRefresh()` which clears cache and recomputes

---

## 7. Real Data Replacement Guide

To replace simulated data with real API endpoints:

1. **In `dataEngine.js`**: Add a `fetch()` call in the relevant update function (e.g., for population, call Bangladesh Bureau of Statistics API)
2. **Set cadence accordingly**: Reduce interval for frequently updated APIs
3. **Remove random generation**: Replace with actual API response values
4. **Add error fallback**: Keep the simulated generator as fallback if the API is unreachable

Potential real data sources:
- **BWDB**: [http://www.hydrology.bwdb.gov.bd/](http://www.hydrology.bwdb.gov.bd/) — river levels and flood forecasts
- **WorldPop**: [https://www.worldpop.org/](https://www.worldpop.org/) — population estimates
- **GADM**: [https://gadm.org/](https://gadm.org/) — administrative boundary shapefiles
- **FFWC**: [http://ffwc.gov.bd/](http://ffwc.gov.bd/) — Flood Forecasting and Warning Centre
- **ReliefWeb API**: [https://reliefweb.int/api](https://reliefweb.int/api) — situation reports

---

## 8. Summary

| File | Role |
|------|------|
| `src/data/mockData.js` | Seed/base data (GeoJSON + chart data) |
| `src/data/dataEngine.js` | Cadence-based update engine with caching |
| `src/components/DataProvider.jsx` | React context provider |
| `src/components/MapPanel.jsx` | GeoJSON consumer (choropleth) |
| `src/components/StatsPanel.jsx` | Division stats consumer |
| `src/components/ChartsPanel.jsx` | Chart data consumer |
| `src/components/Header.jsx` | Shows last-updated timestamp |
