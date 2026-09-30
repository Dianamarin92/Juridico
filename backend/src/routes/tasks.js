const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { getAllowedCompanyIds, canAccessTask } = require('../middleware/companyAccess');

const router = express.Router();

const TASK_SELECT = `
  SELECT t.*, u.name as created_by_name, c.name as company_name
  FROM tasks t
  LEFT JOIN users u ON t.created_by = u.id
  LEFT JOIN companies c ON t.company_id = c.id`;

// Devuelve un mensaje de error si el usuario no puede asignar esa empresa a una tarea
async function checkTaskCompany(user, companyId) {
  const allowed = await getAllowedCompanyIds(user);
  if (!companyId) return allowed === null ? null : 'Selecciona la empresa de la tarea';
  if (allowed !== null && !allowed.includes(Number(companyId))) return 'No tienes acceso a esa empresa';
  return null;
}

router.get('/', auth, async (req, res) => {
  if (req.user.role === 'cliente') return res.status(403).json({ error: 'Sin permisos' });
  try {
    let where = '';
    const allowed = await getAllowedCompanyIds(req.user);
    if (allowed !== null) {
      if (allowed.length === 0) return res.json([]);
      where = `WHERE t.company_id IN (${allowed.map(() => '?').join(',')})`;
    }
    const [rows] = await db.query(
      `${TASK_SELECT}
       ${where}
       ORDER BY
         FIELD(t.estado, 'pendiente', 'contestada', 'terminada'),
         t.fecha_inicio IS NULL,
         t.fecha_inicio ASC,
         t.created_at DESC`,
      allowed || []
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

router.post('/', auth, async (req, res) => {
  if (req.user.role === 'cliente') return res.status(403).json({ error: 'Sin permisos' });
  const { company_id, fecha_inicio, fecha_fin, cliente_proceso, tarea, responsable, observaciones, link_revision, prioridad, estado } = req.body;
  if (!tarea || !tarea.trim()) return res.status(400).json({ error: 'La tarea es requerida' });
  try {
    const companyError = await checkTaskCompany(req.user, company_id);
    if (companyError) return res.status(400).json({ error: companyError });
    const [result] = await db.query(
      `INSERT INTO tasks (company_id, fecha_inicio, fecha_fin, cliente_proceso, tarea, responsable, observaciones, link_revision, prioridad, estado, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_id || null, fecha_inicio || null, fecha_fin || null, cliente_proceso || null, tarea.trim(), responsable || null, observaciones || null, link_revision || null, prioridad || 'media', estado || 'pendiente', req.user.id]
    );
    const [rows] = await db.query(`${TASK_SELECT} WHERE t.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

router.put('/:id', auth, async (req, res) => {
  if (req.user.role === 'cliente') return res.status(403).json({ error: 'Sin permisos' });
  const { company_id, fecha_inicio, fecha_fin, cliente_proceso, tarea, responsable, observaciones, link_revision, prioridad, estado } = req.body;
  if (!tarea || !tarea.trim()) return res.status(400).json({ error: 'La tarea es requerida' });
  try {
    if (!(await canAccessTask(req.user, req.params.id))) return res.status(403).json({ error: 'Sin acceso a esta tarea' });
    const companyError = await checkTaskCompany(req.user, company_id);
    if (companyError) return res.status(400).json({ error: companyError });
    await db.query(
      `UPDATE tasks SET company_id=?, fecha_inicio=?, fecha_fin=?, cliente_proceso=?, tarea=?, responsable=?, observaciones=?, link_revision=?, prioridad=?, estado=?
       WHERE id=?`,
      [company_id || null, fecha_inicio || null, fecha_fin || null, cliente_proceso || null, tarea.trim(), responsable || null, observaciones || null, link_revision || null, prioridad || 'media', estado || 'pendiente', req.params.id]
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
    if (!(await canAccessTask(req.user, req.params.id))) return res.status(403).json({ error: 'Sin acceso a esta tarea' });
    await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
});

module.exports = router;
