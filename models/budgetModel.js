// models/budgetModel.js
import mongoose from 'mongoose';

const budgetItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['product', 'labor', 'other'],
      default: 'product',
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },

    productName: { type: String },
    productSku: { type: String },
    productImage: { type: String },

    description: { type: String, required: true },

    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    code: { type: String, index: true },

    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'reservation',
      required: false,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    workOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: false,
    },

    status: {
      type: String,
      enum: ['draft', 'sent', 'approved', 'rejected'],
      default: 'draft',
    },

    clientToken: { type: String },
    stockDiscounted: { type: Boolean, default: false },

    approvedAt: { type: Date },
    rejectedAt: { type: Date },

    currency: { type: String, default: 'UYU' },

    notes: { type: String },

    items: {
      type: [budgetItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

budgetSchema.virtual('total').get(function () {
  return (this.items || []).reduce(
    (sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0),
    0
  );
});

budgetSchema.virtual('itemsCount').get(function () {
  return (this.items || []).length;
});

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
