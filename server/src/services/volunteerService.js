const prisma = require('../config/prisma');
const {
  ValidationError,
  NotFoundError,
  ForbiddenError
} = require('../utils/errors');

const VERIFICATION_TRANSITIONS = {
  PENDING: ["VERIFIED", "REJECTED"],
  VERIFIED: ["PENDING", "REJECTED"],
  REJECTED: ["PENDING"]
};

async function createVolunteerProfile(userId, userRole, { latitude, longitude, skills = [] }) {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify user exists and role is CITIZEN
    const user = await tx.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.role !== 'CITIZEN') {
      throw new ForbiddenError("Only users with role CITIZEN can create a volunteer profile");
    }

    // 2. Verify volunteer profile does not already exist
    const existingVolunteer = await tx.volunteer.findUnique({
      where: { userId }
    });

    if (existingVolunteer) {
      throw new ValidationError([
        { field: "userId", message: "A volunteer profile already exists for this user" }
      ]);
    }

    // 3. Deduplicate and validate skill IDs
    const uniqueSkillIds = [...new Set(skills)];
    if (uniqueSkillIds.length > 0) {
      const skillsInDb = await tx.skill.findMany({
        where: { id: { in: uniqueSkillIds } }
      });
      if (skillsInDb.length !== uniqueSkillIds.length) {
        throw new ValidationError([
          { field: "skills", message: "One or more provided skill IDs are invalid" }
        ]);
      }
    }

    // 4. Create Volunteer profile
    const volunteer = await tx.volunteer.create({
      data: {
        userId,
        latitude,
        longitude,
        availabilityStatus: "OFFLINE",
        verificationStatus: "PENDING",
        skills: {
          connect: uniqueSkillIds.map(id => ({ id }))
        }
      },
      include: {
        skills: true
      }
    });

    // 5. Update user role to VOLUNTEER
    await tx.user.update({
      where: { id: userId },
      data: { role: 'VOLUNTEER' }
    });

    return volunteer;
  });
}

async function getVolunteerProfile(userId) {
  const volunteer = await prisma.volunteer.findUnique({
    where: { userId },
    include: {
      skills: true
    }
  });

  if (!volunteer) {
    throw new NotFoundError("Volunteer profile not found");
  }

  return volunteer;
}

async function updateVolunteerProfile(userId, { availabilityStatus, latitude, longitude, skills }) {
  const volunteer = await prisma.volunteer.findUnique({
    where: { userId }
  });

  if (!volunteer) {
    throw new NotFoundError("Volunteer profile not found");
  }

  const updateData = {};
  if (availabilityStatus !== undefined) updateData.availabilityStatus = availabilityStatus;
  if (latitude !== undefined) updateData.latitude = latitude;
  if (longitude !== undefined) updateData.longitude = longitude;

  let uniqueSkillIds;
  if (skills !== undefined) {
    uniqueSkillIds = [...new Set(skills)];
    if (uniqueSkillIds.length > 0) {
      const skillsInDb = await prisma.skill.findMany({
        where: { id: { in: uniqueSkillIds } }
      });
      if (skillsInDb.length !== uniqueSkillIds.length) {
        throw new ValidationError([
          { field: "skills", message: "One or more provided skill IDs are invalid" }
        ]);
      }
    }
  }

  const updated = await prisma.volunteer.update({
    where: { userId },
    data: {
      ...updateData,
      ...(skills !== undefined ? { skills: { set: uniqueSkillIds.map(id => ({ id })) } } : {})
    },
    include: {
      skills: true
    }
  });

  // Publish events after database update commits
  const eventPublisher = require('../realtime/eventPublisher');
  if (availabilityStatus !== undefined && updated.availabilityStatus !== volunteer.availabilityStatus) {
    eventPublisher.publish('volunteer:availability_changed', { volunteer: updated });
  }
  if ((latitude !== undefined || longitude !== undefined) &&
      (updated.latitude !== volunteer.latitude || updated.longitude !== volunteer.longitude)) {
    eventPublisher.publish('volunteer:location_updated', { volunteer: updated });
  }

  return updated;
}

async function listVolunteers({ availabilityStatus, verificationStatus, skills, page = 1, limit = 10 }) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const where = {};
  if (availabilityStatus) where.availabilityStatus = availabilityStatus;
  if (verificationStatus) where.verificationStatus = verificationStatus;
  
  if (skills) {
    const skillIds = skills.split(',').map(s => s.trim()).filter(Boolean);
    if (skillIds.length > 0) {
      where.skills = {
        some: {
          id: { in: skillIds }
        }
      };
    }
  }

  const total = await prisma.volunteer.count({ where });
  const totalPages = Math.ceil(total / parsedLimit);
  const skip = (parsedPage - 1) * parsedLimit;

  const data = await prisma.volunteer.findMany({
    where,
    skip,
    take: parsedLimit,
    include: {
      skills: true,
      user: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
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

async function updateVolunteerVerification(id, verificationStatus, userRole) {
  // Only ADMIN may update volunteer verification status
  if (userRole !== 'ADMIN') {
    throw new ForbiddenError("Access denied: only administrators can verify volunteers");
  }

  const volunteer = await prisma.volunteer.findUnique({
    where: { id }
  });

  if (!volunteer) {
    throw new NotFoundError("Volunteer profile not found");
  }

  const currentStatus = volunteer.verificationStatus;
  const allowed = VERIFICATION_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(verificationStatus)) {
    throw new ValidationError([
      { field: "verificationStatus", message: `Invalid verification status transition from ${currentStatus} to ${verificationStatus}` }
    ]);
  }

  const updated = await prisma.volunteer.update({
    where: { id },
    data: { verificationStatus },
    include: {
      skills: true
    }
  });

  return updated;
}

module.exports = {
  createVolunteerProfile,
  getVolunteerProfile,
  updateVolunteerProfile,
  listVolunteers,
  updateVolunteerVerification
};
