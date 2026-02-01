const sessionService = require("../services/sessionService");
const { INACTIVE_THRESHOLD, CLEANUP_INTERVAL } = require("../config/constants");

function startCleanupTask() {
  setInterval(() => {
    const sessionIds = sessionService.getAllSessionIds();
    sessionIds.forEach((sessionId) => {
      sessionService.cleanupInactiveUsers(sessionId, INACTIVE_THRESHOLD);
    });
  }, CLEANUP_INTERVAL);
}

module.exports = { startCleanupTask };
