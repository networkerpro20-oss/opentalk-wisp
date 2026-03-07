import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    socket = io(WS_URL, {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (token) {
    s.auth = { token };
    if (!s.connected) {
      s.connect();
    }
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
