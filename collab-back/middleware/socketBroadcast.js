// Middleware to broadcast socket events after HTTP responses
function createSocketBroadcastMiddleware(io) {
  return {
    broadcastComment: (req, res, next) => {
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        if (req.comment) {
          io.to(req.params.id).emit("comment-added", req.comment);
        }
        return originalJson(data);
      };
      next();
    },

    broadcastRunResult: (req, res, next) => {
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        if (req.runResult) {
          io.to(req.params.id).emit("run-output", req.runResult);
        }
        return originalJson(data);
      };
      next();
    },
  };
}

module.exports = createSocketBroadcastMiddleware;
