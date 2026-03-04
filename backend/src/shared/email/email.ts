import nodemailer, { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  bcc?: string[];
  subject: string;
  text: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true', // true for port 465 / TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (process.env.ENABLE_SMTP_EMAILS !== 'true') {
    console.log('[email] SMTP disabled (ENABLE_SMTP_EMAILS != true) — skipping send.');
    return;
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to: opts.to,
    bcc: opts.bcc,
    subject: opts.subject,
    text: opts.text,
  });
}
