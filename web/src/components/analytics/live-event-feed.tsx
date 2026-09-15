"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./socket-provider";
import { UserEvent } from "@/interface/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LiveEventFeed() {
  const { socket, isConnected } = useSocket();
  const [events, setEvents] = useState<UserEvent[]>([]);

  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit("admin:join");

    socket.on("admin:event", (event: UserEvent) => {
      setAuthError(null);
      setEvents((prev) => [event, ...prev].slice(0, 50));
    });

    socket.on("event:error", (data: any) => {
      if (data?.code === "FORBIDDEN" || data?.code === "AUTH_FAILED") {
        setAuthError(data.error || "Admin authentication required");
      }
    });

    return () => {
      socket.emit("admin:leave");
      socket.off("admin:event");
      socket.off("event:error");
    };
  }, [socket]);

  const getEventColor = (eventType: string) => {
    const colors: Record<string, string> = {
      USER_LOGIN: "bg-green-500",
      PAGE_VIEW: "bg-blue-500",
      PRODUCT_VIEW: "bg-purple-500",
      ADD_TO_CART: "bg-orange-500",
      REMOVE_FROM_CART: "bg-red-500",
      CHECKOUT_START: "bg-yellow-500",
      CHECKOUT_COMPLETE: "bg-green-600",
    };
    return colors[eventType] || "bg-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Event Feed</span>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] overflow-y-auto">
          {authError ? (
            <p className="text-destructive text-center py-8">
              {authError}
            </p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Waiting for events...
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.eventId}
                  className="border rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getEventColor(event.eventType)}>
                      {event.eventType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong>User:</strong>{" "}
                      <span title={event.userId}>{shortenId(event.userId)}</span>
                    </p>
                    {event.page && (
                      <p>
                        <strong>Page:</strong> {event.page}
                      </p>
                    )}
                    {event.metadata &&
                      Object.keys(event.metadata).length > 0 && (
                        <EventMetadata metadata={event.metadata} />
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function shortenId(id: string): string {
  if (id.length <= 18) return id;
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

function summarizeUserAgent(ua: string): string {
  const os = /Mac OS X/i.test(ua)
    ? "macOS"
    : /Windows/i.test(ua)
      ? "Windows"
      : /Android/i.test(ua)
        ? "Android"
        : /iPhone|iPad/i.test(ua)
          ? "iOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Unknown OS";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  return `${browser} on ${os}`;
}

function formatMetaValue(key: string, value: unknown): string {
  if (value == null) return "";
  if (key === "userAgent" && typeof value === "string") {
    return summarizeUserAgent(value);
  }
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (text.length > 72) return `${text.slice(0, 69)}…`;
  return text;
}

function EventMetadata({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );
  if (entries.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {entries.map(([key, value]) => (
        <p key={key} className="break-words">
          <strong className="capitalize">{key}:</strong> {formatMetaValue(key, value)}
        </p>
      ))}
    </div>
  );
}
