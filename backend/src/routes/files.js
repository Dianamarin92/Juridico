const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { canAccessFile, getAllowedCompanyIds } = require('../middleware/companyAccess');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Los campos deben ir antes que el archivo en el FormData para estar disponibles aquí
    const companyId = parseInt(req.body.company_id, 10);
    const ticketId = parseInt(req.body.ticket_id, 10);
    let dir = 'uploads/';
    if (companyId > 0) {
      dir = `uploads/empresa_${companyId}/`;
    } else if (ticketId > 0) {
      dir = `uploads/ticket_${ticketId}/`;
    } else if (req.body.task_id) {
      dir = `uploads/tareas/`;
    }
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

const router = express.Router();

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  const { ticket_id, company_id, task_id } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
  if (!ticket_id && !company_id && !task_id) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'ticket_id, company_id o task_id requerido' });
  }

  try {
    if (!(await canAccessFile(req.user, req.body))) {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ error: 'Sin acceso' });
    }
    const filePath = '/' + path.posix.join(req.file.destination, req.file.filename);
    const [result] = await db.query(
      'INSERT INTO file_uploads (ticket_id, company_id, task_id, filename, path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [ticket_id || null, company_id || null, task_id || null, req.file.originalname, filePath, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM file_uploads WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al guardar archivo' });
  }
});

router.get('/storage', auth, async (req, res) => {
  const TOTAL_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
  const uploadsDir = path.join(__dirname, '../../uploads');
  const dirSize = (dir) => {
    let total = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      try {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) total += dirSize(full);
        else if (entry.isFile()) total += fs.statSync(full).size;
      } catch {}
    }
    return total;
  };
  const usedBytes = fs.existsSync(uploadsDir) ? dirSize(uploadsDir) : 0;
  res.json({ used: usedBytes, total: TOTAL_BYTES });
});

router.get('/', auth, async (req, res) => {
  const { ticket_id, company_id, task_id, all_tasks } = req.query;
  try {
    let rows;
    if (all_tasks) {
      if (req.user.role === 'cliente') return res.status(403).json({ error: 'Sin acceso' });
      // Solo archivos de tareas que el usuario puede ver (sin empresa = solo con acceso a todas)
      const allowedCompanies = await getAllowedCompanyIds(req.user);
      if (allowedCompanies !== null && allowedCompanies.length === 0) return res.json([]);
      const where = allowedCompanies === null
        ? ''
        : `AND t.company_id IN (${allowedCompanies.map(() => '?').join(',')})`;
      [rows] = await db.query(
        `SELECT f.* FROM file_uploads f JOIN tasks t ON f.task_id = t.id
         WHERE f.task_id IS NOT NULL ${where}
         ORDER BY f.task_id, f.created_at DESC`,
        allowedCompanies || []
      );
      return res.json(rows);
    }
    if (!(await canAccessFile(req.user, { ticket_id, company_id, task_id })))
      return res.status(403).json({ error: 'Sin acceso' });
    if (task_id) {
      [rows] = await db.query(
        'SELECT * FROM file_uploads WHERE task_id = ? ORDER BY created_at DESC',
        [task_id]
      );
    } else if (company_id) {
      [rows] = await db.query(
        'SELECT * FROM file_uploads WHERE company_id = ? ORDER BY created_at DESC',
        [company_id]
      );
    } else {
      [rows] = await db.query(
        'SELECT * FROM file_uploads WHERE ticket_id = ? ORDER BY created_at DESC',
        [ticket_id]
      );
    }
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
    if (!(await canAccessFile(req.user, rows[0]))) return res.status(403).json({ error: 'Sin acceso' });

    const fullPath = path.join(__dirname, '../..', rows[0].path);
    fs.unlink(fullPath, () => {});

    await db.query('DELETE FROM file_uploads WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
});

module.exports = router;
