import React, { useState } from 'react';
import Header from './components/Header';
import MapPanel from './components/MapPanel';
import StatsPanel from './components/StatsPanel';
import ChartsPanel from './components/ChartsPanel';
import { DataProvider } from './components/DataProvider';

export default function App() {
  const [activeRegion, setActiveRegion] = useState(null);

  return (
    <DataProvider>
      <div className="app-container">
        <Header activeRegion={activeRegion} />
        <main className="dashboard-grid">
          <div className="panel" style={{ gridColumn: '1', gridRow: '1' }}>
            <MapPanel onRegionSelect={setActiveRegion} activeRegion={activeRegion} />
          </div>

          <div className="panel" style={{
            gridColumn: '2',
            gridRow: '1 / span 2',
            overflowY: 'auto'
          }}>
            <StatsPanel activeRegion={activeRegion} onRegionSelect={setActiveRegion} />
          </div>

          <div className="panel" style={{ gridColumn: '1', gridRow: '2' }}>
            <ChartsPanel activeRegion={activeRegion} />
          </div>
        </main>
      </div>
    </DataProvider>
  );
}
