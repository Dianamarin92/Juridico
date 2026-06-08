const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, name, email, role, is_active FROM users WHERE role != 'cliente' ORDER BY role"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.post('/', auth, async (req, res) => {
  const { username, name, email, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  const validRoles = ['abogada_asignada', 'abogada_lider'];
  if (req.user.role === 'steven_marin') validRoles.push('steven_marin');
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Rol no válido' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [username, name || null, email || null, hash, role]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'El usuario ya existe' });
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

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

router.put('/:id', auth, async (req, res) => {
  if (!['steven_marin', 'abogada_lider'].includes(req.user.role)) return res.status(403).json({ error: 'Sin permisos' });
  const { id } = req.params;
  const { name, email, role, password } = req.body;
  try {
    const validRoles = ['abogada_asignada', 'abogada_lider', 'steven_marin'];
    if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Rol no válido' });

    const updates = [];
    const values = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(name || null); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email || null); }
    if (role) { updates.push('role = ?'); values.push(role); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(hash);
    }
    if (updates.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });
    values.push(id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.put('/:id/active', auth, async (req, res) => {
  if (!['steven_marin', 'abogada_lider'].includes(req.user.role)) return res.status(403).json({ error: 'Sin permisos' });
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'steven_marin') return res.status(403).json({ error: 'Sin permisos' });
  const { id } = req.params;
  if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
