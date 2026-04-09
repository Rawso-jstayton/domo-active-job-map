# ryuu.js SDK Reference

Read this file when you need exact API signatures for ryuu.js methods.

## Installation and Import

```typescript
import Domo from 'ryuu.js';
import type { Filter, Variable, RequestOptions } from 'ryuu.js';
```

## Data Fetching

```typescript
// Fetch dataset by manifest alias (returns array of objects)
const sales = await Domo.get('/data/v1/sales');

// With query parameters
const filtered = await Domo.get('/data/v1/sales', {
  query: {
    limit: 1000,
    offset: 0,
    fields: 'id,amount,date',
    filter: 'date > "2024-01-01"',
  },
});

// Multiple formats
const csv = await Domo.get('/data/v1/sales', { format: 'csv' });
const arrays = await Domo.get('/data/v1/sales', { format: 'array-of-arrays' });
const excel = await Domo.get('/data/v1/sales', { format: 'excel' }); // Blob

// Parallel fetching (use this for multiple datasets)
const [sales, customers, products] = await Domo.getAll([
  '/data/v1/sales',
  '/data/v1/customers',
  '/data/v1/products',
]);

// SQL queries
const totals = await Domo.post(
  '/sql/v1/sales',
  'SELECT category, SUM(amount) as total FROM sales GROUP BY category',
  { contentType: 'text/plain' }
);
```

## Environment Context

```typescript
console.log(Domo.env.userId);      // Current user ID
console.log(Domo.env.customer);    // Instance name (e.g., 'rawso')
console.log(Domo.env.pageId);      // Current page ID
console.log(Domo.env.locale);      // e.g., 'en-US'
console.log(Domo.env.platform);    // 'desktop' | 'mobile'
console.log(Domo.env.environment); // Instance env, e.g., 'prod', 'dev3'

// For SECURE user identification, always verify via API:
const verifiedUser = await Domo.get('/domo/environment/v1/');
```

## Event Listeners

All listeners return an unsubscribe function.

```typescript
// Dataset was refreshed in DOMO
const unsub1 = Domo.onDataUpdated((alias: string) => {
  console.log(`Dataset ${alias} updated — reloading`);
  loadData();
});

// Page-level filters changed (from other cards or filter bar)
const unsub2 = Domo.onFiltersUpdated((filters: Filter[]) => {
  const categoryFilter = filters.find(f => f.column === 'category');
  if (categoryFilter) {
    applyFilter(categoryFilter.values);
  }
});

// Page variables changed
const unsub3 = Domo.onVariablesUpdated((variables) => {
  const theme = variables['392']?.parsedExpression.value;
  if (theme) setTheme(theme);
});

// Custom data from another app on the same page
const unsub4 = Domo.onAppDataUpdated((data) => {
  if (data.action === 'highlight') highlightRow(data.rowId);
});

// Cleanup in useEffect
useEffect(() => {
  const unsub = Domo.onFiltersUpdated(handleFilters);
  return () => unsub();
}, []);
```

> **Gotcha:** The correct method is `Domo.onFiltersUpdated` (with the `-d` suffix).
> `Domo.onFiltersUpdate` (no `-d`) is a deprecated alias that silently fails to
> register in newer ryuu.js versions — no error, no callback. Always use the
> `-Updated` suffix for all event listeners.

## Filter Object Structure

```typescript
interface Filter {
  column: string;        // Column name
  operator: string;      // 'IN', 'NOT_IN', 'GREATER_THAN', 'BETWEEN', etc.
  values: any[];         // Filter values
  dataType: string;      // 'STRING', 'NUMERIC', 'DATE', 'DATETIME'
  dataSourceId?: string; // Source dataset ID
  label?: string;        // Display label
}
```

## Sending Updates

```typescript
// Update page filters (affects all cards on the page)
Domo.requestFiltersUpdate(
  [{ column: 'category', operator: 'IN', values: ['Alert'], dataType: 'STRING' }],
  true,  // update page state (true) or just card state (false)
  () => console.log('acknowledged'),
  (response) => console.log('completed', response),
);

// Update page variables
Domo.requestVariablesUpdate([
  { functionId: 123, value: 100 },
  { functionId: 124, value: 'dark' },
]);

// Send data to other apps on the same page
Domo.requestAppDataUpdate({
  action: 'highlight',
  rowId: 42,
});
```

## Navigation

```typescript
// Navigate within DOMO (same tab)
Domo.navigate('/page/123456789');

// Navigate within DOMO (new tab)
Domo.navigate('/profile/3234', true);

// Navigate to external URL (new tab) — domain must be whitelisted
Domo.navigate('https://external-site.com/path', true);
```

**Plain `<a href>` does not work** inside DOMO custom apps — the iframe
sandbox blocks standard link navigation. You must use `Domo.navigate()`.

```tsx
// React pattern — href is decorative; Domo.navigate does the work
<a
  href={url}
  onClick={(e) => {
    e.preventDefault();
    Domo.navigate(url, true);
  }}
>
  Link text
</a>
```

**External link whitelisting (required for any non-DOMO URL):**
External domains must be added via DOMO Admin → Custom Apps Authorized Domains.
Without whitelisting, navigation silently fails. Each domain/subdomain added separately.

## CRUD with AppDB / DataStore

```typescript
// Create document
await Domo.post('/domo/datastores/v1/collections/users/documents/', {
  name: 'John', email: 'john@example.com'
});

// Read documents
const docs = await Domo.get('/domo/datastores/v1/collections/users/documents/');

// Update document
await Domo.put('/domo/datastores/v1/collections/users/documents/abc123', {
  name: 'Jane', role: 'Manager'
});

// Delete document
await Domo.delete('/domo/datastores/v1/collections/users/documents/abc123');
```

Requires `collections` and `proxyId` in manifest.json. See cli-setup skill.

## Custom React Hook Pattern

```typescript
// hooks/useDomoData.ts
import { useState, useEffect } from 'react';
import Domo from 'ryuu.js';

export function useDomoData<T>(alias: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await Domo.get(`/data/v1/${alias}`);
        if (!cancelled) setData(result as T[]);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    // Re-fetch when dataset updates
    const unsub = Domo.onDataUpdated((updatedAlias) => {
      if (updatedAlias === alias) fetchData();
    });

    return () => { cancelled = true; unsub(); };
  }, [alias]);

  return { data, loading, error };
}

// Usage
const { data: sales, loading } = useDomoData<SalesRecord>('sales');
```
