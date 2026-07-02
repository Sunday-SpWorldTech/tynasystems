let transporterCache = null;

function emailEnabled() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function getTransporter() {
  if (!emailEnabled()) return null;
  if (transporterCache) return transporterCache;
  const nodemailer = await import('nodemailer');
  transporterCache = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporterCache;
}

export async function sendUserAccessAlert(user, action = 'login') {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log(`[email disabled] ${action} alert for ${user.email}. Configure SMTP_HOST, SMTP_USER and SMTP_PASS to send real emails.`);
      return { skipped: true };
    }
    const brand = process.env.EMAIL_FROM_NAME || 'Tyna Systems';
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const actionText = action === 'join-free' ? 'joined Tyna Systems for free' : 'logged in to Tyna Systems';
    await transporter.sendMail({
      from: `"${brand}" <${fromAddress}>`,
      to: user.email,
      subject: action === 'join-free' ? 'Welcome to Tyna Systems' : 'Tyna Systems login alert',
      text: `Hello ${user.name || 'there'},\n\nYou successfully ${actionText}.\n\nIf this was you, no action is needed. If you did not request this, please contact Tyna Systems support immediately.\n\nTyna Systems`,
      html: `<p>Hello ${user.name || 'there'},</p><p>You successfully <strong>${actionText}</strong>.</p><p>If this was you, no action is needed. If you did not request this, please contact Tyna Systems support immediately.</p><p>Tyna Systems</p>`
    });
    return { sent: true };
  } catch (error) {
    console.error('Email alert failed:', error.message);
    return { error: error.message };
  }
}



export async function sendAcademyOtpEmail(to, otpCode, name = 'Student') {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log(`[email disabled] Academy OTP for ${to}. Configure SMTP_HOST, SMTP_USER and SMTP_PASS to send real OTP emails.`);
      return { skipped: true };
    }
    const brand = process.env.EMAIL_FROM_NAME || 'Tyna Systems';
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
    await transporter.sendMail({
      from: `"${brand}" <${fromAddress}>`,
      to,
      subject: 'Tyna Coding Academy school email OTP',
      text: `Hello ${name || 'Student'},

Your Tyna Coding Academy verification code is ${otpCode}. It expires in 10 minutes.

If you did not request this, ignore this email.

Tyna Systems`,
      html: `<p>Hello ${name || 'Student'},</p><p>Your Tyna Coding Academy verification code is <strong>${otpCode}</strong>.</p><p>It expires in 10 minutes.</p><p>If you did not request this, ignore this email.</p><p>Tyna Systems</p>`
    });
    return { sent: true };
  } catch (error) {
    console.error('Academy OTP email failed:', error.message);
    return { error: error.message };
  }
}


export async function sendAuthOtpEmail(to, otpCode, name = 'User') {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log(`[email disabled] Auth OTP for ${to}: ${otpCode}. Configure SMTP_HOST, SMTP_USER and SMTP_PASS to send real OTP emails.`);
      return { skipped: true, code: otpCode };
    }
    const brand = process.env.EMAIL_FROM_NAME || 'Tyna Systems';
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
    await transporter.sendMail({
      from: `"${brand}" <${fromAddress}>`,
      to,
      subject: 'Tyna Systems account verification OTP',
      text: `Hello ${name || 'User'},\n\nYour Tyna Systems verification code is ${otpCode}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.\n\nTyna Systems`,
      html: `<p>Hello ${name || 'User'},</p><p>Your Tyna Systems verification code is <strong>${otpCode}</strong>.</p><p>It expires in 10 minutes.</p><p>If you did not request this, ignore this email.</p><p>Tyna Systems</p>`
    });
    return { sent: true };
  } catch (error) {
    console.error('Auth OTP email failed:', error.message);
    return { error: error.message };
  }
}
