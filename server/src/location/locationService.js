const MockLocationProvider = require('./providers/mockLocationProvider');
const GoogleMapsProvider = require('./providers/googleMapsProvider');
const cache = require('./cache');
const prisma = require('../config/prisma');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

function getActiveProvider() {
  const providerType = process.env.LOCATION_PROVIDER || 'gemini'; // wait, fallback to 'mock' if not set, or process.env has it. Let's make it robust:
  if (providerType === 'google') {
    return new GoogleMapsProvider();
  }
  return new MockLocationProvider({ timeoutMs: 3000 });
}

/**
 * Forward Geocoding: resolves an address to coordinates.
 */
async function geocode(address) {
  const cacheKey = `geocode:${address.trim().toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const provider = getActiveProvider();
  const result = await provider.geocode(address);
  
  if (result) {
    // Cache for 24 hours
    cache.set(cacheKey, result, 86400);
  }
  return result;
}

/**
 * Reverse Geocoding: resolves coordinates to address.
 */
async function reverseGeocode(lat, lng) {
  const latKey = Number(lat).toFixed(5);
  const lngKey = Number(lng).toFixed(5);
  const cacheKey = `reverse:${latKey}:${lngKey}`;
  
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const provider = getActiveProvider();
  const result = await provider.reverseGeocode(lat, lng);

  if (result) {
    // Cache for 24 hours
    cache.set(cacheKey, result, 86400);
  }
  return result;
}

/**
 * Route calculation between origin and destination.
 */
async function getRoute(origin, destination) {
  const oLat = Number(origin.latitude).toFixed(5);
  const oLng = Number(origin.longitude).toFixed(5);
  const dLat = Number(destination.latitude).toFixed(5);
  const dLng = Number(destination.longitude).toFixed(5);
  const cacheKey = `route:${oLat}:${oLng}:${dLat}:${dLng}`;

  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const provider = getActiveProvider();
  const result = await provider.getRoute(origin, destination);

  if (result && result.routeAvailable) {
    // Cache routes for 2 hours (ETA and traffic are transient)
    cache.set(cacheKey, result, 7200);
  }
  return result;
}

/**
 * Validates whether a volunteer has access to calculate a route for an incident.
 * Enforces: Only allow if there is an active/authorized assignment (PENDING, ACCEPTED, ACTIVE).
 */
async function validateVolunteerRouteAccess(volunteerUserId, incidentId) {
  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: volunteerUserId }
  });
  if (!volunteer) {
    throw new NotFoundError("Volunteer profile not found");
  }

  const assignment = await prisma.incidentAssignment.findFirst({
    where: {
      volunteerId: volunteer.id,
      incidentId: incidentId,
      status: { in: ["PENDING", "ACCEPTED", "ACTIVE"] }
    }
  });

  if (!assignment) {
    throw new ForbiddenError("Access denied: you do not have an active assignment to this incident");
  }
  
  return volunteer;
}

module.exports = {
  geocode,
  reverseGeocode,
  getRoute,
  validateVolunteerRouteAccess
};
