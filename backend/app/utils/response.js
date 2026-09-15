// backend/app/utils/response.js
// Standard HTTP JSON Envelope formatters

function successResponse(res, data = {}, message = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function errorResponse(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    errors
  });
}

module.exports = {
  successResponse,
  errorResponse
};
