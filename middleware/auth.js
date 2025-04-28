// middleware/auth.js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

// Middleware to verify JWT token
function verifyJWT(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token.split(' ')[1], jwtSecret); // Bearer <token>
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { verifyJWT };
