'use strict';

const { logger } = require('../logging/logger');

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

function globalErrorHandler(err, req, res, next) {
  logger.error('Unhandled API Error: %s', err.stack || err.message);

  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: isProd && statusCode === 500 ? 'An internal server error occurred' : err.message,
    ...(isProd ? {} : { stack: err.stack })
  });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
