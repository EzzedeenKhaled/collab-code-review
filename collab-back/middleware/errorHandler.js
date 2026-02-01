function errorHandler(err, req, res, next) {
  console.error("Express error:", err);

  if (err.type === "validation") {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: "Internal server error" });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
