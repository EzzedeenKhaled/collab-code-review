import { useEffect, useState } from "react";

export const useCodeExecution = (socket, sessionId, code) => {
  const [runOutput, setRunOutput] = useState("");

  useEffect(() => {
    if (!socket) return;

    const handleRunOutput = (data) => {
      setRunOutput(
        data.error ? `Error: ${data.error}` : data.output || "(No output)",
      );
    };

    socket.on("run-output", handleRunOutput);

    return () => {
      socket.off("run-output", handleRunOutput);
    };
  }, [socket]);

  const handleRunCode = async () => {
    setRunOutput("Running...");
    try {
      const res = await fetch(
        `http://localhost:3001/api/sessions/${sessionId}/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ code }),
        },
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setRunOutput(
        data.error ? `Error: ${data.error}` : data.output || "(No output)",
      );
    } catch (err) {
      console.error("Failed to run code:", err);
      setRunOutput(`Failed to run code: ${err.message}`);
    }
  };

  return { runOutput, handleRunCode };
};
