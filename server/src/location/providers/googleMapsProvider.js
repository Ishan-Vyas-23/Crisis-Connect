class GoogleMapsProvider {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.GOOGLE_MAPS_API_KEY;
    this.timeoutMs = config.timeoutMs || parseInt(process.env.LOCATION_TIMEOUT_MS, 10) || 5000;
  }

  async geocode(address) {
    if (!this.apiKey) {
      throw new Error("Google Maps API Key is missing. Configure GOOGLE_MAPS_API_KEY.");
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Google Maps Geocoding API returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "ZERO_RESULTS") {
        return null;
      }
      if (data.status !== "OK") {
        throw new Error(`Google Maps Geocoding error: ${data.status} - ${data.error_message || ''}`);
      }

      const result = data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Google Maps Geocoding request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }

  async reverseGeocode(latitude, longitude) {
    if (!this.apiKey) {
      throw new Error("Google Maps API Key is missing. Configure GOOGLE_MAPS_API_KEY.");
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Google Maps Reverse Geocoding API returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "ZERO_RESULTS") {
        return null;
      }
      if (data.status !== "OK") {
        throw new Error(`Google Maps Reverse Geocoding error: ${data.status} - ${data.error_message || ''}`);
      }

      const result = data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Google Maps Reverse Geocoding request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }

  async getRoute(origin, destination) {
    if (!this.apiKey) {
      throw new Error("Google Maps API Key is missing. Configure GOOGLE_MAPS_API_KEY.");
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${this.apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Google Maps Directions API returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "ZERO_RESULTS" || !data.routes || data.routes.length === 0) {
        return {
          distanceKm: 0,
          durationMinutes: 0,
          polyline: "",
          routeAvailable: false
        };
      }
      if (data.status !== "OK") {
        throw new Error(`Google Maps Directions error: ${data.status} - ${data.error_message || ''}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distanceKm: Math.round((leg.distance.value / 1000) * 10) / 10,
        durationMinutes: Math.round(leg.duration.value / 60),
        polyline: route.overview_polyline.points,
        routeAvailable: true
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Google Maps Directions request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }
}

module.exports = GoogleMapsProvider;
