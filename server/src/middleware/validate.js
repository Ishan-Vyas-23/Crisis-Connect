const { ValidationError } = require('../utils/errors');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const errors = issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return next(new ValidationError(errors));
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
