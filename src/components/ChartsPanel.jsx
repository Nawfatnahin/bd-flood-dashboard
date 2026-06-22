import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from './DataProvider';

export default function ChartsPanel({ activeRegion }) {
  const isRegionView = !!activeRegion;
  const { chartData } = useData();

  const regionData = activeRegion
    ? activeRegion.flood_history.map((val, i) => ({
        year: `${2018 + i}`,
        incidents: val
      }))
    : [];

  const aggregateData = chartData.map(d => ({
    year: d.year,
    damage: d.damage,
    event: d.event
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg-2) 100%)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--r-sm)',
        padding: '10px 14px',
        fontFamily: 'var(--mono)',
        fontSize: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
      }}>
        <div style={{ color: 'var(--text-3)', marginBottom: '4px' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: 'var(--text)' }}>
            {p.name}: <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{p.value}{!isRegionView ? 'M $' : ''}</span>
          </div>
        ))}
        {!isRegionView && payload[0]?.payload?.event && (
          <div style={{ color: 'var(--text-3)', marginTop: '4px', fontSize: '10px' }}>
            Type: {payload[0].payload.event}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="panel-title">
        {isRegionView
          ? `${activeRegion.name} - Flood Incident History`
          : 'Regional Aggregate // Damage by Year ($M)'}
      </div>

      <div style={{ height: 'calc(100% - 40px)', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {isRegionView ? (
            <LineChart data={regionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="year"
                stroke="var(--text-3)"
                tick={{ fontSize: 10, fontFamily: 'var(--mono)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-3)"
                tick={{ fontSize: 10, fontFamily: 'var(--mono)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="incidents"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ fill: 'var(--accent)', r: 3 }}
                activeDot={{ r: 5, fill: 'var(--risk-high)' }}
              />
            </LineChart>
          ) : (
            <BarChart data={aggregateData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="year"
                stroke="var(--text-3)"
                tick={{ fontSize: 10, fontFamily: 'var(--mono)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-3)"
                tick={{ fontSize: 10, fontFamily: 'var(--mono)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="damage"
                fill="var(--accent)"
                opacity={0.8}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </>
  );
}
