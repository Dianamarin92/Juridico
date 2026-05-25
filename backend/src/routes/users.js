const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Lista de abogadas disponibles para asignar tickets
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, email, role FROM users WHERE role != 'cliente' ORDER BY role"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;
