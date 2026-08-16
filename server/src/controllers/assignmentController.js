const assignmentService = require('../services/assignmentService');

async function assign(req, res, next) {
  try {
    const assignment = await assignmentService.assignVolunteer(req.user.role, req.body);
    res.status(201).json({
      success: true,
      assignment
    });
  } catch (err) {
    next(err);
  }
}

async function getMatches(req, res, next) {
  try {
    const candidates = await assignmentService.getRankedMatches(req.user.role, req.params.incidentId);
    res.status(200).json({
      success: true,
      candidates
    });
  } catch (err) {
    next(err);
  }
}

async function getIncidentAssignments(req, res, next) {
  try {
    const assignments = await assignmentService.getIncidentAssignments(req.user.role, req.params.incidentId);
    res.status(200).json({
      success: true,
      assignments
    });
  } catch (err) {
    next(err);
  }
}

async function getVolunteerAssignments(req, res, next) {
  try {
    const assignments = await assignmentService.getVolunteerAssignments(req.user.id);
    res.status(200).json({
      success: true,
      assignments
    });
  } catch (err) {
    next(err);
  }
}

async function accept(req, res, next) {
  try {
    const assignment = await assignmentService.updateAssignmentStatus(
      req.params.id,
      req.user.id,
      req.user.role,
      "ACCEPTED"
    );
    res.status(200).json({
      success: true,
      assignment
    });
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const assignment = await assignmentService.updateAssignmentStatus(
      req.params.id,
      req.user.id,
      req.user.role,
      "REJECTED"
    );
    res.status(200).json({
      success: true,
      assignment
    });
  } catch (err) {
    next(err);
  }
}

async function start(req, res, next) {
  try {
    const assignment = await assignmentService.updateAssignmentStatus(
      req.params.id,
      req.user.id,
      req.user.role,
      "ACTIVE"
    );
    res.status(200).json({
      success: true,
      assignment
    });
  } catch (err) {
    next(err);
  }
}

async function complete(req, res, next) {
  try {
    const assignment = await assignmentService.updateAssignmentStatus(
      req.params.id,
      req.user.id,
      req.user.role,
      "COMPLETED"
    );
    res.status(200).json({
      success: true,
      assignment
    });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const assignment = await assignmentService.updateAssignmentStatus(
      req.params.id,
      req.user.id,
      req.user.role,
      "CANCELLED"
    );
    res.status(200).json({
      success: true,
      assignment
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  assign,
  getMatches,
  getIncidentAssignments,
  getVolunteerAssignments,
  accept,
  reject,
  start,
  complete,
  cancel
};
