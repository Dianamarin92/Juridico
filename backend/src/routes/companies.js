const express = require('express');
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
  const { name, nit, contact_name, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  try {
    const [result] = await db.query(
      'INSERT INTO companies (name, nit, contact_name, phone, email) VALUES (?, ?, ?, ?, ?)',
      [name, nit || null, contact_name || null, phone || null, email || null]
    );
    res.status(201).json({ id: result.insertId, name, nit, contact_name, phone, email });
  } catch {
    res.status(500).json({ error: 'Error al crear empresa' });
  }
});

module.exports = router;
