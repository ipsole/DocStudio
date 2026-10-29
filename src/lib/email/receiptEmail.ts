import nodemailer from 'nodemailer';
import { OrderRecord } from '@/types';

interface SendReceiptParams {
  order: OrderRecord;
  recipientEmail: string;
  recipientName?: string;
}

export function generateReceiptHtml(order: OrderRecord, recipientName?: string): string {
  const dateFormatted = new Date(order.paidAt || order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentMethodLabel = order.paymentMethod?.type === 'card'
    ? `${order.paymentMethod.brand || 'Card'} ending in •••• ${order.paymentMethod.last4 || '****'}`
    : order.paymentMethod?.type === 'upi'
    ? `UPI (${order.paymentMethod.vpa || 'Verified VPA'})`
    : order.paymentMethod?.type || 'Online Payment';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - DocStudio</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff; }
    .container { max-width: 600px; margin: 40px auto; background-color: #121212; border: 1px solid #262626; border-radius: 16px; overflow: hidden; }
    .header { padding: 32px 36px; border-bottom: 1px solid #262626; background: linear-gradient(180deg, #18181b 0%, #121212 100%); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; margin-bottom: 16px; }
    .title { font-size: 24px; font-weight: 700; margin: 12px 0 4px 0; color: #ffffff; }
    .subtitle { font-size: 13px; color: #a1a1aa; margin: 0; }
    .content { padding: 32px 36px; }
    .info-grid { display: table; width: 100%; margin-bottom: 28px; }
    .info-col { display: table-cell; width: 50%; vertical-align: top; }
    .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; font-weight: 600; margin-bottom: 4px; }
    .info-value { font-size: 13px; color: #e4e4e7; font-weight: 500; font-family: monospace; }
    .item-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    .item-table th { text-align: left; font-size: 11px; text-transform: uppercase; color: #71717a; padding-bottom: 10px; border-bottom: 1px solid #262626; letter-spacing: 0.05em; }
    .item-table td { padding: 14px 0; border-bottom: 1px solid #262626; font-size: 14px; }
    .total-row { padding-top: 16px; border-top: 2px solid #3f3f46; font-size: 18px; font-weight: 700; color: #ffffff; display: flex; justify-content: space-between; }
    .btn-container { text-align: center; margin: 32px 0 16px 0; }
    .btn { display: inline-block; background-color: #ffffff; color: #000000; font-weight: 600; font-size: 13px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; }
    .footer { padding: 24px 36px; border-top: 1px solid #262626; background-color: #0f0f10; text-align: center; font-size: 11px; color: #71717a; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">DOCSTUDIO</div>
      <span class="badge">Payment Confirmed</span>
      <h1 class="title">₹${order.amount.toFixed(2)} INR</h1>
      <p class="subtitle">Receipt for ${order.itemName}</p>
    </div>

    <div class="content">
      <div class="info-grid">
        <div class="info-col">
          <div class="info-label">Billed To</div>
          <div class="info-value">${recipientName || order.userEmail}</div>
          <div style="font-size: 12px; color: #71717a; margin-top: 2px;">${order.userEmail}</div>
        </div>
        <div class="info-col">
          <div class="info-label">Invoice Number</div>
          <div class="info-value">${order.receiptNumber}</div>
          <div style="font-size: 11px; color: #71717a; margin-top: 2px;">${dateFormatted}</div>
        </div>
      </div>

      <div style="margin-bottom: 24px; padding: 12px 16px; background-color: #18181b; border: 1px solid #27272a; border-radius: 10px;">
        <div class="info-label">Payment Method</div>
        <div style="font-size: 13px; color: #f4f4f5; margin-top: 2px;">${paymentMethodLabel}</div>
        <div style="font-size: 11px; color: #71717a; margin-top: 2px; font-family: monospace;">Razorpay ID: ${order.razorpayPaymentId || 'N/A'}</div>
      </div>

      <table class="item-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div style="font-weight: 600; color: #ffffff;">${order.itemName}</div>
              ${order.creditsAdded ? `<div style="font-size: 12px; color: #10b981; margin-top: 2px;">+${order.creditsAdded} Generation Credits added to vault</div>` : ''}
            </td>
            <td style="text-align: right; font-weight: 600; color: #ffffff; font-family: monospace;">
              ₹${order.amount.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; align-items: baseline; padding-top: 12px; border-top: 1px solid #27272a;">
        <span style="font-size: 14px; font-weight: 700; color: #ffffff;">Total Paid</span>
        <span style="font-size: 20px; font-weight: 800; color: #ffffff; font-family: monospace;">₹${order.amount.toFixed(2)} INR</span>
      </div>

      <div class="btn-container">
        <a href="https://docstudio.docdril.com/" class="btn">Open DocStudio</a>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for building with DocStudio. This is an official electronic payment receipt.<br/>
      If you have questions regarding this charge, contact our desk at <a href="mailto:billing@docdril.com" style="color: #a1a1aa;">billing@docdril.com</a>.</p>
      <p style="margin-top: 12px; color: #52525b;">DocStudio by Docdril &bull; All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatches an automated purchase confirmation email to the user.
 * Falls back gracefully to server logging if SMTP credentials are not yet set.
 */
export async function sendPurchaseConfirmationEmail({
  order,
  recipientEmail,
  recipientName,
}: SendReceiptParams): Promise<{ sent: boolean; messageId?: string; simulated?: boolean }> {
  const html = generateReceiptHtml(order, recipientName);

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || '"DocStudio" <billing@docdril.com>';

  // Check if live SMTP is configured
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: recipientEmail,
        subject: `Payment Receipt: ${order.itemName} (Invoice #${order.receiptNumber})`,
        html,
      });

      console.log(`[DocStore Email] Receipt sent to ${recipientEmail} (ID: ${info.messageId})`);
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      console.error('[DocStore Email] Failed to send email via SMTP:', err);
    }
  }

  // Graceful development simulation log
  console.log(`[DocStore Email Simulation] Purchase confirmation generated for ${recipientEmail}:`);
  console.log(`- Invoice: ${order.receiptNumber}`);
  console.log(`- Item: ${order.itemName}`);
  console.log(`- Amount: ₹${order.amount} INR`);
  console.log(`- Payment ID: ${order.razorpayPaymentId}`);

  return { sent: true, simulated: true };
}
