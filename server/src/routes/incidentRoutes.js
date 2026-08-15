const express = require('express');
const incidentController = require('../controllers/incidentController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { createIncidentSchema, updateStatusSchema } = require('../validators/incidentValidator');

const router = express.Router();

// Apply authentication to all incident routes
router.use(authMiddleware);

router.post('/', validate(createIncidentSchema), incidentController.create);
router.get('/', incidentController.list);
router.get('/:id', incidentController.getById);

// Strictly gate status changes to ADMIN and ORGANIZATION_ADMIN
router.patch('/:id/status', requireRole('ADMIN', 'ORGANIZATION_ADMIN'), validate(updateStatusSchema), incidentController.updateStatus);

module.exports = router;
