// backend/routes/appointments.js
const express = require('express');
const router = express.Router();

// Import core functions
const {
  bookAppointment,
  cancelAppointment,
  modifyAppointment,
  generateQueueNumber,
  checkInPatient,
  updateDoctorAvailability,
  sendNotification,
  getPatientAppointments,
  getTodaysQueueByDoctor,
} = require('../core-functions-db');

// POST /api/appointments/book
router.post('/book', async (req, res) => {
  const { patientId, doctorId, dateTime } = req.body;
  
  const result = await bookAppointment(patientId, doctorId, dateTime);

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

// DELETE /api/appointments/:appointmentId/cancel
router.delete('/:appointmentId/cancel', async (req, res) => {
  const { appointmentId } = req.params;
  
  const result = await cancelAppointment(appointmentId);
  
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// PUT /api/appointments/:appointmentId/modify
router.put('/:appointmentId/modify', async (req, res) => {
  const { appointmentId } = req.params;
  const { newDateTime } = req.body;
  
  const result = await modifyAppointment(appointmentId, newDateTime);
  
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/appointments/:appointmentId/queue
router.post('/:appointmentId/queue', async (req, res) => {
  const { appointmentId } = req.params;
  
  const result = await generateQueueNumber(appointmentId);
  
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/appointments/:appointmentId/checkin
router.post('/:appointmentId/checkin', async (req, res) => {
  const { appointmentId } = req.params;
  
  const result = await checkInPatient(appointmentId);
  
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// PUT /api/appointments/doctors/:doctorId/availability
router.put('/doctors/:doctorId/availability', async (req, res) => {
  const { doctorId } = req.params;
  const schedule = req.body;
  
  const result = await updateDoctorAvailability(doctorId, schedule);
  
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/appointments/notifications/send
router.post('/notifications/send', async (req, res) => {
  const { patientId, message } = req.body;
  
  const result = await sendNotification(patientId, message);
  
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// GET /api/appointments
router.get('/', async (req, res) => {
  const { patientId } = req.query;
  const appointments = await getPatientAppointments(patientId);
  res.status(200).json(appointments);
});

// GET /api/queue - Today's appointments grouped by doctor
router.get('/queue', async (req, res) => {
  try {
    const queueByDoctor = await getTodaysQueueByDoctor();
    res.status(200).json(queueByDoctor);
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

module.exports = router;