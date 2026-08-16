const express = require('express');
const authRoutes = require('./authRoutes');
const incidentRoutes = require('./incidentRoutes');
const volunteerRoutes = require('./volunteerRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const aiRoutes = require('./aiRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/incidents', incidentRoutes);
router.use('/incidents', aiRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/assignments', assignmentRoutes);

module.exports = router;
