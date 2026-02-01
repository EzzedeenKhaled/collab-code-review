const express = require("express");
const router = express.Router();
const sessionService = require("../services/sessionService");
const codeExecutionService = require("../services/codeExecutionService");
const { CODE_EXECUTION_TIMEOUT } = require("../config/constants");

// Get session by ID
router.get("/:id", (req, res) => {
  const session = sessionService.getSession(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json({
    id: session.id,
    title: session.title,
    language: "javascript",
    isActive: true,
    createdAt: session.createdAt,
    userId: session.userId,
    userName: session.userName,
    commentCount: session.comments.length,
    userCount: session.users.size,
    codeLength: session.code.length,
    users: Array.from(session.users.entries()).map(([id, user]) => ({
      id,
      name: user.name,
      color: user.color,
      joinedAt: user.joinedAt,
      lastActive: user.lastActive,
      isTyping: user.isTyping || false,
    })),
  });
});

// Create new session
router.post("/", (req, res) => {
  const { userId, userName, title } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const newSession = sessionService.createSession(userId, userName, title);
  res.json(newSession);
});

// Get all sessions for a user
router.get("/", (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const userSessionsList = sessionService.getUserSessions(userId);
  res.json({ sessions: userSessionsList });
});

// Get session comments
router.get("/:id/comments", (req, res) => {
  const comments = sessionService.getComments(req.params.id);

  if (comments === null) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json(comments);
});

// Add comment to session
router.post("/:id/comments", (req, res) => {
  const { content, lineNumber, userId, userName, userColor } = req.body;

  if (!content || !lineNumber || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const comment = sessionService.addComment(req.params.id, {
    content,
    lineNumber: parseInt(lineNumber),
    userId,
    userName: userName || "Anonymous",
    userColor: userColor || "#3B82F6",
  });

  if (!comment) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Broadcast through socket (handled in controller/middleware)
  req.comment = comment;
  res.json(comment);
});

// Save session code
router.post("/:id/save", (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  const success = sessionService.updateCode(req.params.id, code);

  if (!success) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json({ success: true, message: "Code saved successfully" });
});

// Run code
router.post("/:id/run", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  const result = await codeExecutionService.executeCode(
    code,
    CODE_EXECUTION_TIMEOUT,
  );

  // Store for socket broadcast
  req.runResult = result;
  res.json(result);
});

module.exports = router;
