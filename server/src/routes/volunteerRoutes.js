const express = require('express');
const volunteerController = require('../controllers/volunteerController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const {
  createVolunteerSchema,
  updateVolunteerSchema,
  updateVerificationSchema
} = require('../validators/volunteerValidator');

const router = express.Router();

// Apply authentication to all volunteer routes
router.use(authMiddleware);

// Only CITIZENs can create a volunteer profile
router.post('/', requireRole('CITIZEN'), validate(createVolunteerSchema), volunteerController.create);

// Only VOLUNTEERs can view/update their own profile
router.get('/me', requireRole('VOLUNTEER'), volunteerController.getMe);
router.patch('/me', requireRole('VOLUNTEER'), validate(updateVolunteerSchema), volunteerController.updateMe);

// Only ADMIN and ORGANIZATION_ADMIN can list volunteers
router.get('/', requireRole('ADMIN', 'ORGANIZATION_ADMIN'), volunteerController.list);

// Only ADMIN can verify volunteers in this phase
router.patch('/:id/verification', requireRole('ADMIN'), validate(updateVerificationSchema), volunteerController.updateVerification);

module.exports = router;
