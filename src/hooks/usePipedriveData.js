import { useState, useCallback, useEffect } from 'react';

/**
 * Fetches Pipedrive CRM data from the server-side proxy.
 * @param {number} year
 * @param {number} month  0-indexed (January = 0) to match JS Date convention
 */
export default function usePipedriveData(year, month) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pipedrive?year=${year}&month=${month + 1}`);
      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error(`Server returned non-JSON response (status ${res.status}). Check that PIPEDRIVE_API_TOKEN is set in your environment variables.`);
      }
      if (!res.ok) throw new Error(json.error || 'Failed to fetch Pipedrive data');
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
