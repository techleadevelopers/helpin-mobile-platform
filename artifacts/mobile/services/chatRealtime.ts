import { getStoredAccessToken } from '@/services/secureSession';
import { createZooHelpApi } from '@/services/zoohelpApi';

export type ChatRealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'closed';

export interface ChatRealtimeEvent {
  roomId: string;
  messageId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export function connectChatRoom(
  roomId: string,
  handlers: {
    onMessage: (event: ChatRealtimeEvent) => void;
    onStatus?: (status: ChatRealtimeStatus) => void;
  },
) {
  let socket: WebSocket | null = null;
  let closedByClient = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempts = 0;

  const setStatus = (status: ChatRealtimeStatus) => handlers.onStatus?.(status);

  async function open() {
    const api = createZooHelpApi();
    const token = await getStoredAccessToken();
    if (!api || !token || closedByClient) {
      setStatus('closed');
      return;
    }

    setStatus(attempts === 0 ? 'connecting' : 'reconnecting');
    socket = new WebSocket(api.chatWebSocketUrl(roomId, token));

    socket.onopen = () => {
      attempts = 0;
      setStatus('connected');
    };

    socket.onmessage = (message) => {
      try {
        const payload = JSON.parse(String(message.data)) as ChatRealtimeEvent;
        if (payload.roomId === roomId && payload.messageId) {
          handlers.onMessage(payload);
        }
      } catch {
        // Ignore malformed realtime frames; REST remains the source of truth.
      }
    };

    socket.onerror = () => {
      socket?.close();
    };

    socket.onclose = () => {
      socket = null;
      if (closedByClient) {
        setStatus('closed');
        return;
      }
      attempts += 1;
      const delay = Math.min(1000 * attempts, 8000);
      setStatus('reconnecting');
      reconnectTimer = setTimeout(open, delay);
    };
  }

  open().catch(() => {
    setStatus('reconnecting');
    reconnectTimer = setTimeout(open, 1500);
  });

  return {
    close() {
      closedByClient = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    },
  };
}
