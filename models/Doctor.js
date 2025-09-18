// backend/models/Doctor.js
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  available: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const doctorSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  schedules: [scheduleSchema]
}, {
  timestamps: true
});

// Index for faster queries
doctorSchema.index({ doctorId: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);