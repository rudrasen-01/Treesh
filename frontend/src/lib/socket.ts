import { io, Socket } from "socket.io-client";
import { getSocketUrl } from "@/config/env";

let socket: Socket | null = null;

export const getSocket = () => {
  if (socket) return socket;

  const url = getSocketUrl();
  
  const token = localStorage.getItem("token");
  socket = io(url, {
    autoConnect: false,
    transports: ["websocket"],
    auth: {
      token,
    },
  });
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  const latestToken = localStorage.getItem("token") || undefined;
  // Update auth token if changed and reconnect if necessary
  const currentToken = (s as any).auth?.token;
  if (currentToken !== latestToken) {
    (s as any).auth = { token: latestToken } as any;
    if (s.connected) {
      s.disconnect();
    }
  }
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) socket.disconnect();
};
