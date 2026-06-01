const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

router.get('/storage', auth, async (req, res) => {
  const TOTAL_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
  const uploadsDir = path.join(__dirname, '../../uploads');
  let usedBytes = 0;
  if (fs.existsSync(uploadsDir)) {
    for (const file of fs.readdirSync(uploadsDir)) {
      try {
        const stat = fs.statSync(path.join(uploadsDir, file));
        if (stat.isFile()) usedBytes += stat.size;
      } catch {}
    }
  }
  res.json({ used: usedBytes, total: TOTAL_BYTES });
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

router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM file_uploads WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Archivo no encontrado' });

    const fullPath = path.join(__dirname, '../../', rows[0].path);
    fs.unlink(fullPath, () => {});

    await db.query('DELETE FROM file_uploads WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
});

module.exports = router;
