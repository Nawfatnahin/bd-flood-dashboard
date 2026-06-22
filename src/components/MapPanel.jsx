import React, { useState } from 'react';
import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet';
import { useData } from './DataProvider';

export default function MapPanel({ onRegionSelect, activeRegion }) {
  const [mapError, setMapError] = useState(false);
  const { geoData } = useData();
  const center = [23.685, 90.3563]; // Bangladesh center

  const style = (feature) => {
    const risk = feature.properties.risk_level;
    const isActive = activeRegion && activeRegion.name === feature.properties.name;

    let color = 'var(--risk-low)'; // Low
    if (risk === 'High') color = 'var(--risk-high)';
    if (risk === 'Medium') color = 'var(--risk-med)';

    // Resolve CSS variable to actual color
    const colorMap = {
      'var(--risk-high)': '#e05050',
      'var(--risk-med)': '#d4a04a',
      'var(--risk-low)': '#6aaa7a'
    };
    const fill = colorMap[color] || '#6aaa7a';

    return {
      fillColor: fill,
      weight: isActive ? 3 : 1,
      opacity: 1,
      color: isActive ? '#d4774e' : 'rgba(255,255,255,0.15)',
      fillOpacity: isActive ? 0.75 : 0.45,
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.bindPopup(
      `<div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6;">
        <strong style="color: #d4774e;">${feature.properties.name}</strong><br/>
        Risk: ${feature.properties.risk_level}<br/>
        Pop: ${(feature.properties.population / 1000000).toFixed(1)}M
      </div>`,
      { className: 'terminal-popup' }
    );

    layer.on({
      mouseover: (e) => {
        const isActive = activeRegion && activeRegion.name === feature.properties.name;
        e.target.setStyle({
          weight: isActive ? 3 : 2,
          fillOpacity: 0.75,
        });
      },
      mouseout: (e) => {
        const isActive = activeRegion && activeRegion.name === feature.properties.name;
        e.target.setStyle({
          weight: isActive ? 3 : 1,
          fillOpacity: isActive ? 0.75 : 0.45,
        });
      },
      click: () => {
        onRegionSelect(feature.properties);
      }
    });
  };

  if (mapError) {
    return (
      <>
        <div className="panel-title">Choropleth Overlay</div>
        <div className="map-error">
          <div className="map-error-icon">&#9888;</div>
          <div>GeoJSON parse error &mdash; data layer unavailable</div>
          <div style={{ marginTop: '8px', fontSize: '11px' }}>
            Check src/data/mockData.js for malformed geometry
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="panel-title">Choropleth Overlay</div>
      <div style={{
        height: 'calc(100% - 40px)',
        width: '100%',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 'var(--r-sm)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <MapContainer
          center={center}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &amp; <a href="https://carto.com/">CARTO</a>'
          />
          <GeoJSON
            key={activeRegion ? activeRegion.name : 'none'}
            data={geoData}
            style={style}
            onEachFeature={onEachFeature}
          />
        </MapContainer>

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'rgba(18,20,31,0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--r-sm)',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          pointerEvents: 'none'
        }}>
          <div style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-2)',
            marginBottom: '2px'
          }}>
            Risk Level
          </div>
          {[
            { label: 'Low', color: '#6aaa7a' },
            { label: 'Medium', color: '#d4a04a' },
            { label: 'High', color: '#e05050' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: item.color,
                opacity: 0.85
              }} />
              <span style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '12px',
                color: 'var(--text)',
                fontWeight: 500
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
