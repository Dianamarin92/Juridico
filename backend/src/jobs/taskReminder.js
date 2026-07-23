const cron = require('node-cron');
const nodemailer = require('nodemailer');
const db = require('../config/db');

const DEST_EMAIL = 'abogadoemh@hotmail.com';

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { ciphers: 'SSLv3' },
  });
}

async function checkExpiringTasks() {
  try {
    const [tasks] = await db.query(
      `SELECT * FROM tasks
       WHERE fecha_fin = DATE_ADD(CURDATE(), INTERVAL 2 DAY)
         AND estado != 'terminada'
       ORDER BY fecha_fin ASC`
    );

    if (tasks.length === 0) return;

    const transporter = createTransporter();

    const rows = tasks.map(t => {
      const fechaFin = new Date(String(t.fecha_fin).slice(0, 10) + 'T12:00:00')
        .toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
      return `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 12px;font-weight:600;color:#111;">${t.tarea}</td>
          <td style="padding:10px 12px;color:#555;">${t.cliente_proceso || '—'}</td>
          <td style="padding:10px 12px;color:#555;">${t.responsable || '—'}</td>
          <td style="padding:10px 12px;color:#b91c1c;font-weight:600;">${fechaFin}</td>
        </tr>`;
    }).join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <div style="background:#1a1a1a;padding:20px 32px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:1.2rem;">Marín & Abogados</h1>
          <p style="color:#c0392b;margin:4px 0 0;font-size:0.9rem;">Sistema de Gestión Jurídica</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;">
          <h2 style="margin-top:0;color:#b91c1c;font-size:1.1rem;">⚠️ Tareas por vencer en 2 días</h2>
          <p style="color:#555;margin-bottom:20px;">Las siguientes tareas vencen el <strong>${new Date(new Date().setDate(new Date().getDate()+2)).toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'})}</strong>:</p>
          <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:10px 12px;text-align:left;color:#374151;">Tarea</th>
                <th style="padding:10px 12px;text-align:left;color:#374151;">Cliente / Proceso</th>
                <th style="padding:10px 12px;text-align:left;color:#374151;">Responsable</th>
                <th style="padding:10px 12px;text-align:left;color:#374151;">Fecha Final</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top:24px;color:#9ca3af;font-size:0.8rem;">Este correo fue generado automáticamente por el sistema de gestión de Marín & Abogados.</p>
        </div>
      </div>`;

    await transporter.sendMail({
      from: `"Marín & Abogados" <${process.env.EMAIL_USER}>`,
      to: DEST_EMAIL,
      subject: `⚠️ ${tasks.length} tarea${tasks.length > 1 ? 's' : ''} por vencer en 2 días — Marín & Abogados`,
      html,
    });

    console.log(`[taskReminder] Correo enviado: ${tasks.length} tarea(s) por vencer`);
  } catch (err) {
    console.error('[taskReminder] Error:', err.message);
  }
}

// Corre todos los días a las 8:00 AM hora Colombia (UTC-5 = 13:00 UTC)
function startTaskReminderJob() {
  cron.schedule('0 13 * * *', checkExpiringTasks, { timezone: 'America/Bogota' });
  console.log('[taskReminder] Job programado: revisión diaria a las 8:00 AM');
}

module.exports = { startTaskReminderJob };
