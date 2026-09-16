"use client";

import { getBackendUrl } from "@/lib/backend-url";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { UserEvent } from "@/interface/analytics";
import { hasAnalyticsConsent } from "@/lib/consent";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitEvent: (event: Omit<UserEvent, "eventId" | "timestamp">) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emitEvent: () => {},
});

export const useSocket = () => useContext(SocketContext);

const MAX_QUEUE_SIZE = 50;

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queueRef = useRef<UserEvent[]>([]);

  useEffect(() => {
    const backendUrl = getBackendUrl();
    const socketInstance = io(backendUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected to:", backendUrl);
      setIsConnected(true);

      // Flush queued events on connect
      if (queueRef.current.length > 0) {
        console.log(`[Socket] Flushing ${queueRef.current.length} queued events`);
        while (queueRef.current.length > 0) {
          const queued = queueRef.current.shift();
          if (queued) {
            socketInstance.emit("user:event", queued);
          }
        }
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socketInstance.on("event:ack", (data) => {
      console.log("Event acknowledged:", data.eventId);
    });

    socketInstance.on("event:error", (data) => {
      console.error("Event error:", data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const emitEvent = useCallback(
    (event: Omit<UserEvent, "eventId" | "timestamp">) => {
      // Respect user's cookie choice: storefront analytics require consent.
      // Admin operational telemetry bypasses cookie consent.
      const isAdminDomain = event.domain === "admin" || (event.page && event.page.startsWith("/admin"));
      if (!isAdminDomain && !hasAnalyticsConsent()) {
        return;
      }

      const fullEvent: UserEvent = {
        ...event,
        eventId: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        timestamp: new Date().toISOString(),
      };

      if (!socket || !isConnected) {
        // Buffer event for replay when connected
        if (queueRef.current.length >= MAX_QUEUE_SIZE) {
          queueRef.current.shift(); // Drop oldest event if capacity reached
        }
        queueRef.current.push(fullEvent);
        console.warn("[Socket] Socket not connected, event queued (queue size: " + queueRef.current.length + ")");
        return;
      }

      socket.emit("user:event", fullEvent);
    },
    [socket, isConnected]
  );

  return (
    <SocketContext.Provider value={{ socket, isConnected, emitEvent }}>
      {children}
    </SocketContext.Provider>
  );
}
