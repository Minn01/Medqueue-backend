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

const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

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

// GET /api/appointments/patient/:patientId
router.get('/patient/:patientId', async (req, res) => {
  const { patientId } = req.params;
  
  try {
    const appointments = await getPatientAppointments(patientId);
    res.status(200).json({
      success: true,
      appointments: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient appointments'
    });
  }
});

// GET /api/appointments/queue - Today's appointments grouped by doctor
router.get('/queue', async (req, res) => {
  try {
    const queueByDoctor = await getTodaysQueueByDoctor();
    res.status(200).json(queueByDoctor);
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// GET /api/appointments/today - Get today's appointments for receptionist dashboard - FIXED
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // FIXED: Include ALL status types, not just confirmed and cancelled
    const appointments = await Appointment.find({
      dateTime: {
        $gte: today,
        $lt: tomorrow
      }
      // REMOVED: status filter to include completed, no-show, etc.
    }).sort({ dateTime: 1 });

    const formattedAppointments = [];

    // Get patient names for each appointment
    for (let i = 0; i < appointments.length; i++) {
      const apt = appointments[i];
      
      // Try to find patient by ID to get the actual name
      let patientName = `Patient ${apt.patientId}`;
      let isWalkIn = false;
      
      try {
        const patient = await Patient.findById(apt.patientId);
        if (patient && patient.name) {
          patientName = patient.name;
          
          // FIXED: Distinguish between walk-ins and appointments using email patterns
          if (patient.email && patient.email.includes('@clinic.temp')) {
            isWalkIn = true;  // Walk-ins use @clinic.temp
          } else if (patient.email && patient.email.includes('@clinic.appointment')) {
            isWalkIn = false; // Appointments use @clinic.appointment
          }
        }
      } catch (error) {
        console.log(`Could not find patient name for ID: ${apt.patientId}`);
      }

      // FIXED: Map database status to frontend status properly
      let frontendStatus;
      if (apt.status === 'cancelled') {
        frontendStatus = 'Cancelled';
      } else if (apt.status === 'completed') {
        frontendStatus = 'Completed';
      } else if (apt.status === 'no-show') {
        frontendStatus = 'No-show';
      } else if (apt.status === 'in-consultation') {
        frontendStatus = 'In consultation';
      } else if (apt.checkedIn) {
        frontendStatus = 'Arrived';
      } else {
        frontendStatus = 'Waiting';
      }

      formattedAppointments.push({
        id: apt._id.toString(),
        appointmentId: apt.appointmentId,
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        name: patientName,
        dateTime: apt.dateTime,
        scheduledTime: apt.dateTime,
        status: frontendStatus, // FIXED: Use proper status mapping
        type: isWalkIn ? 'walk-in' : 'appointment', // FIXED: Properly identify type
        queueNo: i + 1,
        serviceTime: '30min',
        checkedIn: apt.checkedIn,
        queueNumber: apt.queueNumber
      });
    }

    res.status(200).json({
      success: true,
      appointments: formattedAppointments
    });
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments'
    });
  }
});

// PUT /api/appointments/:appointmentId/status - Update appointment status
router.put('/:appointmentId/status', async (req, res) => {
  console.log('=== STATUS UPDATE DEBUG ===');
  console.log('Appointment ID:', req.params.appointmentId);
  console.log('New Status:', req.body.status);
  console.log('Request Body:', req.body);
  
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    console.log('Looking for appointment:', appointmentId);
    const appointment = await Appointment.findOne({ appointmentId });
    
    if (!appointment) {
      console.log('Appointment not found!');
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    console.log('Found appointment:', appointment.appointmentId, 'Current status:', appointment.status);

    // Handle different status updates
    console.log('Updating status to:', status);
    switch (status) {
      case 'Arrived':
        appointment.checkedIn = true;
        appointment.checkedInAt = new Date();
        if (!appointment.queueNumber) {
          appointment.queueNumber = `Q${Date.now()}${Math.floor(Math.random() * 100)}`;
        }
        break;
      case 'Completed':
        appointment.status = 'completed';
        appointment.modifiedAt = new Date();
        break;
      case 'No-show':
        appointment.status = 'no-show';
        appointment.modifiedAt = new Date();
        break;
      case 'In consultation':
        appointment.status = 'in-consultation';
        appointment.modifiedAt = new Date();
        break;
    }

    console.log('About to save appointment...');
    await appointment.save();
    console.log('Appointment saved successfully!');

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      appointment: {
        appointmentId: appointment.appointmentId,
        status: status,
        queueNumber: appointment.queueNumber,
        checkedIn: appointment.checkedIn
      }
    });
  } catch (error) {
    console.error('=== ERROR UPDATING STATUS ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
});

// POST /api/appointments/walk-in - Add walk-in appointment - FIXED
router.post('/walk-in', async (req, res) => {
  try {
    const { patientName, patientEmail, doctorId, dateTime } = req.body;

    // Generate unique IDs
    const appointmentId = `APT${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // CREATE PATIENT RECORD FIRST - This is the fix!
    const newPatient = new Patient({
      name: patientName,
      email: patientEmail,
      password: 'temp123' // Temporary password for walk-ins
    });
    await newPatient.save();

    // Create appointment with the actual Patient _id
    const appointment = new Appointment({
      appointmentId,
      patientId: newPatient._id.toString(), // Use the actual patient database ID
      doctorId: doctorId || 'DOC001',
      dateTime: new Date(dateTime),
      status: 'confirmed',
      queueNumber: `Q${Date.now()}${Math.floor(Math.random() * 100)}`,
      bookedAt: new Date()
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Walk-in appointment created successfully',
      appointment: {
        id: appointment._id.toString(),
        appointmentId: appointment.appointmentId,
        patientId: newPatient._id.toString(),
        patientName: patientName, // Return the actual name
        patientEmail: patientEmail,
        doctorId: appointment.doctorId,
        dateTime: appointment.dateTime,
        queueNumber: appointment.queueNumber,
        status: 'confirmed'
      }
    });
  } catch (error) {
    console.error('Error creating walk-in appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating walk-in appointment'
    });
  }
});

module.exports = router;