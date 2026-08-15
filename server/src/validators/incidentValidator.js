const { z } = require('zod');

const createIncidentSchema = z.object({
  title: z.string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must not exceed 100 characters")
    .trim(),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must not exceed 1000 characters")
    .trim(),
  category: z.enum([
    "FIRE",
    "FLOOD",
    "ACCIDENT",
    "MEDICAL",
    "BUILDING_COLLAPSE",
    "MISSING_PERSON",
    "NATURAL_DISASTER",
    "OTHER"
  ], {
    errorMap: () => ({ message: "Invalid incident category" })
  }),
  latitude: z.number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z.number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  address: z.string()
    .max(255, "Address must not exceed 255 characters")
    .trim()
    .optional(),
  requiredSkills: z.array(
    z.string().uuid("Invalid skill ID")
  ).optional()
});

const updateStatusSchema = z.object({
  status: z.enum([
    "REPORTED",
    "UNDER_REVIEW",
    "VERIFIED",
    "ASSIGNED",
    "RESPONDING",
    "RESOLVED",
    "REJECTED",
    "CANCELLED"
  ], {
    errorMap: () => ({ message: "Invalid incident status" })
  })
});

module.exports = {
  createIncidentSchema,
  updateStatusSchema
};
