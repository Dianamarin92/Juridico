const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { company_id } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT t.*, u.email as assigned_email FROM tickets t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.company_id = ? ORDER BY t.created_at DESC',
      [company_id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

router.post('/', auth, async (req, res) => {
  const { company_id, title, description } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO tickets (company_id, title, description, status, created_by) VALUES (?, ?, ?, "pending", ?)',
      [company_id, title, description, req.user.id]
    );
    await db.query(
      'INSERT INTO audit_logs (ticket_id, user_id, action, new_value) VALUES (?, ?, ?, ?)',
      [result.insertId, req.user.id, 'Ticket creado', 'pending']
    );
    res.status(201).json({ id: result.insertId });
  } catch {
    res.status(500).json({ error: 'Error al crear ticket' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { status, assigned_to } = req.body;
  const { id } = req.params;
  try {
    const [current] = await db.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!current[0]) return res.status(404).json({ error: 'Ticket no encontrado' });

    await db.query('UPDATE tickets SET status = ?, assigned_to = ? WHERE id = ?', [
      status || current[0].status,
      assigned_to !== undefined ? assigned_to : current[0].assigned_to,
      id,
    ]);

    if (status && status !== current[0].status) {
      await db.query(
        'INSERT INTO audit_logs (ticket_id, user_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, 'Cambio de estado', current[0].status, status]
      );
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
});

module.exports = router;
