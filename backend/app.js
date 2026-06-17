require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const companiesRoutes = require('./src/routes/companies');
const ticketsRoutes = require('./src/routes/tickets');
const messagesRoutes = require('./src/routes/messages');
const filesRoutes = require('./src/routes/files');
const usersRoutes = require('./src/routes/users');
const reportsRoutes = require('./src/routes/reports');
const tasksRoutes   = require('./src/routes/tasks');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Disposition', 'inline');
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/auth', authRoutes);
app.use('/companies', companiesRoutes);
app.use('/tickets', ticketsRoutes);
app.use('/messages', messagesRoutes);
app.use('/files', filesRoutes);
app.use('/users', usersRoutes);
app.use('/reports', reportsRoutes);
app.use('/tasks', tasksRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));

module.exports = app;
