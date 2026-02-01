import { useEffect, useRef, useState } from "react";

export const useCodeSync = (socket, sessionId, isConnected) => {
  const [code, setCode] = useState("// Start coding...");
  const [typingUsers, setTypingUsers] = useState(new Map());
  const codeRef = useRef("");
  const isUpdatingFromSocket = useRef(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("code-update", (newCode) => {
      console.log("Received code update:", newCode.length, "characters");
      if (newCode !== codeRef.current) {
        isUpdatingFromSocket.current = true;
        setCode(newCode);
        codeRef.current = newCode;
        setTimeout(() => {
          isUpdatingFromSocket.current = false;
        }, 100);
      }
    });

    socket.on("user-typing", ({ userId, userName, userColor, isTyping }) => {
      setTypingUsers((prev) => {
        const newTypingUsers = new Map(prev);
        if (isTyping) {
          newTypingUsers.set(userId, { userName, userColor });
        } else {
          newTypingUsers.delete(userId);
        }
        return newTypingUsers;
      });
    });

    return () => {
      socket.off("code-update");
      socket.off("user-typing");
    };
  }, [socket]);

  const handleCodeChange = (value) => {
    if (isUpdatingFromSocket.current) return;

    console.log("Local code change:", value.length, "characters");
    setCode(value);
    codeRef.current = value;

    if (socket && isConnected) {
      socket.emit("typing-start", { sessionId });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socket && isConnected) {
          socket.emit("typing-stop", { sessionId });
        }
      }, 1000);

      socket.emit("code-change", { sessionId, code: value });
    }
  };

  return { code, typingUsers, handleCodeChange };
};
