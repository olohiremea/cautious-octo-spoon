import { useState, useCallback, useEffect } from 'react';

/**
 * Fetches GA4 organic social traffic data from the server-side proxy.
 * @param {number} year
 * @param {number} month  0-indexed (January = 0) to match JS Date convention
 */
export default function useGA4Data(year, month) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // month + 1 converts from 0-indexed JS month to 1-indexed API param
      const res = await fetch(`/api/ga4?year=${year}&month=${month + 1}`);
      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error(`Server returned non-JSON response (status ${res.status}). Check that GA4_PROPERTY_ID and GA4_SERVICE_ACCOUNT_JSON are set in your environment variables.`);
      }
      if (!res.ok) throw new Error(json.error || 'Failed to fetch GA4 data');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
