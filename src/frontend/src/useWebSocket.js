import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:8000/ws/dashboard';
const RECONNECT_DELAY_MS = 3000;

export const WS_STATUS = {
  CONECTANDO:    'Conectando...',
  CONECTADO:     'Conectado',
  DESCONECTADO:  'Desconectado',
  RECONECTANDO:  'Reconectando...',
};

export function useWebSocket() {
  const [status, setStatus]       = useState(WS_STATUS.CONECTANDO);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef    = useRef(null);
  const timerRef = useRef(null);
  const destroyed = useRef(false);

  const connect = useCallback(() => {
    if (destroyed.current) return;

    setStatus(WS_STATUS.CONECTANDO);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (destroyed.current) return;
      setStatus(WS_STATUS.CONECTADO);
    };

    ws.onmessage = (event) => {
      if (destroyed.current) return;
      try {
        setLastMessage(JSON.parse(event.data));
      } catch {
        setLastMessage(event.data);
      }
    };

    ws.onclose = () => {
      if (destroyed.current) return;
      setStatus(WS_STATUS.RECONECTANDO);
      timerRef.current = setTimeout(() => connect(), RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    destroyed.current = false;
    connect();
    return () => {
      destroyed.current = true;
      clearTimeout(timerRef.current);
      wsRef.current?.close();
      setStatus(WS_STATUS.DESCONECTADO);
    };
  }, [connect]);

  return { status, lastMessage };
}
