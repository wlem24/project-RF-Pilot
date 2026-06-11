// src/hooks/useAsync.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook that wraps any async function with loading/error/data state.
 * Usage: const { data, loading, error, refetch } = useAsync(() => rfpApi.getById(id), [id]);
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: false, error: null });

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fn();
      // Support both axios (res.data) and plain values
      const data = res?.data !== undefined ? res.data : res;
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState({ data: null, loading: false, error: e.message || 'An error occurred' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { ...state, refetch: run };
}

/**
 * Async hook that only fires when a condition is met (e.g. id is defined).
 */
export function useAsyncWhen(condition, fn, deps = []) {
  return useAsync(condition ? fn : () => Promise.resolve(null), [condition, ...deps]);
}
