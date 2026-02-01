module.exports = {
  CORS_ORIGIN: "http://localhost:5173",
  PORT: process.env.PORT || 3001,
  INACTIVE_THRESHOLD: 30 * 60 * 1000, // 30 minutes
  CODE_EXECUTION_TIMEOUT: 5000,
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
};
