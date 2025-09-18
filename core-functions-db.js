// backend/core-functions-db.js
// Enhanced core functions with MongoDB integration

const Appointment = require('./models/Appointment');
const Doctor = require('./models/Doctor');
const Notification = require('./models/Notification');

// 1. Book Appointment Function (with Database)
async function bookAppointment(patientId, doctorId, dateTime) {
  try {
    // Input validation
    if (!patientId || !doctorId || !dateTime) {
      return {
        success: false,
        message: "Missing required fields: patientId, doctorId, or dateTime",
        appointmentId: null
      };
    }

    // Check if appointment time is in the future
    const appointmentDate = new Date(dateTime);
    const currentDate = new Date();
    
    if (appointmentDate <= currentDate) {
      return {
        success: false,
        message: "Appointment time must be in the future",
        appointmentId: null
      };
    }

    // Generate unique appointment ID
    const appointmentId = generateAppointmentId();
    
    // Create appointment in database
    const appointment = new Appointment({
      appointmentId,
      patientId,
      doctorId,
      dateTime: appointmentDate,
      status: 'confirmed',
      bookedAt: new Date()
    });

    await appointment.save();

    return {
      success: true,
      message: "Appointment booked successfully",
      appointmentId: appointmentId,
      appointment: {
        id: appointmentId,
        patientId,
        doctorId,
        dateTime,
        status: "confirmed",
        queueNumber: null,
        bookedAt: appointment.bookedAt.toISOString()
      }
    };

  } catch (error) {
    return {
      success: false,
      message: "Error booking appointment: " + error.message,
      appointmentId: null
    };
  }
}

// 2. Cancel Appointment Function (with Database)
async function cancelAppointment(appointmentId) {
  try {
    // Input validation
    if (!appointmentId) {
      return {
        success: false,
        message: "Appointment ID is required"
      };
    }

    // Find and update appointment in database
    const appointment = await Appointment.findOne({ appointmentId });
    
    if (!appointment) {
      return {
        success: false,
        message: "Invalid appointment ID or appointment not found"
      };
    }

    if (appointment.status === 'cancelled') {
      return {
        success: false,
        message: "Appointment is already cancelled"
      };
    }

    // Update appointment status
    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    await appointment.save();

    return {
      success: true,
      message: "Appointment cancelled successfully",
      appointmentId: appointmentId,
      cancelledAt: appointment.cancelledAt.toISOString()
    };

  } catch (error) {
    return {
      success: false,
      message: "Error cancelling appointment: " + error.message
    };
  }
}

// 3. Modify Appointment Function (with Database)
async function modifyAppointment(appointmentId, newDateTime) {
  try {
    // Input validation
    if (!appointmentId || !newDateTime) {
      return {
        success: false,
        message: "Appointment ID and new date/time are required"
      };
    }

    // Find appointment in database
    const appointment = await Appointment.findOne({ appointmentId });
    
    if (!appointment) {
      return {
        success: false,
        message: "Invalid appointment ID or appointment not found"
      };
    }

    // Check if new time is in the future
    const newAppointmentDate = new Date(newDateTime);
    const currentDate = new Date();
    
    if (newAppointmentDate <= currentDate) {
      return {
        success: false,
        message: "New appointment time must be in the future"
      };
    }

    // Update appointment
    appointment.dateTime = newAppointmentDate;
    appointment.modifiedAt = new Date();
    await appointment.save();

    return {
      success: true,
      message: "Appointment modified successfully",
      appointmentId: appointmentId,
      newDateTime: newDateTime,
      modifiedAt: appointment.modifiedAt.toISOString()
    };

  } catch (error) {
    return {
      success: false,
      message: "Error modifying appointment: " + error.message
    };
  }
}

// 4. Generate Queue Number Function (with Database)
async function generateQueueNumber(appointmentId) {
  try {
    // Input validation
    if (!appointmentId) {
      return {
        success: false,
        message: "Appointment ID is required",
        queueNumber: null
      };
    }

    // Find appointment in database
    const appointment = await Appointment.findOne({ appointmentId });
    
    if (!appointment) {
      return {
        success: false,
        message: "Invalid appointment ID or appointment not found",
        queueNumber: null
      };
    }

    // Generate queue number if not already exists
    if (appointment.queueNumber) {
      return {
        success: true,
        message: "Queue number already exists",
        queueNumber: appointment.queueNumber,
        appointmentId: appointmentId,
        generatedAt: appointment.updatedAt.toISOString()
      };
    }

    // Generate new queue number
    const today = new Date();
    const datePrefix = today.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.floor(Math.random() * 99) + 1;
    const queueNumber = `Q${datePrefix}${randomSuffix.toString().padStart(2, '0')}`;

    // Update appointment with queue number
    appointment.queueNumber = queueNumber;
    await appointment.save();

    return {
      success: true,
      message: "Queue number generated successfully",
      queueNumber: queueNumber,
      appointmentId: appointmentId,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      message: "Error generating queue number: " + error.message,
      queueNumber: null
    };
  }
}

// 5. Check-in Patient Function (with Database)
async function checkInPatient(appointmentId) {
  try {
    // Input validation
    if (!appointmentId) {
      return {
        success: false,
        message: "Appointment ID is required",
        status: null
      };
    }

    // Find appointment in database
    const appointment = await Appointment.findOne({ appointmentId });
    
    if (!appointment) {
      return {
        success: false,
        message: "Invalid appointment ID or appointment not found",
        status: null
      };
    }

    // Check if already checked in
    if (appointment.checkedIn) {
      return {
        success: false,
        message: "Patient is already checked in",
        status: "already-checked-in"
      };
    }

    // Generate queue number if not exists
    let queueNumber = appointment.queueNumber;
    if (!queueNumber) {
      const queueResult = await generateQueueNumber(appointmentId);
      if (!queueResult.success) {
        return queueResult;
      }
      queueNumber = queueResult.queueNumber;
    }

    // Update check-in status
    appointment.checkedIn = true;
    appointment.checkedInAt = new Date();
    await appointment.save();
    
    return {
      success: true,
      message: "Patient checked in successfully",
      appointmentId: appointmentId,
      status: "checked-in",
      queueNumber: queueNumber,
      checkedInAt: appointment.checkedInAt.toISOString()
    };

  } catch (error) {
    return {
      success: false,
      message: "Error checking in patient: " + error.message,
      status: null
    };
  }
}

// 6. Update Doctor Availability Function (with Database)
async function updateDoctorAvailability(doctorId, schedule) {
  try {
    // Input validation
    if (!doctorId) {
      return {
        success: false,
        message: "Doctor ID is required"
      };
    }

    if (!schedule || typeof schedule !== 'object') {
      return {
        success: false,
        message: "Valid schedule object is required"
      };
    }

    // Validate schedule format
    const requiredFields = ['date', 'startTime', 'endTime', 'available'];
    const hasAllFields = requiredFields.every(field => schedule.hasOwnProperty(field));
    
    if (!hasAllFields) {
      return {
        success: false,
        message: "Schedule must include: date, startTime, endTime, available"
      };
    }

    // Find or create doctor
    let doctor = await Doctor.findOne({ doctorId });
    
    if (!doctor) {
      // Create new doctor if doesn't exist
      doctor = new Doctor({
        doctorId,
        name: `Dr. ${doctorId}`,
        specialization: 'General Medicine',
        schedules: []
      });
    }

    // Update or add schedule
    const existingScheduleIndex = doctor.schedules.findIndex(
      s => s.date === schedule.date
    );

    const scheduleData = {
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      available: schedule.available,
      updatedAt: new Date()
    };

    if (existingScheduleIndex >= 0) {
      doctor.schedules[existingScheduleIndex] = scheduleData;
    } else {
      doctor.schedules.push(scheduleData);
    }

    await doctor.save();

    return {
      success: true,
      message: "Doctor availability updated successfully",
      doctorId: doctorId,
      schedule: scheduleData,
      updatedAt: scheduleData.updatedAt.toISOString()
    };

  } catch (error) {
    return {
      success: false,
      message: "Error updating doctor availability: " + error.message
    };
  }
}

// 7. Send Notification Function (with Database)
async function sendNotification(patientId, message) {
  try {
    // Input validation
    if (!patientId) {
      return {
        success: false,
        message: "Patient ID is required",
        notificationId: null
      };
    }

    if (!message || message.trim().length === 0) {
      return {
        success: false,
        message: "Notification message cannot be empty",
        notificationId: null
      };
    }

    // Generate notification ID
    const notificationId = generateNotificationId();

    // Create notification in database
    const notification = new Notification({
      notificationId,
      patientId,
      message: message.trim(),
      type: 'general',
      deliveryMethod: 'console',
      status: 'sent',
      sentAt: new Date()
    });

    await notification.save();

    return {
      success: true,
      message: "Notification sent successfully",
      notificationId: notificationId,
      patientId: patientId,
      notificationMessage: message.trim(),
      sentAt: notification.sentAt.toISOString(),
      deliveryMethod: "console"
    };

  } catch (error) {
    return {
      success: false,
      message: "Error sending notification: " + error.message,
      notificationId: null
    };
  }
}

// Helper Functions
function generateAppointmentId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `APT${timestamp}${random}`;
}

function generateNotificationId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `NOT${timestamp}${random}`;
}

// Export functions for use in other files
module.exports = {
  bookAppointment,
  cancelAppointment,
  modifyAppointment,
  generateQueueNumber,
  checkInPatient,
  updateDoctorAvailability,
  sendNotification
};
