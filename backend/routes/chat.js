// backend/routes/chat.js
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Multer setup - files saved to backend/uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// AES Encryption Helper
const algorithm = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.randomBytes(32); // You can also load this securely from env
const IV_LENGTH = 16;

function encryptFile(filePath) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
  const input = fs.createReadStream(filePath);
  const output = fs.createWriteStream(filePath + '.enc');

  input.pipe(cipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on('finish', () => {
      fs.unlinkSync(filePath); // delete original unencrypted file
      resolve(filePath + '.enc');
    });
    output.on('error', reject);
  });
}

function decryptFile(filePath, res) {
  const iv = fs.readFileSync(filePath).slice(0, IV_LENGTH);
  const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, iv);
  const encryptedStream = fs.createReadStream(filePath, { start: IV_LENGTH });

  res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath).replace('.enc', '')}"`);
  encryptedStream.pipe(decipher).pipe(res);
}

// Upload route
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const encryptedPath = await encryptFile(req.file.path);
    res.status(200).json({ message: 'File uploaded and encrypted', file: path.basename(encryptedPath) });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'File upload failed' });
  }
});

// Download route
router.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });

  decryptFile(filePath, res);
});

module.exports = router;
