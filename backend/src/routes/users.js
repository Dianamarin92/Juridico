const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Lista de abogadas disponibles para asignar tickets
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, role FROM users WHERE role != 'cliente' ORDER BY role"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Actualizar contraseña del usuario autenticado
router.put('/me/password', auth, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 4)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
});

module.exports = router;
