const { z } = require('zod');

const geocodeQuerySchema = z.object({
  address: z.string()
    .min(3, "Address must be at least 3 characters")
    .max(200, "Address must not exceed 200 characters")
});

const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  lng: z.coerce.number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
});

const routeBodySchema = z.object({
  origin: z.object({
    latitude: z.number()
      .min(-90, "Origin latitude must be between -90 and 90")
      .max(90, "Origin latitude must be between -90 and 90"),
    longitude: z.number()
      .min(-180, "Origin longitude must be between -180 and 180")
      .max(180, "Origin longitude must be between -180 and 180")
  }),
  destination: z.object({
    latitude: z.number()
      .min(-90, "Destination latitude must be between -90 and 90")
      .max(90, "Destination latitude must be between -90 and 90"),
    longitude: z.number()
      .min(-180, "Destination longitude must be between -180 and 180")
      .max(180, "Destination longitude must be between -180 and 180")
  }),
  incidentId: z.string().uuid("Invalid incident ID format").optional()
});

module.exports = {
  geocodeQuerySchema,
  reverseGeocodeQuerySchema,
  routeBodySchema
};
