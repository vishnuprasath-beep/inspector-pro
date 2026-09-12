/**
 * Global API Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[Error] Unhandled error in request:', err);

  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: `File Upload Error: ${err.message}`
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;
