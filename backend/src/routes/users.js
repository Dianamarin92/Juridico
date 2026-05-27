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

// Crear usuario administrativo (abogada)
router.post('/', auth, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  const validRoles = ['abogada_asignada', 'abogada_lider'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Rol no válido' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, hash, role]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'El usuario ya existe' });
    res.status(500).json({ error: 'Error al crear usuario' });
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
