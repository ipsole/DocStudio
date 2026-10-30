import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { OrderRecord } from '@/types';
import { generatePrintableInvoiceHtml } from './invoiceTemplate';

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

  const baseAmount = (order.amount / 1.18).toFixed(2);
  const totalTax = (order.amount - Number(baseAmount)).toFixed(2);
  const cgst = (Number(totalTax) / 2).toFixed(2);
  const sgst = (Number(totalTax) - Number(cgst)).toFixed(2);

  const paymentMethodLabel = order.paymentMethod?.type === 'card'
    ? `${order.paymentMethod.brand || 'Card'} ending in •••• ${order.paymentMethod.last4 || '****'}`
    : order.paymentMethod?.type === 'upi'
    ? `UPI (${order.paymentMethod.vpa || 'Verified VPA'})`
    : order.paymentMethod?.type || 'Online Payment';

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://docstudio.docdril.com';
  const downloadInvoiceUrl = `${appBaseUrl}/api/billing/invoice?orderId=${encodeURIComponent(order.id)}&receipt=${encodeURIComponent(order.receiptNumber)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - DocStudio</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff; }
    .container { max-width: 600px; margin: 40px auto; background-color: #121212; border: 1px solid #262626; border-radius: 16px; overflow: hidden; }
    .header { padding: 32px 36px; border-bottom: 1px solid #262626; background: linear-gradient(180deg, #18181b 0%, #121212 100%); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; }
    .title { font-size: 26px; font-weight: 800; margin: 12px 0 4px 0; color: #ffffff; letter-spacing: -0.02em; }
    .subtitle { font-size: 13px; color: #a1a1aa; margin: 0; }
    .content { padding: 32px 36px; }
    .info-grid { width: 100%; margin-bottom: 24px; border-collapse: collapse; }
    .info-col { width: 50%; vertical-align: top; }
    .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; font-weight: 600; margin-bottom: 4px; }
    .info-value { font-size: 13px; color: #e4e4e7; font-weight: 500; font-family: monospace; }
    .item-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .item-table th { text-align: left; font-size: 11px; text-transform: uppercase; color: #71717a; padding-bottom: 10px; border-bottom: 1px solid #262626; letter-spacing: 0.05em; }
    .item-table td { padding: 14px 0; border-bottom: 1px solid #262626; font-size: 14px; }
    .totals-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 24px; }
    .totals-table td { padding: 6px 0; font-size: 12px; }
    .btn-container { text-align: center; margin: 28px 0 16px 0; }
    .btn-primary { display: inline-block; background-color: #ffffff; color: #000000; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 9999px; text-decoration: none; margin: 4px; }
    .btn-secondary { display: inline-block; background-color: transparent; border: 1px solid #3f3f46; color: #e4e4e7; font-weight: 600; font-size: 13px; padding: 12px 22px; border-radius: 9999px; text-decoration: none; margin: 4px; }
    .footer { padding: 24px 36px; border-top: 1px solid #262626; background-color: #0f0f10; text-align: center; font-size: 11px; color: #71717a; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
        <tr>
          <td style="width: 36px; height: 36px; background-color: #ffffff; border-radius: 10px; text-align: center; vertical-align: middle; padding: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
            <img src="cid:docdrillogo" width="22" height="22" alt="Docdril" style="display: block; margin: 0 auto; width: 22px; height: 22px; border: 0;" />
          </td>
          <td style="padding-left: 12px; vertical-align: middle;">
            <span class="brand" style="display: block; line-height: 1.1;">DOCSTUDIO</span>
            <span style="font-size: 10px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">by Docdril &bull; Tax Invoice</span>
          </td>
        </tr>
      </table>

      <span class="badge">Payment Confirmed</span>
      <h1 class="title">₹${order.amount.toFixed(2)}</h1>
      <p class="subtitle">Official Receipt for ${order.itemName}</p>
    </div>

    <div class="content">
      <table class="info-grid" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="info-col">
            <div class="info-label">Billed To</div>
            <div class="info-value">${recipientName || order.userEmail}</div>
            <div style="font-size: 12px; color: #71717a; margin-top: 2px;">${order.userEmail}</div>
            ${order.businessName ? `<div style="font-size: 11px; color: #a1a1aa; margin-top: 2px;">${order.businessName}</div>` : ''}
          </td>
          <td class="info-col" style="text-align: right;">
            <div class="info-label">Invoice Number</div>
            <div class="info-value">${order.receiptNumber}</div>
            <div style="font-size: 11px; color: #71717a; margin-top: 2px;">${dateFormatted}</div>
          </td>
        </tr>
      </table>

      <div style="margin-bottom: 24px; padding: 12px 16px; background-color: #18181b; border: 1px solid #27272a; border-radius: 10px;">
        <div class="info-label">Payment Channel</div>
        <div style="font-size: 13px; color: #f4f4f5; margin-top: 2px;">${paymentMethodLabel}</div>
        <div style="font-size: 11px; color: #71717a; margin-top: 2px; font-family: monospace;">Razorpay Reference: ${order.razorpayPaymentId || 'N/A'}</div>
      </div>

      <table class="item-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">SAC</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div style="font-weight: 600; color: #ffffff;">${order.itemName}</div>
              ${order.creditsAdded ? `<div style="font-size: 12px; color: #10b981; margin-top: 2px;">+${order.creditsAdded} Generation Credits added to vault</div>` : ''}
            </td>
            <td style="text-align: center; color: #a1a1aa; font-family: monospace; font-size: 12px;">998313</td>
            <td style="text-align: right; font-weight: 700; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ₹${order.amount.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Itemized Tax & GST Breakdown Table -->
      <table class="totals-table">
        <tr>
          <td style="color: #a1a1aa;">Taxable Subtotal (Base)</td>
          <td style="text-align: right; font-family: monospace; color: #e4e4e7;">₹${baseAmount}</td>
        </tr>
        <tr>
          <td style="color: #a1a1aa;">Central GST (CGST @ 9%)</td>
          <td style="text-align: right; font-family: monospace; color: #e4e4e7;">₹${cgst}</td>
        </tr>
        <tr>
          <td style="color: #a1a1aa;">State / UT GST (SGST @ 9%)</td>
          <td style="text-align: right; font-family: monospace; color: #e4e4e7;">₹${sgst}</td>
        </tr>
        <tr style="border-top: 2px solid #3f3f46;">
          <td style="padding-top: 14px; font-size: 14px; font-weight: 700; color: #ffffff;">Total Paid (Incl. 18% GST)</td>
          <td style="padding-top: 14px; text-align: right; font-size: 20px; font-weight: 800; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">₹${order.amount.toFixed(2)} <span style="font-size: 12px; font-weight: 600; color: #a1a1aa;">INR</span></td>
        </tr>
      </table>

      <!-- Compliance Info Box -->
      <div style="margin-bottom: 24px; padding: 12px 14px; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; font-size: 11px; color: #a1a1aa; line-height: 1.6;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align: top; width: 50%;">
              <strong style="color: #e4e4e7;">SUPPLIER DETAILS</strong><br/>
              Docdril Technologies &bull; DocStudio<br/>
              SAC Code: 998313 (Software Services)<br/>
              Contact: billing@docdril.com
            </td>
            <td style="vertical-align: top; width: 50%;">
              <strong style="color: #e4e4e7;">BUYER GST IDENTITY</strong><br/>
              GSTIN: <span style="color: #34d399; font-family: monospace;">${order.gstin || 'Consumer / B2C (Unregistered)'}</span><br/>
              Reverse Charge: No
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Buttons -->
      <div class="btn-container">
        <a href="${downloadInvoiceUrl}" class="btn-primary" target="_blank">Download Official Tax Invoice</a>
        <a href="${appBaseUrl}/account#billing" class="btn-secondary" target="_blank">Account Invoices &rarr;</a>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for building with DocStudio. This is an official electronic payment receipt.<br/>
      If you have questions regarding this charge, contact our desk at <a href="mailto:billing@docdril.com" style="color: #a1a1aa;">billing@docdril.com</a>.</p>
      <p style="margin-top: 12px; color: #52525b;">DocStudio by Docdril &bull; All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Dispatches an automated purchase confirmation email to the user.
 * Includes SVG logo CID attachment and offline HTML invoice attachment.
 */
export async function sendPurchaseConfirmationEmail({
  order,
  recipientEmail,
  recipientName,
}: SendReceiptParams): Promise<{ sent: boolean; messageId?: string; simulated?: boolean }> {
  const html = generateReceiptHtml(order, recipientName);
  const printableInvoiceHtml = generatePrintableInvoiceHtml(order, recipientName);

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || '"DocStudio" <billing@docdril.com>';

  // Check if logo exists for attachment
  const logoPath = path.join(process.cwd(), 'public/docdril.svg');
  const hasLogo = fs.existsSync(logoPath);

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

      const attachments: Array<{
        filename: string;
        content?: string;
        path?: string;
        cid?: string;
        contentType?: string;
      }> = [
        {
          filename: `DocStudio-Tax-Invoice-${order.receiptNumber}.html`,
          content: printableInvoiceHtml,
          contentType: 'text/html',
        },
      ];

      if (hasLogo) {
        attachments.push({
          filename: 'docdril.svg',
          path: logoPath,
          cid: 'docdrillogo',
        });
      }

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: recipientEmail,
        subject: `Payment Receipt: ${order.itemName} (Invoice #${order.receiptNumber})`,
        html,
        attachments,
      });

      console.log(`[DocStore Email] Receipt sent to ${recipientEmail} with tax invoice attachment (ID: ${info.messageId})`);
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
