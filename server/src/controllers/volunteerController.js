const volunteerService = require('../services/volunteerService');

async function create(req, res, next) {
  try {
    const volunteer = await volunteerService.createVolunteerProfile(req.user.id, req.user.role, req.body);
    res.status(201).json({
      success: true,
      volunteer
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const volunteer = await volunteerService.getVolunteerProfile(req.user.id);
    res.status(200).json({
      success: true,
      volunteer
    });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const volunteer = await volunteerService.updateVolunteerProfile(req.user.id, req.body);
    res.status(200).json({
      success: true,
      volunteer
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { availabilityStatus, verificationStatus, skills, page, limit } = req.query;
    const result = await volunteerService.listVolunteers({
      availabilityStatus,
      verificationStatus,
      skills,
      page,
      limit
    });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

async function updateVerification(req, res, next) {
  try {
    const volunteer = await volunteerService.updateVolunteerVerification(
      req.params.id,
      req.body.verificationStatus,
      req.user.role
    );
    res.status(200).json({
      success: true,
      volunteer
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getMe,
  updateMe,
  list,
  updateVerification
};
