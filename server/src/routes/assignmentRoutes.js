const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { manualAssignmentSchema } = require('../validators/assignmentValidator');

const router = express.Router();

// Apply authentication to all assignment routes
router.use(authMiddleware);

// ADMIN only routes for managing assignments and matches
router.post('/', requireRole('ADMIN'), validate(manualAssignmentSchema), assignmentController.assign);
router.get('/incidents/:incidentId/matches', requireRole('ADMIN'), assignmentController.getMatches);
router.get('/incidents/:incidentId', requireRole('ADMIN'), assignmentController.getIncidentAssignments);

// VOLUNTEER only route to list own assignments
router.get('/volunteers/me', requireRole('VOLUNTEER'), assignmentController.getVolunteerAssignments);

// Assignment status transition routes
router.patch('/:id/accept', requireRole('VOLUNTEER'), assignmentController.accept);
router.patch('/:id/reject', requireRole('VOLUNTEER'), assignmentController.reject);
router.patch('/:id/start', requireRole('VOLUNTEER'), assignmentController.start);
router.patch('/:id/complete', requireRole('VOLUNTEER'), assignmentController.complete);

// Both ADMIN and VOLUNTEER owner can cancel a non-terminal assignment
router.patch('/:id/cancel', requireRole('ADMIN', 'VOLUNTEER'), assignmentController.cancel);

module.exports = router;
