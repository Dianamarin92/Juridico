require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const companiesRoutes = require('./src/routes/companies');
const ticketsRoutes = require('./src/routes/tickets');
const messagesRoutes = require('./src/routes/messages');
const filesRoutes = require('./src/routes/files');
const usersRoutes = require('./src/routes/users');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/companies', companiesRoutes);
app.use('/tickets', ticketsRoutes);
app.use('/messages', messagesRoutes);
app.use('/files', filesRoutes);
app.use('/users', usersRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));

module.exports = app;
