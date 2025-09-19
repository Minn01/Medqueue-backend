const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const { generateQueueNumber } = require("../core-functions-db");

router.get("/appointments", async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const appointments = await Appointment.find({
      dateTime: { $gte: start, $lte: end }
    }).populate("patientId doctorId");

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/walkin", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    // create patient
    const patient = new Patient({ name, email: `${Date.now()}@walkin.fake`, password: "walkin123" });
    await patient.save();

    // create appointment now
    const apt = new Appointment({
      patientId: patient._id,
      doctorId: null, // can assign later
      dateTime: new Date(),
      status: "confirmed"
    });

    apt.queueNumber = await generateQueueNumber(apt._id);
    await apt.save();

    res.json({ patient, appointment: apt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/appointments/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const apt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(apt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
