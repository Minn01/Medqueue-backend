const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medqueue');
    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error("Error details: ")
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const appointmentRoutes = require('./routes/appointments');

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Medqueue API is running!',
    status: 'success',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Test route for API functionality
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API Test Successful',
    available_functions: [
      'bookAppointment',
      'cancelAppointment', 
      'modifyAppointment',
      'generateQueueNumber',
      'checkInPatient',
      'updateDoctorAvailability',
      'sendNotification'
    ],
    endpoints: [
      'POST /api/appointments/book',
      'DELETE /api/appointments/:id/cancel',
      'PUT /api/appointments/:id/modify',
      'POST /api/appointments/:id/queue',
      'POST /api/appointments/:id/checkin',
      'PUT /api/appointments/doctors/:id/availability',
      'POST /api/appointments/notifications/send'
    ],
    status: 'ready_for_development'
  });
});

// Use appointment routes
app.use('/api/appointments', appointmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Medqueue Backend Server Started');
  console.log(`📱 Server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`🔍 API test: http://localhost:${PORT}/api/test`);
  console.log('👥 Team: Min Thant, Thant Zin Min, Myat Bhone Thet, Aung Khant Zaw, Tun Tauk Oo');
});