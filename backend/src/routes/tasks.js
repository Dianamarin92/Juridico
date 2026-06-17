const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  if (req.user.role === 'cliente') return res.status(403).json({ error: 'Sin permisos' });
  try {
    const [rows] = await db.query(
      `SELECT t.*, u.name as created_by_name
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       ORDER BY
         FIELD(t.estado, 'pendiente', 'contestada', 'terminada'),
         t.fecha IS NULL,
         t.fecha ASC,
         t.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

router.post('/', auth, async (req, res) => {
  if (req.user.role === 'cliente') return res.status(403).json({ error: 'Sin permisos' });
  const { fecha, cliente_proceso, tarea, responsable, observaciones, link_revision, prioridad, estado } = req.body;
  if (!tarea || !tarea.trim()) return res.status(400).json({ error: 'La tarea es requerida' });
  try {
    const [result] = await db.query(
      `INSERT INTO tasks (fecha, cliente_proceso, tarea, responsable, observaciones, link_revision, prioridad, estado, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fecha || null, cliente_proceso || null, tarea.trim(), responsable || null, observaciones || null, link_revision || null, prioridad || 'media', estado || 'pendiente', req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

router.put('/:id', auth, async (req, res) => {
  if (req.user.role === 'cliente') return res.status(403).json({ error: 'Sin permisos' });
  const { fecha, cliente_proceso, tarea, responsable, observaciones, link_revision, prioridad, estado } = req.body;
  if (!tarea || !tarea.trim()) return res.status(400).json({ error: 'La tarea es requerida' });
  try {
    await db.query(
      `UPDATE tasks SET fecha=?, cliente_proceso=?, tarea=?, responsable=?, observaciones=?, link_revision=?, prioridad=?, estado=?
       WHERE id=?`,
      [fecha || null, cliente_proceso || null, tarea.trim(), responsable || null, observaciones || null, link_revision || null, prioridad || 'media', estado || 'pendiente', req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role === 'cliente') return res.status(403).json({ error: 'Sin permisos' });
  try {
    await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
});

module.exports = router;
