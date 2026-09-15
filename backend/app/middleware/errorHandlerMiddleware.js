// backend/app/middleware/errorHandlerMiddleware.js
const { errorHandler, notFoundHandler } = require('../core/exceptions/errorHandler');

module.exports = {
  errorHandler,
  notFoundHandler
};
