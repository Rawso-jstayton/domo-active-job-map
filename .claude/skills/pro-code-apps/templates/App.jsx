// App.jsx — DOMO Custom App Starter (React)
// See pro-code-apps skill for full architecture reference
// See libraries skill for stack details (React + ECharts + shadcn/ui)

import { useState, useEffect } from 'react';
import Domo from 'ryuu.js';
import ReactECharts from 'echarts-for-react';

// ============================================================
// DOMO Data Hook
// Reusable hook for fetching data from mapped datasets.
// Aliases are defined in manifest.json mapping.
// ============================================================

function useDomoData(alias, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const params = new URLSearchParams();

      if (options.fields) params.append('fields', options.fields.join(','));
      if (options.filter) params.append('filter', options.filter);
      if (options.groupby) params.append('groupby', options.groupby.join(','));
      if (options.orderby) params.append('orderby', options.orderby);
      if (options.limit) params.append('limit', options.limit);

      const queryString = params.toString();
      const url = `/data/v1/${alias}${queryString ? '?' + queryString : ''}`;

      try {
        const result = await Domo.get(url);
        if (!cancelled) setData(result);
      } catch (err) {
        console.error(`Failed to fetch data from ${alias}:`, err);
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    // Re-fetch when the dataset updates in DOMO
    const unsub = Domo.onDataUpdated((updatedAlias) => {
      if (updatedAlias === alias) fetchData();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [alias]);

  return { data, loading, error };
}

// ============================================================
// Main App Component
// ============================================================

export default function App() {
  // Fetch data — replace 'ALIAS_NAME' with your manifest.json alias
  // const { data, loading, error } = useDomoData('ALIAS_NAME');

  // Placeholder until data is connected
  const loading = false;
  const error = null;
  const data = null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load data. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">APP_NAME</h1>

      {/* Example ECharts component — replace with real chart */}
      {/* <ReactECharts option={chartOption} theme="rawso-dark" style={{ height: '400px' }} /> */}

      <p className="text-muted-foreground">
        App loaded. Connect datasets in manifest.json and build your views.
      </p>
    </div>
  );
}

// ============================================================
// DOMO Filter Handling (responds to dashboard filter changes)
// ============================================================

// Uncomment in useEffect when ready to handle dashboard filters:
// const unsub = Domo.onFiltersUpdated((filters) => {
//   console.log('Filters updated:', filters);
//   // Trigger re-fetch or update React state
// });
// return () => unsub();
