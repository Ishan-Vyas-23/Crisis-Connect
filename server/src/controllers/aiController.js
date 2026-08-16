const aiService = require('../services/aiService');

async function classify(req, res, next) {
  try {
    const result = await aiService.classifyIncident(req.user.role, req.params.id);
    if (!result.success) {
      return res.status(502).json({
        success: false,
        code: "AI_ERROR",
        message: result.error,
        analysis: result.analysis
      });
    }
    res.status(200).json({
      success: true,
      applied: result.applied,
      analysis: result.analysis
    });
  } catch (err) {
    next(err);
  }
}

async function getAnalyses(req, res, next) {
  try {
    const analyses = await aiService.getAIAnalyses(req.user.role, req.params.id);
    res.status(200).json({
      success: true,
      analyses
    });
  } catch (err) {
    next(err);
  }
}

async function review(req, res, next) {
  try {
    const incident = await aiService.reviewIncidentAI(
      req.user.role,
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      incident
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  classify,
  getAnalyses,
  review
};
