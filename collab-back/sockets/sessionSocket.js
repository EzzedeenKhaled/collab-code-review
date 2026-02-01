const sessionService = require("../services/sessionService");

function setupSessionSocket(io) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join session
    socket.on("join-session", async ({ sessionId, userName, userColor }) => {
      try {
        const session = sessionService.getSession(sessionId);

        if (!session) {
          socket.emit("error", { message: "Session not found" });
          return;
        }

        sessionService.addUser(sessionId, socket.id, {
          name: userName,
          color: userColor,
        });

        socket.join(sessionId);
        socket.sessionId = sessionId;

        // Send initial data
        socket.emit("comments-init", session.comments);
        socket.emit("code-update", session.code);

        // Broadcast updated user list
        const userList = sessionService.getUsersList(sessionId);
        io.to(sessionId).emit("users-update", userList);

        console.log(
          `User ${userName} joined session ${sessionId}. Total users: ${userList.length}`,
        );
      } catch (err) {
        console.error("Error joining session:", err);
        socket.emit("error", { message: "Failed to join session" });
      }
    });

    // Typing indicators
    socket.on("typing-start", ({ sessionId }) => {
      const user = sessionService.setUserTyping(sessionId, socket.id, true);

      if (user) {
        socket.to(sessionId).emit("user-typing", {
          userId: socket.id,
          userName: user.name,
          userColor: user.color,
          isTyping: true,
        });
      }
    });

    socket.on("typing-stop", ({ sessionId }) => {
      const user = sessionService.setUserTyping(sessionId, socket.id, false);

      if (user) {
        socket.to(sessionId).emit("user-typing", {
          userId: socket.id,
          userName: user.name,
          userColor: user.color,
          isTyping: false,
        });
      }
    });

    // Code change
    socket.on("code-change", ({ sessionId, code }) => {
      const success = sessionService.updateCode(sessionId, code);

      if (success) {
        sessionService.updateUserActivity(sessionId, socket.id);
        socket.to(sessionId).emit("code-update", code);
      }
    });

    // Leave session
    socket.on("leave-session", (sessionId) => {
      handleUserLeave(io, socket, sessionId);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (socket.sessionId) {
        handleUserLeave(io, socket, socket.sessionId);
      }
    });
  });
}

function handleUserLeave(io, socket, sessionId) {
  sessionService.removeUser(sessionId, socket.id);
  socket.leave(sessionId);

  const userList = sessionService.getUsersList(sessionId);
  io.to(sessionId).emit("users-update", userList);

  console.log(
    `User left session ${sessionId}. Remaining users: ${userList.length}`,
  );
}

module.exports = setupSessionSocket;
