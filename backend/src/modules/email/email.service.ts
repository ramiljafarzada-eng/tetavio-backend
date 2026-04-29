import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private from = 'noreply@tetavio.com';
  private frontendUrl = 'https://www.tetavio.com';

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const host = this.config.get<string>('EMAIL_HOST');
    const user = this.config.get<string>('EMAIL_USER');
    const pass = this.config.get<string>('EMAIL_PASS');
    const port = Number(this.config.get<string>('EMAIL_PORT', '587')) || 587;

    this.from = this.config.get<string>('EMAIL_FROM', 'noreply@tetavio.com');
    this.frontendUrl = (
      this.config.get<string>('FRONTEND_PRODUCTION_URL', 'https://www.tetavio.com')
    ).replace(/\/$/, '');

    if (!host || !user || !pass) {
      this.logger.warn(
        'Email service disabled: EMAIL_HOST, EMAIL_USER, and EMAIL_PASS must be set. Emails will not be sent.',
      );
      return;
    }

    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    this.logger.log(`Email service ready (${host}:${port})`);
  }

  async sendVerificationEmail(to: string, rawToken: string): Promise<void> {
    const link = `${this.frontendUrl}?verifyToken=${encodeURIComponent(rawToken)}`;
    await this.dispatch(
      to,
      'Verify your Tetavio email address',
      this.renderEmail({
        title: 'Verify your email address',
        preheader: 'Confirm your Tetavio account',
        body: 'Thank you for signing up for Tetavio. Please verify your email address by clicking the button below. This link expires in 24 hours.',
        buttonText: 'Verify Email',
        buttonHref: link,
      }),
    );
  }

  async sendInvoiceEmail(
    to: string,
    invoiceData: { invoiceNumber: string; totalMinor: number; currency: string; notes?: string | null },
    pdfBuffer: Buffer,
  ): Promise<void> {
    const total = `${(invoiceData.totalMinor / 100).toFixed(2)} ${invoiceData.currency}`;
    const subject = `Invoice ${invoiceData.invoiceNumber} from Tetavio`;
    const notesHtml = invoiceData.notes
      ? `<p style="margin:12px 0 0;font-size:14px;color:#374151;"><strong>Notes:</strong> ${invoiceData.notes}</p>`
      : '';
    const html = this.renderEmail({
      title: `Invoice ${invoiceData.invoiceNumber}`,
      preheader: `Invoice ${invoiceData.invoiceNumber} — ${total}`,
      body: `Please find attached invoice <strong>${invoiceData.invoiceNumber}</strong> for a total of <strong>${total}</strong>.${notesHtml ? ' See notes below.' : ''} If you have any questions, please contact us.${notesHtml}`,
      buttonText: 'View Invoice',
      buttonHref: this.frontendUrl,
    });

    await this.dispatchWithAttachment(to, subject, html, pdfBuffer, `invoice-${invoiceData.invoiceNumber}.pdf`);
  }

  async sendPasswordResetEmail(to: string, rawToken: string): Promise<void> {
    const link = `${this.frontendUrl}?resetToken=${encodeURIComponent(rawToken)}`;
    await this.dispatch(
      to,
      'Reset your Tetavio password',
      this.renderEmail({
        title: 'Reset your password',
        preheader: 'Password reset request for your Tetavio account',
        body: 'You requested a password reset for your Tetavio account. Click the button below to set a new password. This link expires in 1 hour. If you did not make this request, you can safely ignore this email.',
        buttonText: 'Reset Password',
        buttonHref: link,
      }),
    );
  }

  private async dispatchWithAttachment(
    to: string,
    subject: string,
    html: string,
    attachmentBuffer: Buffer,
    attachmentFilename: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email skipped (${this.maskEmail(to)}): service not configured`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        attachments: [{ filename: attachmentFilename, content: attachmentBuffer, contentType: 'application/pdf' }],
      });
      this.logger.log(`Email sent → ${this.maskEmail(to)} | "${subject}"`);
    } catch (err) {
      this.logger.error(
        `Email failed → ${this.maskEmail(to)} | "${subject}" | ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      // Do not rethrow — email failure must not break the caller flow
    }
  }

  private async dispatch(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email skipped (${this.maskEmail(to)}): service not configured`);
      return;
    }

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email sent → ${this.maskEmail(to)} | "${subject}"`);
    } catch (err) {
      // Log safely — never expose tokens or credentials in error output
      this.logger.error(
        `Email failed → ${this.maskEmail(to)} | "${subject}" | ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      // Do not rethrow — email failure must not break the auth flow
    }
  }

  private maskEmail(email: string): string {
    const atIndex = email.indexOf('@');
    if (atIndex <= 0) return '***';
    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex);
    const masked =
      local.length > 2
        ? `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}`
        : '***';
    return `${masked}${domain}`;
  }

  private renderEmail(opts: {
    title: string;
    preheader: string;
    body: string;
    buttonText: string;
    buttonHref: string;
  }): string {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;font-size:1px;max-height:0;overflow:hidden;">${opts.preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#1a56db;padding:20px 36px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Tetavio</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 36px 28px;">
            <h2 style="margin:0 0 14px;font-size:20px;color:#111827;">${opts.title}</h2>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#374151;">${opts.body}</p>
            <a href="${opts.buttonHref}"
               style="display:inline-block;background:#1a56db;color:#ffffff;font-size:15px;font-weight:600;
                      text-decoration:none;padding:12px 28px;border-radius:6px;">
              ${opts.buttonText}
            </a>
            <p style="margin:28px 0 0;font-size:12px;color:#6b7280;line-height:1.6;">
              If the button above does not work, copy and paste this link into your browser:<br>
              <a href="${opts.buttonHref}" style="color:#1a56db;word-break:break-all;">${opts.buttonHref}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px;border-top:1px solid #e5e7eb;background:#f9fafb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              &copy; ${year} Tetavio &middot; Automated email &mdash; please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
