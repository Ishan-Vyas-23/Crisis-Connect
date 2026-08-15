const incidentService = require('../services/incidentService');

async function create(req, res, next) {
  try {
    const incident = await incidentService.createIncident(req.user.id, req.body);
    res.status(201).json({
      success: true,
      incident
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { status, category, priority, page, limit } = req.query;
    const result = await incidentService.listIncidents({
      status,
      category,
      priority,
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

async function getById(req, res, next) {
  try {
    const incident = await incidentService.getIncidentById(req.params.id);
    res.status(200).json({
      success: true,
      incident
    });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const incident = await incidentService.updateIncidentStatus(req.params.id, req.body.status, req.user.role);
    res.status(200).json({
      success: true,
      incident
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  getById,
  updateStatus
};
