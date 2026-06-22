import React, { useState, useEffect, useRef } from 'react';
import { useData } from './DataProvider';

/* ─── BDT Clock ─── */
function BDTClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const bdt = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  return bdt.toLocaleTimeString('en-US', { hour12: false }) + ' BDT';
}

export default function Header({ activeRegion }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const infoRef = useRef(null);
  const { meta, refresh } = useData();

  useEffect(() => {
    function handleClick(e) {
      if (infoRef.current && !infoRef.current.contains(e.target)) {
        setInfoOpen(false);
      }
    }
    if (infoOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [infoOpen]);

  return (
    <>
      <header className="app-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        background: 'linear-gradient(135deg, rgba(24, 27, 38, 0.8) 0%, rgba(16, 17, 26, 0.95) 100%)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 100
      }}>
        {/* ─── Left: Title + Info ─── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <div className="app-header-sub" style={{
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: '2px'
            }}>
              GeoSpatial Terminal
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="app-header-title" style={{
                fontFamily: 'var(--serif)',
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                color: 'var(--text)',
                margin: 0
              }}>
                Bangladesh Flood Vulnerability Matrix
              </h1>

              {/* Info Button */}
              <button onClick={() => setInfoOpen(!infoOpen)} style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid rgba(212,119,78,0.4)',
                background: 'rgba(212,119,78,0.1)',
                color: 'var(--accent)',
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '16px',
                fontWeight: 700,
                fontStyle: 'italic',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s var(--ease)',
                lineHeight: 1,
                padding: 0,
                flexShrink: 0
              }}
                onMouseEnter={e => { e.target.style.background = 'rgba(212,119,78,0.2)'; e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 12px rgba(212,119,78,0.2)'; }}
                onMouseLeave={e => { e.target.style.background = 'rgba(212,119,78,0.1)'; e.target.style.borderColor = 'rgba(212,119,78,0.4)'; e.target.style.boxShadow = 'none'; }}
              >
                i
              </button>
            </div>
          </div>
        </div>

        {/* ─── Center/Right: Info Pills ─── */}
        <div className="header-pills" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          {/* Data Sources Pill */}
          <div className="header-pill" style={pillStyle}>
            <span className="header-pill-label" style={pillLabelStyle}>
              Data Sources
            </span>
            <span className="header-pill-value" style={{
              fontFamily: 'var(--sans)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text)'
            }}>
              GADM · WorldPop · BWDB
            </span>
          </div>

          {/* BDT Clock Pill */}
          <div className="header-pill" style={pillStyle}>
            <span className="header-pill-label" style={pillLabelStyle}>
              Live Sync
            </span>
            <span className="header-pill-value" style={{
              fontFamily: 'var(--mono)',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--accent)'
            }}>
              <BDTClock />
            </span>
          </div>

          {/* Data Freshness Pill */}
          <div className="header-pill" style={{
            ...pillStyle,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
            onClick={refresh}
            title="Click to force refresh all data"
          >
            <span className="header-pill-label" style={pillLabelStyle}>
              Last Updated
            </span>
            <span className="header-pill-value" style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '12px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: 'var(--text)',
              lineHeight: 1.3
            }}>
              {meta.lastFullUpdate !== 'Never'
                ? meta.lastFullUpdate
                : 'Updating\u2026'}
            </span>
          </div>

        </div>
      </header>

      {/* Info Popup Modal — rendered outside header to avoid clipping */}
      {infoOpen && (
        <>
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            zIndex: 999
          }} onClick={() => setInfoOpen(false)} />
          <div ref={infoRef} style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            background: 'var(--bg)',
            border: '1px solid rgba(212,119,78,0.2)',
            borderRadius: 'var(--r-lg)',
            padding: '36px 40px 32px',
            maxWidth: '560px',
            width: '90vw',
            maxHeight: 'min(85vh, 620px)',
            overflowY: 'auto',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(212,119,78,0.04)'
          }}>
            {/* Close button */}
            <button onClick={() => setInfoOpen(false)} style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: 'var(--text-3)',
              fontSize: '22px',
              cursor: 'pointer',
              fontFamily: 'var(--sans)',
              lineHeight: 1,
              padding: '4px 10px',
              borderRadius: '6px',
              transition: 'color 0.2s'
            }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-3)'}
            >
              ✕
            </button>

            {/* Title */}
            <h2 style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--accent)',
              margin: '0 0 6px 0'
            }}>
              About This Dashboard
            </h2>

            {/* Content */}
            <div style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: '15px',
              lineHeight: '1.75',
              color: 'var(--text)'
            }}>
              <p style={{ margin: '16px 0' }}>
                This dashboard gives you a real time look at the flood situation across all eight divisions of Bangladesh. It brings together satellite data ground reports and historical records so you can see which areas are at risk right now.
              </p>

              <p style={{ margin: '16px 0' }}>
                <strong style={{ color: 'var(--accent)' }}>The map</strong> shows each division colored by its flood risk level from low to critical. Click any region to see its detailed metrics.
              </p>

              <p style={{ margin: '16px 0' }}>
                <strong style={{ color: 'var(--accent)' }}>The stats panel</strong> displays key numbers like population impact infrastructure gaps and vulnerability scores for the selected region or the whole country.
              </p>

              <p style={{ margin: '16px 0' }}>
                <strong style={{ color: 'var(--accent)' }}>The charts</strong> track flood history and damage trends so you can compare how different divisions have been affected over time.
              </p>

              <p style={{ margin: '16px 0' }}>
                <strong style={{ color: 'var(--accent)' }}>The live feed</strong> pulls the latest situation reports and news so you stay informed about what is happening on the ground.
              </p>

              <div style={{
                marginTop: '24px',
                paddingTop: '18px',
                borderTop: '1px solid rgba(255,255,255,0.08)'
              }}>
                <h3 style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: '0 0 10px 0'
                }}>
                  Data Sources
                </h3>
                <p style={{ margin: '10px 0', color: 'var(--text)' }}>
                  We use data from GADM for administrative boundaries WorldPop for population estimates and the Bangladesh Water Development Board for river levels and flood forecasts. News reports come from the Knowivate API and curated local sources.
                </p>
              </div>

              <div style={{
                marginTop: '20px',
                padding: '16px 20px',
                background: 'rgba(212,119,78,0.08)',
                borderRadius: 'var(--r-sm)',
                borderLeft: '3px solid var(--accent)'
              }}>
                <p style={{ margin: 0, color: 'var(--text)', fontSize: '15px' }}>
                  <strong style={{ color: 'var(--accent)' }}>Why this matters:</strong> Bangladesh faces some of the worst flooding in the world. This tool helps anyone from disaster response teams to local communities understand the risks and make better decisions when it counts.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const pillStyle = {
  display: 'flex',
  flexDirection: 'column',
  padding: '8px 16px',
  borderRadius: '12px',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderTop: '2px solid var(--accent)',
  boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.02), 0 4px 10px rgba(0,0,0,0.4)',
  minWidth: '120px'
};

const pillLabelStyle = {
  fontFamily: 'var(--mono)',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: 'var(--text-2)',
  marginBottom: '3px'
};
