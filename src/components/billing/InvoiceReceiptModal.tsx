'use client';

import React from 'react';
import { OrderRecord } from '@/types';
import { Button } from '@/components/ui/Button';
import { X, CheckCircle, Printer, Download, CreditCard, ShieldCheck } from 'lucide-react';

interface InvoiceReceiptModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceReceiptModal({ order, isOpen, onClose }: InvoiceReceiptModalProps) {
  if (!isOpen || !order) return null;

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50/50 dark:bg-neutral-950/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest uppercase font-mono text-neutral-500 dark:text-neutral-400">
                Docdril Softwares
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Paid
              </span>
            </div>
            <h3 className="text-2xl font-bold font-sans text-neutral-950 dark:text-white">
              ₹{order.amount.toFixed(2)} INR
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Invoice #{order.receiptNumber} &bull; {dateFormatted}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                Billed To
              </span>
              <p className="font-semibold text-neutral-900 dark:text-white truncate">
                {order.userEmail}
              </p>
            </div>
            <div>
              <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                Payment Channel
              </span>
              <p className="font-semibold text-neutral-900 dark:text-white truncate">
                {paymentMethodLabel}
              </p>
            </div>
            <div>
              <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                Transaction ID
              </span>
              <p className="font-mono text-neutral-700 dark:text-neutral-300 truncate text-[11px]">
                {order.razorpayPaymentId || order.razorpayOrderId}
              </p>
            </div>
            <div>
              <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                Status
              </span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                Settled & Verified
              </p>
            </div>
          </div>

          {/* Itemized Breakdown */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50/60 dark:bg-neutral-950/30 space-y-3">
            <div className="flex items-center justify-between text-xs font-sans">
              <div>
                <p className="font-bold text-neutral-900 dark:text-white">
                  {order.itemName}
                </p>
                {order.creditsAdded ? (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    +{order.creditsAdded} Generation Credits added to account
                  </p>
                ) : null}
              </div>
              <p className="font-mono font-bold text-neutral-950 dark:text-white text-sm">
                ₹{order.amount.toFixed(2)}
              </p>
            </div>

            {order.eliteDiscountAmount ? (
              <div className="flex items-center justify-between text-xs font-sans text-amber-600 dark:text-amber-400 font-semibold">
                <span>👑 Elite Members Discount (10%)</span>
                <span className="font-mono">-₹{order.eliteDiscountAmount.toFixed(2)}</span>
              </div>
            ) : null}

            <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-xs font-sans">
              <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Total Charged
              </span>
              <span className="font-mono font-extrabold text-base text-neutral-950 dark:text-white">
                ₹{order.amount.toFixed(2)} INR
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Securely processed and verified.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
