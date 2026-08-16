const { getHaversineDistance } = require('../../utils/geo');

class MockLocationProvider {
  constructor(config = {}) {
    this.config = config;
    this.timeoutMs = config.timeoutMs || 3000;
  }

  async geocode(address) {
    if (address.toLowerCase().includes("trigger_timeout")) {
      await new Promise(resolve => setTimeout(resolve, this.timeoutMs));
      throw new Error("Geocoding request timed out (simulated)");
    }

    if (address.toLowerCase().includes("trigger_rate_limit")) {
      throw new Error("Geocoding rate limit exceeded (simulated)");
    }

    if (address.toLowerCase().includes("invalid_address")) {
      return null;
    }

    // Default mock response
    return {
      latitude: 22.7533,
      longitude: 75.8937,
      formattedAddress: `${address}, Mock City, India`
    };
  }

  async reverseGeocode(latitude, longitude) {
    if (latitude === 999.0 || longitude === 999.0) {
      await new Promise(resolve => setTimeout(resolve, this.timeoutMs));
      throw new Error("Reverse geocoding request timed out (simulated)");
    }

    if (latitude === 888.0 || longitude === 888.0) {
      throw new Error("Reverse geocoding rate limit exceeded (simulated)");
    }

    return {
      latitude,
      longitude,
      formattedAddress: `Mock Address for coord (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
    };
  }

  async getRoute(origin, destination) {
    if (origin.latitude === 999.0 || destination.latitude === 999.0 || Math.abs(origin.latitude - 34.0999) < 0.005) {
      await new Promise(resolve => setTimeout(resolve, this.timeoutMs));
      throw new Error("Route calculation request timed out (simulated)");
    }

    if (origin.latitude === 777.0 || destination.latitude === 777.0) {
      return {
        distanceKm: 0,
        durationMinutes: 0,
        polyline: "",
        routeAvailable: false
      };
    }

    // Compute mock road distance as ~1.2x Haversine geodesic distance
    const geodesicDist = getHaversineDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );

    const distanceKm = Math.round(geodesicDist * 1.2 * 10) / 10;
    // Assume average speed 40km/h
    const durationMinutes = Math.round((distanceKm / 40) * 60) || 1;

    return {
      distanceKm,
      durationMinutes,
      polyline: `_p~iFzpxuOsXeFrG_dCg{wzO_mock_route_from_${origin.latitude.toFixed(3)}_${origin.longitude.toFixed(3)}_to_${destination.latitude.toFixed(3)}_${destination.longitude.toFixed(3)}`,
      routeAvailable: true
    };
  }
}

module.exports = MockLocationProvider;
