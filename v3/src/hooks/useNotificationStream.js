import { useEffect, useRef } from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const POLL_FALLBACK_MS = 30_000;

/**
 * Opens an SSE stream for real-time notifications.
 * Falls back to polling every 30 s if SSE fails.
 * Call `onEvent(data)` with whatever the caller wants to do on each event.
 */
export function useNotificationStream(onEvent) {
  const esRef      = useRef(null);
  const pollRef    = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    function startPolling() {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        onEventRef.current?.({ type: 'poll' });
      }, POLL_FALLBACK_MS);
    }

    function openSSE() {
      if (esRef.current) esRef.current.close();

      const url = `${BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
      const es  = new EventSource(url);

      es.onopen = () => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      };

      es.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'ping' || data.type === 'connected') return;
          onEventRef.current?.(data);
        } catch (_) {}
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        startPolling();
        // Retry SSE after 30 s
        setTimeout(openSSE, POLL_FALLBACK_MS);
      };

      esRef.current = es;
    }

    openSSE();

    return () => {
      esRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);
}
