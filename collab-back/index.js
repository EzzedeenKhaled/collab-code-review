const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { CORS_ORIGIN, PORT } = require("./config/constants");
const sessionRoutes = require("./routes/sessionRoutes");
const setupSessionSocket = require("./sockets/sessionSocket");
const createSocketBroadcastMiddleware = require("./middleware/socketBroadcast");
const { errorHandler } = require("./middleware/errorHandler");
const { startCleanupTask } = require("./utils/cleanup");

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: CORS_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket broadcast middleware
const socketBroadcast = createSocketBroadcastMiddleware(io);

// Routes
app.use("/api/sessions/:id/comments", socketBroadcast.broadcastComment);
app.use("/api/sessions/:id/run", socketBroadcast.broadcastRunResult);
app.use("/api/sessions", sessionRoutes);

// Error handling
app.use(errorHandler);

// Socket.IO handlers
setupSessionSocket(io);

// Start cleanup task
startCleanupTask();

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = { app, server, io };
