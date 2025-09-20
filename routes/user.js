const express = require('express');
const router = express.Router();

// Import core functions
const {
    signupPatient,
    loginPatient
} = require('../core-functions-db');

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }

  const result = await signupPatient(name, email, password);

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  const result = await loginPatient(email, password);

  if (result.success) {
    res.status(200).json(result); // 200 for login, not 201
  } else {
    res.status(401).json(result); // 401 for unauthorized
  }
});


module.exports = router;