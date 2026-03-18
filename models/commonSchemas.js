import mongoose from 'mongoose';

export const serviceLineSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['full_service', 'part', 'labor', 'other'], default: 'full_service' },
    sku: { type: String, default: '' },
    description: { type: String, required: true },
    qty: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 }, // %
    subtotal: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

export function recalcTotals(doc) {
  const lines = doc.items || [];
  let subtotal = 0;
  let tax = 0;
  for (const l of lines) {
    l.subtotal = +(l.qty * l.unitPrice).toFixed(2);
    l.taxAmount = +((l.subtotal * (l.taxRate || 0)) / 100).toFixed(2);
    l.total = +(l.subtotal + l.taxAmount).toFixed(2);
    subtotal += l.subtotal;
    tax += l.taxAmount;
  }
  const discount = doc.discount || 0;
  const total = Math.max(0, subtotal + tax - discount);
  doc.summary = {
    currency: doc.summary?.currency || 'UYU',
    subtotal: +subtotal.toFixed(2),
    tax: +tax.toFixed(2),
    discount: +discount.toFixed(2),
    total: +total.toFixed(2),
  };
}
