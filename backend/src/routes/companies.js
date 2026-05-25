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
  const { name } = req.body;
  try {
    const [result] = await db.query('INSERT INTO companies (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch {
    res.status(500).json({ error: 'Error al crear empresa' });
  }
});

module.exports = router;
