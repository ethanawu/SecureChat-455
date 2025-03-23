const express = require('express');
const router = express.Router();

// Future: handle file uploads, chat logging, etc.
router.get('/', (req, res) => {
  res.send('Chat route placeholder');
});

module.exports = router;
