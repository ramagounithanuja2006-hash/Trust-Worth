'use strict';

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error.statusCode || error.status || 500;
  let message = error.message || 'Internal server error';

  // Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError') {
    status = 400;
    message = `Invalid value for field '${error.path}'`;
  }

  // Mongoose ValidationError
  if (error.name === 'ValidationError') {
    status = 400;
    const messages = Object.values(error.errors).map(e => e.message);
    message = messages.join('; ');
  }

  // MongoDB duplicate key
  if (error.code === 11000) {
    status = 409;
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') { status = 401; message = 'Invalid token'; }
  if (error.name === 'TokenExpiredError') { status = 401; message = 'Token has expired'; }

  // Multer file size
  if (error.code === 'LIMIT_FILE_SIZE') { status = 413; message = 'File too large'; }

  if (status >= 500) console.error('[ERROR]', error);

  res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };

