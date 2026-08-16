const express = require('express');
const locationController = require('../controllers/locationController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const { ValidationError } = require('../utils/errors');
const {
  geocodeQuerySchema,
  reverseGeocodeQuerySchema,
  routeBodySchema
} = require('../validators/locationValidator');

const router = express.Router();

// Helper middleware for query parameters validation
const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return next(new ValidationError(errors));
    }
    req.query = result.data;
    next();
  };
};

// All location endpoints require authentication
router.use(authMiddleware);

router.get('/geocode', validateQuery(geocodeQuerySchema), locationController.geocode);
router.get('/reverse', validateQuery(reverseGeocodeQuerySchema), locationController.reverseGeocode);
router.post('/route', validate(routeBodySchema), locationController.getRoute);

module.exports = router;
