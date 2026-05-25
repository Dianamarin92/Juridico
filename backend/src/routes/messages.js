const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { ticket_id } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT m.*, u.email as sender_email, u.role as sender_role FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.ticket_id = ? ORDER BY m.created_at ASC',
      [ticket_id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

router.post('/', auth, async (req, res) => {
  const { ticket_id, content } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO messages (ticket_id, sender_id, content) VALUES (?, ?, ?)',
      [ticket_id, req.user.id, content]
    );
    res.status(201).json({ id: result.insertId });
  } catch {
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

module.exports = router;
