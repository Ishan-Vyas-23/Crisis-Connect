const { getIO } = require('./socketServer');
const prisma = require('../config/prisma');

function serializeIncident(incident) {
  if (!incident) return null;
  return {
    id: incident.id,
    title: incident.title,
    description: incident.description,
    category: incident.category,
    priority: incident.priority,
    status: incident.status,
    latitude: incident.latitude,
    longitude: incident.longitude,
    address: incident.address,
    peopleAtRisk: incident.peopleAtRisk || false,
    classificationSource: incident.classificationSource || "DEFAULT",
    aiNeedsReview: incident.aiNeedsReview || false,
    createdAt: incident.createdAt
  };
}

function serializeAssignment(assignment) {
  if (!assignment) return null;
  return {
    id: assignment.id,
    incidentId: assignment.incidentId,
    volunteerId: assignment.volunteerId,
    status: assignment.status,
    createdAt: assignment.createdAt,
    acceptedAt: assignment.acceptedAt || null,
    rejectedAt: assignment.rejectedAt || null,
    startedAt: assignment.startedAt || null,
    completedAt: assignment.completedAt || null,
    cancelledAt: assignment.cancelledAt || null
  };
}

function serializeVolunteer(volunteer) {
  if (!volunteer) return null;
  return {
    id: volunteer.id,
    userId: volunteer.userId,
    availabilityStatus: volunteer.availabilityStatus,
    verificationStatus: volunteer.verificationStatus,
    latitude: volunteer.latitude,
    longitude: volunteer.longitude
  };
}

async function publish(eventName, data) {
  const io = getIO();
  if (!io) {
    // Failsafe: if socket server is not initialized, don't crash
    return;
  }

  try {
    switch (eventName) {
      case 'incident:created': {
        const serialized = serializeIncident(data.incident);
        // Only operational admins receive new incident notifications
        io.to('role:ADMIN').to('role:ORGANIZATION_ADMIN').emit('incident:created', {
          incident: serialized
        });
        break;
      }

      case 'incident:status_changed': {
        const serialized = serializeIncident(data.incident);
        // Broadcast status changes to operations and the incident specific room (for assigned volunteer + reporter)
        io.to('role:ADMIN')
          .to('role:ORGANIZATION_ADMIN')
          .to(`incident:${serialized.id}`)
          .emit('incident:status_changed', {
            incident: serialized
          });
        break;
      }

      case 'assignment:created': {
        const serialized = serializeAssignment(data.assignment);
        
        // Fetch volunteer's user ID to notify them privately
        const volunteer = await prisma.volunteer.findUnique({
          where: { id: serialized.volunteerId },
          select: { userId: true }
        });

        if (volunteer) {
          io.to(`user:${volunteer.userId}`).emit('assignment:created', {
            assignment: serialized
          });
        }

        // Notify operations
        io.to('role:ADMIN').to('role:ORGANIZATION_ADMIN').emit('assignment:created', {
          assignment: serialized
        });
        break;
      }

      case 'assignment:accepted':
      case 'assignment:rejected':
      case 'assignment:started':
      case 'assignment:completed':
      case 'assignment:cancelled': {
        const serialized = serializeAssignment(data.assignment);
        // Broadcast assignment updates to operations and the incident subscription room
        io.to('role:ADMIN')
          .to('role:ORGANIZATION_ADMIN')
          .to(`incident:${serialized.incidentId}`)
          .emit(eventName, {
            assignment: serialized
          });
        break;
      }

      case 'volunteer:availability_changed': {
        const serialized = serializeVolunteer(data.volunteer);
        // Broadcast availability updates to operations
        io.to('role:ADMIN').to('role:ORGANIZATION_ADMIN').emit('volunteer:availability_changed', {
          volunteer: serialized
        });
        break;
      }

      case 'volunteer:location_updated': {
        const serialized = serializeVolunteer(data.volunteer);

        // Broad operational location privacy gating:
        // 1. Send to Admin operations
        io.to('role:ADMIN').emit('volunteer:location_updated', {
          volunteer: serialized
        });

        // 2. Send to volunteer's private user room
        io.to(`user:${serialized.userId}`).emit('volunteer:location_updated', {
          volunteer: serialized
        });
        break;
      }

      default:
        console.warn(`Attempted to publish unregistered event: ${eventName}`);
    }
  } catch (err) {
    // Best-effort notification delivery: do not crash if socket dispatch fails
    console.error(`Failed to publish event ${eventName}:`, err.message);
  }
}

module.exports = {
  publish
};
