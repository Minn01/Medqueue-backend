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
  sendNotification
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

// Signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await Patient.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const patient = new Patient({ name, email, password });
    await patient.save();

    res.status(201).json({ id: patient._id, name: patient.name, email: patient.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const patient = await Patient.findOne({ email });
    if (!patient) return res.status(400).json({ error: 'Patient not found' });

    const match = await patient.comparePassword(password);
    if (!match) return res.status(400).json({ error: 'Incorrect password' });

    // Optional: JWT token
    const token = jwt.sign({ id: patient._id }, 'your_jwt_secret', { expiresIn: '1h' });
    res.status(200).json({ id: patient._id, name: patient.name, email: patient.email, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;