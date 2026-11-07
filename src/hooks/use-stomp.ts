"use client";

import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_URL } from "@/lib/api";

/**
 * Subscribes to STOMP topics on the backend's SockJS endpoint (/ws-bloodbank).
 * The broker is public and pushes JSON notifications, so no auth header is needed.
 * Returns whether the socket is connected, for a small "live" indicator.
 */
export function useStomp(topics: string[], onMessage: (topic: string, body: unknown) => void) {
  const handler = useRef(onMessage);
  const [connected, setConnected] = useState(false);
  const key = topics.join("|");

  useEffect(() => {
    handler.current = onMessage;
  });

  useEffect(() => {
    if (!key) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws-bloodbank`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        for (const topic of key.split("|")) {
          client.subscribe(topic, (msg) => {
            let body: unknown = msg.body;
            try {
              body = JSON.parse(msg.body);
            } catch {
              /* plain text */
            }
            handler.current(topic, body);
          });
        }
      },
      onWebSocketClose: () => setConnected(false),
    });
    client.activate();
    return () => {
      setConnected(false);
      void client.deactivate();
    };
  }, [key]);

  return connected;
}
