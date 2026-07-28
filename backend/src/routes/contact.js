const express = require('express');
const router = express.Router();

const DEST_EMAIL = 'abogadoemh@hotmail.com';

router.post('/', async (req, res) => {
  const { nombre, correo, empresa, servicio, mensaje } = req.body;
  if (!nombre || !correo) return res.status(400).json({ error: 'Nombre y correo son requeridos' });

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { ciphers: 'SSLv3' },
    });

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a1a1a;padding:20px 32px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:1.1rem;">Marín &amp; Abogados</h1>
          <p style="color:#c0392b;margin:4px 0 0;font-size:0.85rem;">Nueva solicitud de información desde la web</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;">
          <table style="width:100%;border-collapse:collapse;font-size:0.95rem;">
            <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Nombre</td><td style="padding:8px 0;font-weight:600;color:#111;">${nombre}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Correo</td><td style="padding:8px 0;color:#111;"><a href="mailto:${correo}" style="color:#c0392b;">${correo}</a></td></tr>
            ${empresa ? `<tr><td style="padding:8px 0;color:#6b7280;">Empresa</td><td style="padding:8px 0;color:#111;">${empresa}</td></tr>` : ''}
            ${servicio ? `<tr><td style="padding:8px 0;color:#6b7280;">Servicio</td><td style="padding:8px 0;color:#111;">${servicio}</td></tr>` : ''}
          </table>
          ${mensaje ? `
          <div style="margin-top:20px;padding:16px;background:#f9fafb;border-radius:6px;border-left:3px solid #c0392b;">
            <p style="margin:0;color:#374151;font-size:0.9rem;line-height:1.7;">${mensaje.replace(/\n/g, '<br>')}</p>
          </div>` : ''}
          <p style="margin-top:24px;color:#9ca3af;font-size:0.8rem;">Este mensaje fue enviado desde el formulario de contacto de marinyabogados.com.co</p>
        </div>
      </div>`;

    await transporter.sendMail({
      from: `"Marín & Abogados Web" <${process.env.EMAIL_USER}>`,
      to: DEST_EMAIL,
      replyTo: correo,
      subject: `Nueva solicitud de información — ${nombre}`,
      html,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err.message);
    res.status(500).json({ error: 'No se pudo enviar el mensaje' });
  }
});

module.exports = router;
