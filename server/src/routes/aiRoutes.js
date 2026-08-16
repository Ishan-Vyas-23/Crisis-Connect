const express = require('express');
const aiController = require('../controllers/aiController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { humanReviewSchema } = require('../validators/aiValidator');

const router = express.Router();

// Apply auth to all AI routes
router.use(authMiddleware);

// Declare paths (mounted under /incidents in parent router)
router.post('/:id/ai-classify', requireRole('ADMIN'), aiController.classify);
router.get('/:id/ai-analysis', requireRole('ADMIN'), aiController.getAnalyses);
router.patch('/:id/ai-review', requireRole('ADMIN'), validate(humanReviewSchema), aiController.review);

module.exports = router;
