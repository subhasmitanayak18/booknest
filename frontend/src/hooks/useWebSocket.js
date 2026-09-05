import { useEffect, useRef } from "react";

const WS_URL = "ws://127.0.0.1:8000/ws";

function useWebSocket(onEvent) {
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    shouldReconnectRef.current = true;

    const connect = () => {
      if (!shouldReconnectRef.current) {
        return;
      }

      const currentToken = localStorage.getItem("access_token");

      if (!currentToken) {
        return;
      }

      const socket = new WebSocket(
        `${WS_URL}?token=${encodeURIComponent(currentToken)}`
      );

      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connected");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (onEvent) {
            onEvent(data);
          }
        } catch (error) {
          console.error("Invalid WebSocket message:", error);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");

        socketRef.current = null;

        if (shouldReconnectRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [onEvent]);
}

export default useWebSocket;