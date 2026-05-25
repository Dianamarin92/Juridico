const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

const router = express.Router();

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  const { ticket_id } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

  try {
    const filePath = `/uploads/${req.file.filename}`;
    await db.query(
      'INSERT INTO file_uploads (ticket_id, filename, path, uploaded_by) VALUES (?, ?, ?, ?)',
      [ticket_id, req.file.originalname, filePath, req.user.id]
    );
    res.status(201).json({ path: filePath, name: req.file.originalname });
  } catch {
    res.status(500).json({ error: 'Error al guardar archivo' });
  }
});

router.get('/', auth, async (req, res) => {
  const { ticket_id } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT * FROM file_uploads WHERE ticket_id = ? ORDER BY created_at DESC',
      [ticket_id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener archivos' });
  }
});

module.exports = router;
