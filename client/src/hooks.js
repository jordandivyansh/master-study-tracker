import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

/**
 * Load a URL from the API and keep it in state.
 *   const { data, setData, error, loading, reload } = useResource('/tests');
 * `setData` lets a page patch one row locally after a save, without refetching.
 */
export function useResource(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.get(url));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, error, loading, reload };
}

/**
 * Save one row and swap the server's (re-derived) version into a list.
 * Replacing by _id is O(n); fine for lists of a few hundred rows.
 */
export function usePatchRow(baseUrl, setList, onError) {
  return useCallback(
    async (row, changes) => {
      try {
        const saved = await api.patch(`${baseUrl}/${row._id}`, changes);
        setList((list) => list.map((r) => (r._id === saved._id ? saved : r)));
      } catch (e) {
        onError?.(e.message);
      }
    },
    [baseUrl, setList, onError],
  );
}
