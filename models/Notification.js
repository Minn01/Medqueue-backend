// backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['appointment_confirmation', 'reminder', 'cancellation', 'queue_update', 'general'],
    default: 'general'
  },
  deliveryMethod: {
    type: String,
    enum: ['console', 'email', 'sms', 'push'],
    default: 'console'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed'],
    default: 'sent'
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ patientId: 1 });
notificationSchema.index({ sentAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);