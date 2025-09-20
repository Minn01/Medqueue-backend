const express = require('express');
const router = express.Router();
const { getDoctors, getTimeSlots } = require('../core-functions-db');

// GET /api/doctors
router.get('/', async (req, res) => {
  const doctors = await getDoctors();
  res.status(200).json(doctors);
});

// GET /api/doctors/:id/slots
router.get('/:id/slots', async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  const slots = await getTimeSlots(id, date);
  res.status(200).json(slots);
});

module.exports = router;