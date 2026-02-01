import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

export const useSocket = (sessionId, userInfo) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
      setIsConnected(true);

      // Emit join-session after connection is established
      socket.emit("join-session", {
        sessionId,
        userName: userInfo.name,
        userColor: userInfo.color,
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
    });

    socket.on("users-update", (userList) => {
      console.log("Users update received:", userList);
      setUsers(userList);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("users-update");
      socket.disconnect();
    };
  }, [sessionId, userInfo.name, userInfo.color]);

  return { socket: socketRef.current, isConnected, users };
};
