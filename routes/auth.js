const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const failedAttempts = {}; // Track failed login attempts per username
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    return res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('[LOGIN ATTEMPT]', req.body);

  const now = Date.now();
  if (failedAttempts[username] && failedAttempts[username].blockedUntil > now) {
    return res.status(429).json({ message: 'Too many failed attempts. Try again later.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      trackFailedAttempt(username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[PASSWORD MATCH RESULT]', isMatch);

    if (!isMatch) {
      trackFailedAttempt(username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (failedAttempts[username]) delete failedAttempts[username];

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ token, username: user.username });
  } catch (err) {
    console.error('[SERVER ERROR]', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

function trackFailedAttempt(username) {
  const now = Date.now();
  if (!failedAttempts[username]) {
    failedAttempts[username] = { count: 1, lastAttempt: now, blockedUntil: 0 };
  } else {
    failedAttempts[username].count++;
    failedAttempts[username].lastAttempt = now;
  }

  if (failedAttempts[username].count >= MAX_ATTEMPTS) {
    failedAttempts[username].blockedUntil = now + BLOCK_DURATION;
    console.warn(`[BLOCKED] ${username} blocked until ${new Date(failedAttempts[username].blockedUntil).toLocaleTimeString()}`);
  }
}

module.exports = router;
