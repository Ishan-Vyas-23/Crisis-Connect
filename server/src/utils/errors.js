class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(errors, message = "Input validation failed") {
    super(400, "VALIDATION_ERROR", message);
    this.errors = errors;
  }
}

class EmailConflictError extends AppError {
  constructor(message = "Email is already registered") {
    super(409, "EMAIL_CONFLICT", message);
  }
}

class InvalidCredentialsError extends AppError {
  constructor(message = "Invalid email or password") {
    super(401, "INVALID_CREDENTIALS", message);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

module.exports = {
  AppError,
  ValidationError,
  EmailConflictError,
  InvalidCredentialsError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
};
