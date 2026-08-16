const { z } = require('zod');

const aiOutputSchema = z.object({
  category: z.enum([
    "FIRE",
    "FLOOD",
    "ACCIDENT",
    "MEDICAL",
    "BUILDING_COLLAPSE",
    "MISSING_PERSON",
    "NATURAL_DISASTER",
    "OTHER"
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  peopleAtRisk: z.boolean(),
  requiredSkills: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(500)
});

module.exports = {
  aiOutputSchema
};
