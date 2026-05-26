const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM companies ORDER BY name');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
});

router.post('/', auth, async (req, res) => {
  const { name, nit, contact_name, phone, email, username, password } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  try {
    const [companyResult] = await db.query(
      'INSERT INTO companies (name, nit, contact_name, phone, email) VALUES (?, ?, ?, ?, ?)',
      [name, nit || null, contact_name || null, phone || null, email || null]
    );
    const companyId = companyResult.insertId;
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, email, password_hash, role, company_id) VALUES (?, ?, ?, ?, ?)',
      [username, email || null, hash, 'cliente', companyId]
    );
    res.status(201).json({ id: companyId, name });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'El usuario ya existe' });
    res.status(500).json({ error: 'Error al crear empresa' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, nit, contact_name, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  try {
    await db.query(
      'UPDATE companies SET name=?, nit=?, contact_name=?, phone=?, email=? WHERE id=?',
      [name, nit || null, contact_name || null, phone || null, email || null, req.params.id]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al actualizar empresa' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const ticketIds = (await db.query('SELECT id FROM tickets WHERE company_id = ?', [id]))[0].map(t => t.id);
    if (ticketIds.length > 0) {
      await db.query('DELETE FROM audit_logs WHERE ticket_id IN (?)', [ticketIds]);
      await db.query('DELETE FROM messages WHERE ticket_id IN (?)', [ticketIds]);
      await db.query('DELETE FROM file_uploads WHERE ticket_id IN (?)', [ticketIds]);
      await db.query('DELETE FROM tickets WHERE company_id = ?', [id]);
    }
    await db.query("DELETE FROM users WHERE company_id = ? AND role = 'cliente'", [id]);
    await db.query('DELETE FROM companies WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar empresa' });
  }
});

module.exports = router;
