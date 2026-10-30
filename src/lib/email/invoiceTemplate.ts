import { OrderRecord } from '@/types';

export function generatePrintableInvoiceHtml(order: OrderRecord, recipientName?: string): string {
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${order.receiptNumber} - DocStudio</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      color: #09090b;
      margin: 0;
      padding: 32px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .invoice-wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      padding: 48px;
      border: 1px solid #e4e4e7;
    }
    .print-actions {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      background: #09090b;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .print-btn:hover { background: #27272a; }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #09090b;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.03em;
      margin: 0 0 4px 0;
    }
    .brand-sub {
      font-size: 12px;
      color: #71717a;
      margin: 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background-color: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      margin-bottom: 8px;
    }
    .tax-title {
      font-size: 28px;
      font-weight: 800;
      margin: 0;
      text-align: right;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 36px;
    }
    .info-box h4 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #71717a;
      margin: 0 0 8px 0;
    }
    .info-box p {
      margin: 3px 0;
      font-size: 13px;
      color: #27272a;
    }
    .info-box strong {
      color: #09090b;
    }
    .table-container {
      margin-bottom: 32px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #71717a;
      padding: 12px 0;
      border-bottom: 2px solid #e4e4e7;
    }
    td {
      padding: 16px 0;
      border-bottom: 1px solid #f4f4f5;
      font-size: 13px;
    }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 36px;
    }
    .totals-table {
      width: 320px;
    }
    .totals-table td {
      padding: 8px 0;
      border: none;
    }
    .grand-total {
      border-top: 2px solid #09090b !important;
      padding-top: 14px !important;
      font-size: 18px !important;
      font-weight: 800 !important;
    }
    .footer-note {
      border-top: 1px solid #e4e4e7;
      padding-top: 24px;
      font-size: 11px;
      color: #71717a;
      line-height: 1.6;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .print-actions { display: none !important; }
      .invoice-wrapper { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <a href="https://docstudio.docdril.com/" style="text-decoration: none; color: #71717a; font-size: 13px; font-weight: 500;">&larr; Back to DocStudio</a>
    <button class="print-btn" onclick="window.print()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg>
      Print or Save as PDF
    </button>
  </div>

  <div class="invoice-wrapper">
    <div class="header-row">
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="36" height="36" style="width: 36px; height: 36px; display: block; flex-shrink: 0;">
            <path fill="#000000" d="M693.93,490.77c-23.88-32.18-92.66-32.6-118.3-2.73-16.1,18.76-20.57,43-20.59,68.52l-.31,318.63-288.37-.27c-45.83-.04-80.84-37.91-80.93-83.27l.1-524.97c0-47.07,38.02-82.29,84.28-82.28l524.93.21c47.06.02,81.52,38.77,81.51,84.28l-.1,290.62-164.54-.35c-.21-27-3.67-48.71-17.66-68.39ZM710.52,322.32c44.91,10.64,84.33,33.21,113.39,68.86,18.85,23.13,29.29,49.32,39.77,76.86l.2-199.19c.21-42.3-31.95-72.18-73.59-72.16l-522.53.2c-40.46.02-70,32.45-69.99,72.01l.05,522.64c-.08,40.77,31.57,71.42,71.75,71.36l122.54-.19.06-310.61c0-37.14,5.58-71.14,18.79-105.35,47.54-123.13,182.7-149.91,299.57-124.42Z"></path>
            <path fill="#000000" d="M779.82,611.35c51.45-3.53,92.64,35.28,96.08,83.63,3.53,49.62-34.02,92.27-82.71,96.14-49.46,3.94-92.41-32.74-97-81.03-4.75-49.96,31.47-95.16,83.63-98.74Z"></path>
          </svg>
          <h1 class="brand-title">DOCSTUDIO</h1>
        </div>
        <p class="brand-sub">Cloud Document Pipelines & Creative Engines</p>
        <p class="brand-sub">by Docdril &bull; docstudio.docdril.com</p>
      </div>

      <div style="text-align: right;">
        <span class="badge">Paid &bull; Electronic Receipt</span>
        <h2 class="tax-title">TAX INVOICE</h2>
        <p style="font-size: 12px; color: #71717a; margin: 4px 0 0 0;">Original for Recipient</p>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h4>Supplier Details (Service Provider)</h4>
        <p><strong>Docdril Technologies (DocStudio)</strong></p>
        <p>Information Technology & Software Services</p>
        <p>SAC Code: <strong>998313</strong></p>
        <p>Email: <a href="mailto:billing@docdril.com" style="color: inherit;">billing@docdril.com</a></p>
        <p>Website: docstudio.docdril.com</p>
      </div>

      <div class="info-box">
        <h4>Invoice & Payment Metadata</h4>
        <p>Invoice Number: <strong>${order.receiptNumber}</strong></p>
        <p>Date of Issue: <strong>${dateFormatted}</strong></p>
        <p>Payment Method: <strong>${paymentMethodLabel}</strong></p>
        <p>Razorpay Transaction ID: <span style="font-family: monospace; font-size: 11px;">${order.razorpayPaymentId || 'N/A'}</span></p>
        <p>Place of Supply: <strong>India</strong></p>
      </div>
    </div>

    <div class="info-grid" style="margin-bottom: 24px; padding: 16px; background-color: #fbfbfe; border-radius: 12px; border: 1px solid #eef0f4;">
      <div class="info-box" style="margin: 0;">
        <h4>Billed To (Customer)</h4>
        <p><strong>${recipientName || order.userEmail}</strong></p>
        <p>Email: ${order.userEmail}</p>
        ${order.businessName ? `<p>Organization: <strong>${order.businessName}</strong></p>` : ''}
      </div>

      <div class="info-box" style="margin: 0;">
        <h4>Tax Registration</h4>
        <p>Buyer GSTIN: <strong>${order.gstin || 'Consumer / B2C (Unregistered)'}</strong></p>
        <p>Reverse Charge: <strong>No</strong></p>
        <p>Supply Type: <strong>B2B / B2C Cloud SaaS Subscription</strong></p>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Item & Service Description</th>
            <th style="text-align: center;">SAC</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Taxable Amount</th>
            <th style="text-align: right;">Total (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div style="font-weight: 700; color: #09090b;">${order.itemName}</div>
              ${order.creditsAdded ? `<div style="font-size: 11px; color: #059669; margin-top: 2px;">+${order.creditsAdded} Unified Generation Credits</div>` : ''}
              <div style="font-size: 11px; color: #71717a; margin-top: 2px;">Subscription & compute quota across Docdril creative engines</div>
            </td>
            <td style="text-align: center; font-family: monospace; font-size: 12px;">998313</td>
            <td style="text-align: center; font-weight: 600;">${order.quantity || 1}</td>
            <td style="text-align: right; font-family: monospace;">₹${baseAmount}</td>
            <td style="text-align: right; font-weight: 700;">₹${order.amount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="totals-area">
      <table class="totals-table">
        <tr>
          <td style="color: #71717a;">Taxable Subtotal</td>
          <td style="text-align: right; font-family: monospace; font-weight: 600;">₹${baseAmount}</td>
        </tr>
        <tr>
          <td style="color: #71717a;">Central GST (CGST @ 9%)</td>
          <td style="text-align: right; font-family: monospace;">₹${cgst}</td>
        </tr>
        <tr>
          <td style="color: #71717a;">State / UT GST (SGST @ 9%)</td>
          <td style="text-align: right; font-family: monospace;">₹${sgst}</td>
        </tr>
        <tr class="grand-total">
          <td>Grand Total</td>
          <td style="text-align: right; color: #09090b;">₹${order.amount.toFixed(2)} INR</td>
        </tr>
      </table>
    </div>

    <div class="footer-note">
      <div>
        <p style="margin: 0; font-weight: 600; color: #09090b;">Thank you for building with DocStudio.</p>
        <p style="margin: 2px 0 0 0;">This is a system generated, digitally verified computer tax invoice. No signature required.</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-weight: 600; color: #09090b;">Docdril Technologies</p>
        <p style="margin: 2px 0 0 0;">Authorized Online Billing Gateway</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
