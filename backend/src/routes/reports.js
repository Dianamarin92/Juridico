const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /reports/tickets?company_id=X&period=day|month|year&value=N
router.get('/tickets', auth, async (req, res) => {
  if (req.user.role !== 'steven_marin') return res.status(403).json({ error: 'Sin permisos' });

  const { company_id, period, value } = req.query;

  let dateFilter = '';
  const params = [];

  if (period && value) {
    const n = parseInt(value);
    if (period === 'day') {
      dateFilter = 'AND t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
    } else if (period === 'month') {
      dateFilter = 'AND t.created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)';
    } else if (period === 'year') {
      dateFilter = 'AND t.created_at >= DATE_SUB(NOW(), INTERVAL ? YEAR)';
    }
    if (dateFilter) params.push(n);
  }

  try {
    let rows;

    if (company_id && company_id !== 'all') {
      // Resumen por estado para una empresa
      const [summary] = await db.query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN t.status = 'in_review' THEN 1 ELSE 0 END) as in_review,
          SUM(CASE WHEN t.status = 'sent' THEN 1 ELSE 0 END) as sent
        FROM tickets t
        WHERE t.company_id = ? ${dateFilter}`,
        [company_id, ...params]
      );

      // Tickets individuales
      const [tickets] = await db.query(
        `SELECT t.id, t.title, t.status, t.created_at, u.name as assigned_name, u.email as assigned_email
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.company_id = ? ${dateFilter}
        ORDER BY t.created_at DESC`,
        [company_id, ...params]
      );

      rows = { summary: summary[0], tickets };
    } else {
      // Resumen por empresa (todas)
      const [byCompany] = await db.query(
        `SELECT
          c.id, c.name as company_name,
          COUNT(t.id) as total,
          SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN t.status = 'in_review' THEN 1 ELSE 0 END) as in_review,
          SUM(CASE WHEN t.status = 'sent' THEN 1 ELSE 0 END) as sent
        FROM companies c
        LEFT JOIN tickets t ON t.company_id = c.id ${dateFilter ? dateFilter.replace('t.created_at', 't.created_at') : ''}
        GROUP BY c.id, c.name
        ORDER BY total DESC`,
        [...params]
      );
      rows = { byCompany };
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar informe' });
  }
});

module.exports = router;
