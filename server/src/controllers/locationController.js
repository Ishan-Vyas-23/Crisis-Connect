const locationService = require('../location/locationService');
const { ValidationError, ForbiddenError, NotFoundError } = require('../utils/errors');

async function geocode(req, res, next) {
  try {
    const result = await locationService.geocode(req.query.address);
    if (!result) {
      throw new NotFoundError("Address not found");
    }
    res.status(200).json({
      success: true,
      location: result
    });
  } catch (err) {
    next(err);
  }
}

async function reverseGeocode(req, res, next) {
  try {
    const result = await locationService.reverseGeocode(
      Number(req.query.lat),
      Number(req.query.lng)
    );
    if (!result) {
      throw new NotFoundError("Coordinates address not found");
    }
    res.status(200).json({
      success: true,
      location: result
    });
  } catch (err) {
    next(err);
  }
}

async function getRoute(req, res, next) {
  try {
    const { origin, destination, incidentId } = req.body;

    // Explicit Route RBAC Gating:
    // VOLUNTEER users can only calculate routes for incidents to which they are assigned.
    if (req.user.role === 'VOLUNTEER') {
      if (!incidentId) {
        throw new ValidationError([
          { field: "incidentId", message: "incidentId is required in request body for VOLUNTEER route calculation" }
        ]);
      }
      await locationService.validateVolunteerRouteAccess(req.user.id, incidentId);
    } else if (req.user.role === 'CITIZEN') {
      throw new ForbiddenError("Access denied: regular Citizens cannot request responder route details");
    }

    const route = await locationService.getRoute(origin, destination);
    res.status(200).json({
      success: true,
      route
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  geocode,
  reverseGeocode,
  getRoute
};
