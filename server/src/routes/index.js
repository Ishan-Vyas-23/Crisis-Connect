const express = require('express');
const authRoutes = require('./authRoutes');
const incidentRoutes = require('./incidentRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/incidents', incidentRoutes);

module.exports = router;
