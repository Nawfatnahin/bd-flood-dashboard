import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUpdatedData, getUpdateMetadata, forceRefresh } from '../data/dataEngine';

/* ─── Context ─── */
const DataContext = createContext(null);

/* ─── Provider ─── */
export function DataProvider({ children }) {
  const [data, setData] = useState(() => getUpdatedData());
  const [meta, setMeta] = useState(() => getUpdateMetadata());

  /* Auto-refresh on mount and when tab regains focus */
  const refresh = useCallback(() => {
    const fresh = getUpdatedData();
    setData(fresh);
    setMeta(getUpdateMetadata());
  }, []);

  useEffect(() => {
    /* Refresh on visibility change (user returns to tab) */
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    /* Periodic refresh every 30 min to catch interval expiry */
    const interval = setInterval(refresh, 30 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, [refresh]);

  const manualRefresh = useCallback(() => {
    const fresh = forceRefresh();
    setData(fresh);
    setMeta(getUpdateMetadata());
  }, []);

  return (
    <DataContext.Provider value={{ ...data, meta, refresh: manualRefresh }}>
      {children}
    </DataContext.Provider>
  );
}

/* ─── Hook ─── */
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
