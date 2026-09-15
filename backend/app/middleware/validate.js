'use strict';

function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed;
      return next();
    } catch (err) {
      if (err.errors) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request payload',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: err.message || 'Validation failed'
      });
    }
  };
}

module.exports = { validate };
