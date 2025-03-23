const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { jwtSecret } = require('../config');

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('[LOGIN ATTEMPT]', { username, password });
  
    try {
      const user = await User.findOne({ username });
      if (!user) {
        console.log('[LOGIN ERROR] User not found');
        return res.status(404).json({ message: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('[PASSWORD MATCH RESULT]', isMatch);
  
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      console.log('[JWT_SECRET]', jwtSecret);
      const token = jwt.sign(
        { id: user._id, username: user.username },
        jwtSecret,
        { expiresIn: '1h' }
      );
  
      return res.json({ token, username: user.username });
    } catch (err) {
      console.error('[SERVER ERROR]', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
module.exports = router;
