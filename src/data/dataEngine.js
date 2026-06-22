/* ═══════════════════════════════════════════════════════════
   DATA ENGINE — Cadence-Based Auto Update System
   Each data type has a defined update interval:
     • static    — never changes
     • monthly   — updates every 30 days
     • yearly    — updates every 365 days
   ════════════════════════════════════════════════════════════ */

import { bdGeoData, chartData as baseChartData } from './mockData';

/* ─── Configuration ─── */
const CADENCE = {
  STATIC:   { intervalMs: Infinity,        label: 'static' },
  MONTHLY:  { intervalMs: 30 * 86400000,   label: 'monthly' },
  YEARLY:   { intervalMs: 365 * 86400000,  label: 'yearly'  },
};

const CACHE_KEY = 'bd_flood_engine_cache';
const META_KEY  = 'bd_flood_engine_meta';

const POPULATION_GROWTH_RATE = 0.0122; // Bangladesh annual growth

/* ─── Storage Helpers ─── */
function getMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; }
  catch { return {}; }
}

function setMeta(m) {
  localStorage.setItem(META_KEY, JSON.stringify(m));
}

function getCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)); }
  catch { return null; }
}

function setCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

/* ─── Season Detection ─── */
function isMonsoon() {
  const m = new Date().getMonth();
  return m >= 5 && m <= 8; // June–September
}

function monsoonPeak() {
  const m = new Date().getMonth();
  if (m === 6 || m === 7) return 1.0;  // Jul–Aug peak
  if (m === 5 || m === 8) return 0.85; // Jun, Sep shoulder
  return 0.65;                          // Dry season
}

/* ─── Interval Check ─── */
function isStale(key, cadence) {
  if (cadence.intervalMs === Infinity) return false;
  const meta = getMeta();
  const ts = meta[key];
  return !ts || (Date.now() - ts > cadence.intervalMs);
}

function touch(key) {
  const meta = getMeta();
  meta[key] = Date.now();
  setMeta(meta);
}

/* ─── Deterministic Seeded RNG ─── */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/* ─── Geo Data Updater ─── */
function updateGeoData(features) {
  const now = new Date();
  const yearSeed = now.getFullYear();
  const monthSeed = now.getFullYear() * 12 + now.getMonth();

  return features.map(f => {
    const p = { ...f.properties };
    const name = p.name;

    /* ── Yearly: Population ── */
    if (isStale(`pop_${name}`, CADENCE.YEARLY)) {
      const rng = seededRandom(yearSeed + name.charCodeAt(0));
      const growth = 1 + POPULATION_GROWTH_RATE * (0.95 + rng() * 0.1);
      p.population = Math.round(p.population * growth);
      touch(`pop_${name}`);
    }

    /* ── Monthly: Flood History ── */
    if (isStale(`fh_${name}`, CADENCE.MONTHLY)) {
      const rng = seededRandom(monthSeed + name.length * 7);
      const peak = monsoonPeak();
      p.flood_history = p.flood_history.map((val, i) => {
        const base = val;
        const seasonal = base * peak;
        const drift = (rng() - 0.45) * 4;
        return Math.max(1, Math.round(seasonal + drift));
      });
      touch(`fh_${name}`);
    }

    /* ── Monthly: Infrastructure Gap ── */
    if (isStale(`infra_${name}`, CADENCE.MONTHLY)) {
      const rng = seededRandom(monthSeed + name.length * 13);
      const current = parseInt(p.infrastructure_gap);
      const improvement = rng() * 0.4; // 0–0.4% improvement per month
      p.infrastructure_gap = Math.max(5, Math.round(current - improvement)) + '%';
      touch(`infra_${name}`);
    }

    /* ── Monthly: Risk Level ── */
    if (isStale(`risk_${name}`, CADENCE.MONTHLY)) {
      const recent = p.flood_history.slice(-3);
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      if (avg > 18)      p.risk_level = 'High';
      else if (avg > 10) p.risk_level = 'Medium';
      else                p.risk_level = 'Low';
      touch(`risk_${name}`);
    }

    return { ...f, properties: p };
  });
}

/* ─── Chart Data Updater ─── */
function updateChartData(data) {
  const now = new Date();
  const latestYear = parseInt(data[data.length - 1].year);

  /* Add new year if we've crossed into a new calendar year */
  if (now.getFullYear() > latestYear) {
    const gap = now.getFullYear() - latestYear;
    for (let i = 1; i <= gap; i++) {
      const prevVal = data[data.length - 1].damage;
      const rng = seededRandom(now.getFullYear() * 31);
      const growth = 1 + 0.08 + rng() * 0.12; // 8–20% increase
      const events = ['Monsoon', 'Flash Flood', 'Cyclone'];
      const event = events[Math.floor(rng() * 3)];
      data.push({
        year: String(latestYear + i),
        event,
        damage: Math.round(prevVal * growth),
      });
    }
  }

  /* Yearly: drift existing values for current year */
  if (isStale('chart_damage', CADENCE.YEARLY)) {
    const rng = seededRandom(now.getFullYear() * 17);
    data = data.map(d => {
      const drift = 1 + (rng() - 0.45) * 0.06;
      return { ...d, damage: Math.round(d.damage * drift) };
    });
    touch('chart_damage');
  }

  return data;
}

/* ─── Main Update Orchestrator ─── */
export function getUpdatedData() {
  const cached = getCache();

  /* Quick freshness check — if nothing is stale, return cached */
  const needsUpdate = [
    { key: 'geo_monthly', cad: CADENCE.MONTHLY, items: bdGeoData.features },
  ].some(({ key, cad }) => isStale(key, cad));

  if (cached && !needsUpdate) {
    return cached;
  }

  /* Compute fresh data */
  const updatedFeatures = updateGeoData(bdGeoData.features);
  const updatedChart    = updateChartData([...baseChartData]);

  const result = {
    geoData: { ...bdGeoData, features: updatedFeatures },
    chartData: updatedChart,
    timestamp: Date.now(),
  };

  setCache(result);
  return result;
}

/* ─── Metadata Getters ─── */
export function getUpdateMetadata() {
  const meta = getMeta();
  const now = Date.now();
  const fmt = ts => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const entries = Object.entries(meta).map(([key, ts]) => ({
    key,
    lastUpdated: fmt(ts),
    age: Math.round((now - ts) / 86400000), // days
    stale: isStale(key, key.includes('pop') ? CADENCE.YEARLY : CADENCE.MONTHLY),
  }));

  return {
    lastFullUpdate: entries.length > 0
      ? fmt(Math.min(...Object.values(meta)))
      : 'Never',
    entries,
  };
}

/* ─── Force Refresh (for UI trigger) ─── */
export function forceRefresh() {
  localStorage.removeItem(CACHE_KEY);
  Object.keys(getMeta()).forEach(k => {
    const meta = getMeta();
    delete meta[k];
    setMeta(meta);
  });
  return getUpdatedData();
}
