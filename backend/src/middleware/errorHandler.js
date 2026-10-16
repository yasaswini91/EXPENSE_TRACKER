/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
    });
  }

  // Mongoose Cast Error (invalid ObjectId or type conversion)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for ${err.path}: ${err.value}`,
    });
  }

  // JSON syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body',
    });
  }

  // Custom status code or default 500
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
