const nodemailer = require('nodemailer');

function str(v) {
  return (v === undefined || v === null) ? '' : String(v);
}

function bool(v, defaultValue = false) {
  const s = str(v).trim().toLowerCase();
  if (!s) return defaultValue;
  return s === 'true' || s === '1' || s === 'yes';
}

function createTransporter() {
  const user = str(process.env.EMAIL_USER).trim();
  const pass = str(process.env.EMAIL_PASS).trim();
  if (!user || !pass) return null;

  const service = str(process.env.EMAIL_SERVICE).trim().toLowerCase();
  if (service === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  const host = str(process.env.EMAIL_HOST).trim();
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = bool(process.env.EMAIL_SECURE, port === 465);
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

const transporter = createTransporter();

function canSendEmail() {
  return !!transporter;
}

function fromAddress() {
  return str(process.env.EMAIL_FROM).trim() || str(process.env.EMAIL_USER).trim();
}

async function sendMailSafe(options) {
  if (!canSendEmail()) return;
  try {
    await transporter.sendMail({
      from: fromAddress(),
      ...options
    });
  } catch (e) {
    // best-effort: do not crash requests when email fails
  }
}

module.exports = {
  transporter,
  canSendEmail,
  fromAddress,
  sendMailSafe,
};

