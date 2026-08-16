const { z } = require('zod');

const manualAssignmentSchema = z.object({
  incidentId: z.string().uuid("Invalid incident ID format"),
  volunteerId: z.string().uuid("Invalid volunteer ID format")
});

module.exports = {
  manualAssignmentSchema
};
