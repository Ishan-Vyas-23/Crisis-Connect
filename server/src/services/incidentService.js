const prisma = require('../config/prisma');
const {
  ValidationError,
  NotFoundError,
  ForbiddenError
} = require('../utils/errors');

const ALLOWED_TRANSITIONS = {
  REPORTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["VERIFIED", "REJECTED"],
  VERIFIED: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["RESPONDING", "CANCELLED"],
  RESPONDING: ["RESOLVED", "CANCELLED"],
  RESOLVED: [],
  REJECTED: [],
  CANCELLED: []
};

async function createIncident(userId, { title, description, category, latitude, longitude, address, requiredSkills = [] }) {
  // Deduplicate skills
  const uniqueSkillIds = [...new Set(requiredSkills)];

  // Validate skill IDs
  if (uniqueSkillIds.length > 0) {
    const skillsInDb = await prisma.skill.findMany({
      where: { id: { in: uniqueSkillIds } }
    });

    if (skillsInDb.length !== uniqueSkillIds.length) {
      throw new ValidationError([
        { field: "requiredSkills", message: "One or more provided skill IDs are invalid" }
      ]);
    }
  }

  const incident = await prisma.incident.create({
    data: {
      title,
      description,
      category,
      latitude,
      longitude,
      address,
      reportedById: userId,
      status: "REPORTED",
      priority: "MEDIUM",
      peopleAtRisk: false,
      requiredSkills: {
        connect: uniqueSkillIds.map(id => ({ id }))
      }
    },
    include: {
      requiredSkills: true
    }
  });

  return incident;
}

async function listIncidents({ status, category, priority, page = 1, limit = 10 }) {
  // Constrain pagination parameters
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;

  const total = await prisma.incident.count({ where });
  const totalPages = Math.ceil(total / parsedLimit);
  const skip = (parsedPage - 1) * parsedLimit;

  const data = await prisma.incident.findMany({
    where,
    skip,
    take: parsedLimit,
    orderBy: { createdAt: 'desc' },
    include: {
      requiredSkills: true
    }
  });

  return {
    data,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages
    }
  };
}

async function getIncidentById(id) {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      reportedBy: {
        select: {
          id: true,
          name: true
        }
      },
      requiredSkills: true
    }
  });

  if (!incident) {
    throw new NotFoundError("Incident not found");
  }

  return incident;
}

async function updateIncidentStatus(id, newStatus, userRole) {
  const incident = await prisma.incident.findUnique({
    where: { id }
  });

  if (!incident) {
    throw new NotFoundError("Incident not found");
  }

  // 1. Verify role access (Strictly ADMIN or ORGANIZATION_ADMIN in this phase)
  if (userRole !== 'ADMIN' && userRole !== 'ORGANIZATION_ADMIN') {
    throw new ForbiddenError("Access denied: insufficient permissions to update status");
  }

  const currentStatus = incident.status;

  // 2. Prevent modifications to terminal states
  const terminalStates = ["RESOLVED", "REJECTED", "CANCELLED"];
  if (terminalStates.includes(currentStatus)) {
    throw new ValidationError([
      { field: "status", message: `Cannot modify status of a closed/terminal incident (${currentStatus})` }
    ]);
  }

  // 3. Validate state transition rules
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new ValidationError([
      { field: "status", message: `Invalid status transition from ${currentStatus} to ${newStatus}` }
    ]);
  }

  const updateData = { status: newStatus };

  // Set resolvedAt timestamp if entering RESOLVED state
  if (newStatus === 'RESOLVED') {
    updateData.resolvedAt = new Date();
  }

  const updated = await prisma.incident.update({
    where: { id },
    data: updateData,
    include: {
      requiredSkills: true
    }
  });

  return updated;
}

module.exports = {
  createIncident,
  listIncidents,
  getIncidentById,
  updateIncidentStatus
};
