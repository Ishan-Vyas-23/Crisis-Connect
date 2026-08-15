const { AppError } = require('../utils/errors');

function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "An unexpected error occurred";

  const response = {
    success: false,
    code,
    message
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    response.stack = err.stack;
  }

  if (statusCode === 500) {
    console.error("Internal Server Error:", err);
  }

  res.status(statusCode).json(response);
}

module.exports = errorMiddleware;
