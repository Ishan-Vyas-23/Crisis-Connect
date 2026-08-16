const { z } = require('zod');

const humanReviewSchema = z.object({
  category: z.enum([
    "FIRE",
    "FLOOD",
    "ACCIDENT",
    "MEDICAL",
    "BUILDING_COLLAPSE",
    "MISSING_PERSON",
    "NATURAL_DISASTER",
    "OTHER"
  ]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  peopleAtRisk: z.boolean().optional(),
  requiredSkills: z.array(z.string().uuid("Invalid skill ID format")).optional()
});

module.exports = {
  humanReviewSchema
};
