const prisma = require('../config/prisma');
const { getHaversineDistance } = require('../utils/geo');
const {
  ValidationError,
  NotFoundError,
  ForbiddenError
} = require('../utils/errors');

const MAX_ACTIVE_ASSIGNMENTS = 1;
const MATCHING_MAX_DISTANCE_KM = 50;

const ALLOWED_ASSIGNMENT_TRANSITIONS = {
  PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: []
};

/**
 * Optimistic retry wrapper executing queries under PostgreSQL SERIALIZABLE isolation.
 */
async function runSerializableTransaction(fn, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => await fn(tx),
        { isolationLevel: 'Serializable' }
      );
    } catch (err) {
      const isSerializationFailure = err.code === 'P2034' || 
        err.message.includes('could not serialize access') ||
        err.message.includes('serialization failure') ||
        err.message.includes('40001');

      if (isSerializationFailure && attempt < retries) {
        // Backoff and retry with randomized delay (up to 150ms)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 150));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Recalculates and updates Incident.status based on its current assignments.
 */
async function syncIncidentStatus(tx, incidentId) {
  const incident = await tx.incident.findUnique({
    where: { id: incidentId }
  });

  if (!incident) return;

  // Do not alter terminal incident states (RESOLVED, REJECTED, CANCELLED)
  const terminalIncidentStates = ["RESOLVED", "REJECTED", "CANCELLED"];
  if (terminalIncidentStates.includes(incident.status)) {
    return;
  }

  const assignments = await tx.incidentAssignment.findMany({
    where: { incidentId }
  });

  let activeCount = 0;
  let activeActiveCount = 0; // status is ACTIVE
  let pendingOrAcceptedCount = 0;
  let completedCount = 0;
  let totalCount = assignments.length;

  for (const a of assignments) {
    if (["PENDING", "ACCEPTED", "ACTIVE"].includes(a.status)) {
      activeCount++;
    }
    if (a.status === "ACTIVE") {
      activeActiveCount++;
    }
    if (["PENDING", "ACCEPTED"].includes(a.status)) {
      pendingOrAcceptedCount++;
    }
    if (a.status === "COMPLETED") {
      completedCount++;
    }
  }

  let nextStatus = incident.status;

  if (activeActiveCount > 0) {
    nextStatus = "RESPONDING";
  } else if (pendingOrAcceptedCount > 0) {
    nextStatus = "ASSIGNED";
  } else if (completedCount > 0) {
    // If some assignments are completed and no active assignments remain,
    // the incident stays RESPONDING until an admin explicitly resolves it.
    nextStatus = "RESPONDING";
  } else if (totalCount > 0 && activeCount === 0) {
    // If all assignments are REJECTED or CANCELLED, revert to VERIFIED
    nextStatus = "VERIFIED";
  }

  if (nextStatus !== incident.status) {
    await tx.incident.update({
      where: { id: incidentId },
      data: { status: nextStatus }
    });
  }
}

async function assignVolunteer(adminUserRole, { incidentId, volunteerId }) {
  if (adminUserRole !== 'ADMIN') {
    throw new ForbiddenError("Access denied: only administrators can assign volunteers");
  }

  return await runSerializableTransaction(async (tx) => {
    // 1. Verify volunteer exists
    const volunteer = await tx.volunteer.findUnique({
      where: { id: volunteerId }
    });
    if (!volunteer) {
      throw new NotFoundError("Volunteer profile not found");
    }

    // 2. Verify volunteer eligibility (VERIFIED and AVAILABLE)
    if (volunteer.verificationStatus !== 'VERIFIED') {
      throw new ValidationError([
        { field: "volunteerId", message: "Volunteer must be VERIFIED to receive assignments" }
      ]);
    }
    if (volunteer.availabilityStatus !== 'AVAILABLE') {
      throw new ValidationError([
        { field: "volunteerId", message: "Volunteer must be AVAILABLE to receive assignments" }
      ]);
    }

    // 3. Verify volunteer active assignments workload < MAX_ACTIVE_ASSIGNMENTS
    const activeCount = await tx.incidentAssignment.count({
      where: {
        volunteerId,
        status: { in: ["PENDING", "ACCEPTED", "ACTIVE"] }
      }
    });
    if (activeCount >= MAX_ACTIVE_ASSIGNMENTS) {
      throw new ValidationError([
        { field: "volunteerId", message: `Volunteer has reached maximum active assignments limit (${MAX_ACTIVE_ASSIGNMENTS})` }
      ]);
    }

    // 4. Verify incident exists
    const incident = await tx.incident.findUnique({
      where: { id: incidentId }
    });
    if (!incident) {
      throw new NotFoundError("Incident not found");
    }

    // 5. Verify incident is assignable (not in terminal state)
    const terminalIncidentStates = ["RESOLVED", "REJECTED", "CANCELLED"];
    if (terminalIncidentStates.includes(incident.status)) {
      throw new ValidationError([
        { field: "incidentId", message: `Cannot assign volunteers to a closed/terminal incident (${incident.status})` }
      ]);
    }

    // 6. Verify duplicate active assignment does not exist
    const duplicate = await tx.incidentAssignment.findFirst({
      where: {
        incidentId,
        volunteerId,
        status: { in: ["PENDING", "ACCEPTED", "ACTIVE"] }
      }
    });
    if (duplicate) {
      throw new ValidationError([
        { field: "volunteerId", message: "Volunteer already has an active assignment for this incident" }
      ]);
    }

    // 7. Create assignment (starts in PENDING)
    const assignment = await tx.incidentAssignment.create({
      data: {
        incidentId,
        volunteerId,
        status: "PENDING"
      }
    });

    // 8. Sync incident status
    await syncIncidentStatus(tx, incidentId);

    return assignment;
  });
}

async function getRankedMatches(adminUserRole, incidentId) {
  if (adminUserRole !== 'ADMIN') {
    throw new ForbiddenError("Access denied: only administrators can view matching candidates");
  }

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      requiredSkills: true
    }
  });

  if (!incident) {
    throw new NotFoundError("Incident not found");
  }

  // Load all verified and available volunteers
  const volunteers = await prisma.volunteer.findMany({
    where: {
      verificationStatus: "VERIFIED",
      availabilityStatus: "AVAILABLE"
    },
    include: {
      skills: true,
      user: {
        select: {
          id: true,
          name: true
        }
      },
      assignments: {
        where: {
          status: { in: ["PENDING", "ACCEPTED", "ACTIVE"] }
        }
      }
    }
  });

  const candidates = [];

  for (const vol of volunteers) {
    // 1. Workload capacity check
    if (vol.assignments.length >= MAX_ACTIVE_ASSIGNMENTS) {
      continue;
    }

    // 2. Coordinates presence check (volunteer must have coordinates)
    if (vol.latitude === null || vol.longitude === null) {
      continue;
    }

    // 3. Distance check
    const distance = getHaversineDistance(
      incident.latitude,
      incident.longitude,
      vol.latitude,
      vol.longitude
    );

    if (distance > MATCHING_MAX_DISTANCE_KM) {
      continue;
    }

    // 4. Skills match check
    let matchedSkillNames = [];
    if (incident.requiredSkills.length > 0) {
      matchedSkillNames = vol.skills
        .filter(vs => incident.requiredSkills.some(is => is.id === vs.id))
        .map(vs => vs.name);
      
      // Candidate must match at least ONE required skill if incident has required skills
      if (matchedSkillNames.length === 0) {
        continue;
      }
    }

    // 5. Score Calculation
    let skillScore = 100;
    if (incident.requiredSkills.length > 0) {
      skillScore = (matchedSkillNames.length / incident.requiredSkills.length) * 100;
    }

    const distanceScore = Math.max(0, 100 - (distance / MATCHING_MAX_DISTANCE_KM) * 100);
    const score = Math.round(0.6 * skillScore + 0.4 * distanceScore);

    candidates.push({
      volunteerId: vol.id,
      volunteerName: vol.user.name,
      score,
      breakdown: {
        skillScore: Math.round(skillScore),
        distanceScore: Math.round(distanceScore),
        distanceKm: Math.round(distance * 10) / 10,
        matchedSkills: matchedSkillNames
      }
    });
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  // Bounded Route Enrichment (Phase 7):
  // Request routing details for at most the Top 5 candidates in parallel.
  // Process-local TTL caching minimizes external calls.
  // Graceful degradation: If geocoding or routing fails, route details are set to null, and the matching process continues.
  const locationService = require('../location/locationService');
  const topCandidates = candidates.slice(0, 5);

  const enrichedTop = await Promise.all(
    topCandidates.map(async (candidate) => {
      const vol = volunteers.find(v => v.id === candidate.volunteerId);
      if (!vol || vol.latitude === null || vol.longitude === null) {
        return { ...candidate, route: null };
      }

      try {
        const route = await locationService.getRoute(
          { latitude: vol.latitude, longitude: vol.longitude },
          { latitude: incident.latitude, longitude: incident.longitude }
        );
        return {
          ...candidate,
          route: route && route.routeAvailable ? {
            distanceKm: route.distanceKm,
            durationMinutes: route.durationMinutes,
            polyline: route.polyline
          } : null
        };
      } catch (err) {
        // Fallback gracefully on provider timeout or API keys issues
        return { ...candidate, route: null };
      }
    })
  );

  const remaining = candidates.slice(5).map(c => ({ ...c, route: null }));
  const finalCandidates = [...enrichedTop, ...remaining];

  return finalCandidates;
}

async function getIncidentAssignments(adminUserRole, incidentId) {
  if (adminUserRole !== 'ADMIN') {
    throw new ForbiddenError("Access denied: only administrators can view assignments");
  }

  const assignments = await prisma.incidentAssignment.findMany({
    where: { incidentId },
    include: {
      volunteer: {
        include: {
          skills: true,
          user: {
            select: { id: true, name: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return assignments;
}

async function getVolunteerAssignments(volunteerUserId) {
  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: volunteerUserId }
  });

  if (!volunteer) {
    throw new NotFoundError("Volunteer profile not found");
  }

  const assignments = await prisma.incidentAssignment.findMany({
    where: { volunteerId: volunteer.id },
    include: {
      incident: {
        include: {
          requiredSkills: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return assignments;
}

async function updateAssignmentStatus(id, volunteerUserId, userRole, newStatus) {
  return await runSerializableTransaction(async (tx) => {
    const assignment = await tx.incidentAssignment.findUnique({
      where: { id },
      include: {
        volunteer: true
      }
    });

    if (!assignment) {
      throw new NotFoundError("Incident assignment not found");
    }

    const isOwner = volunteerUserId && assignment.volunteer.userId === volunteerUserId;

    // Authorization constraints check
    if (newStatus === "CANCELLED") {
      // ADMIN can cancel any non-terminal assignment.
      // VOLUNTEER can cancel only their own assignment.
      if (userRole !== "ADMIN" && !isOwner) {
        throw new ForbiddenError("Access denied: insufficient permissions to cancel assignment");
      }
    } else {
      // Accept, Reject, Start, Complete are strictly VOLUNTEER owner actions
      if (!isOwner) {
        throw new ForbiddenError(`Access denied: only the assigned volunteer can update status to ${newStatus}`);
      }
    }

    const currentStatus = assignment.status;

    // Prevent modifications out of terminal states
    const terminalStates = ["COMPLETED", "REJECTED", "CANCELLED"];
    if (terminalStates.includes(currentStatus)) {
      throw new ValidationError([
        { field: "status", message: `Cannot modify status of a terminal assignment (${currentStatus})` }
      ]);
    }

    // State transition validations
    const allowed = ALLOWED_ASSIGNMENT_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError([
        { field: "status", message: `Invalid status transition from ${currentStatus} to ${newStatus}` }
      ]);
    }

    const updateData = { status: newStatus };
    const now = new Date();

    if (newStatus === "ACCEPTED") updateData.acceptedAt = now;
    if (newStatus === "REJECTED") updateData.rejectedAt = now;
    if (newStatus === "ACTIVE") updateData.startedAt = now;
    if (newStatus === "COMPLETED") updateData.completedAt = now;
    if (newStatus === "CANCELLED") updateData.cancelledAt = now;

    const updated = await tx.incidentAssignment.update({
      where: { id },
      data: updateData
    });

    // Synchronize incident status on state shift
    await syncIncidentStatus(tx, assignment.incidentId);

    return updated;
  });
}

module.exports = {
  assignVolunteer,
  getRankedMatches,
  getIncidentAssignments,
  getVolunteerAssignments,
  updateAssignmentStatus
};
