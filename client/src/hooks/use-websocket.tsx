import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./use-auth";

interface WebSocketContextType {
  socket: WebSocket | null;
  sendMessage: (message: any) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Send authentication message
      ws.send(JSON.stringify({
        type: "auth",
        token: token,
      }));
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        switch (data.type) {
          case "new_message":
            // Dispatch custom event for new messages
            window.dispatchEvent(new CustomEvent("new_message", { detail: data.data }));
            break;
          case "announcement":
            // Dispatch custom event for announcements
            window.dispatchEvent(new CustomEvent("new_announcement", { detail: data.data }));
            break;
          case "attendance_update":
            // Dispatch custom event for attendance updates
            window.dispatchEvent(new CustomEvent("attendance_update", { detail: data.data }));
            break;
          default:
            console.log("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      ws.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, token]);

  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket, sendMessage, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
