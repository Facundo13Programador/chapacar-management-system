// utils/mail.js
import 'dotenv/config';
import nodemailer from 'nodemailer';

const {
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env;

console.log('[MAIL] SMTP_USER:', SMTP_USER);
console.log('[MAIL] MAIL_FROM:', MAIL_FROM);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendMail({ to, subject, html, attachments }) {
  console.log('[MAIL] Enviando email a:', to);
  await transporter.sendMail({
    from: MAIL_FROM || `"Chapacar" <${SMTP_USER}>`,
    to,
    subject,
    html,
    attachments, 
  });
}
