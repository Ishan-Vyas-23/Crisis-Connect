const { z } = require('zod');

const createVolunteerSchema = z.object({
  latitude: z.number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z.number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  skills: z.array(
    z.string().uuid("Invalid skill ID")
  ).optional()
});

const updateVolunteerSchema = z.object({
  availabilityStatus: z.enum(["AVAILABLE", "BUSY", "OFFLINE"], {
    errorMap: () => ({ message: "Invalid availability status" })
  }).optional(),
  latitude: z.number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z.number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  skills: z.array(
    z.string().uuid("Invalid skill ID")
  ).optional()
});

const updateVerificationSchema = z.object({
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"], {
    errorMap: () => ({ message: "Invalid verification status" })
  })
});

module.exports = {
  createVolunteerSchema,
  updateVolunteerSchema,
  updateVerificationSchema
};
