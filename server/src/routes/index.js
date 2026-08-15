const express = require('express');
const authRoutes = require('./authRoutes');
const incidentRoutes = require('./incidentRoutes');
const volunteerRoutes = require('./volunteerRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/incidents', incidentRoutes);
router.use('/volunteers', volunteerRoutes);

module.exports = router;
