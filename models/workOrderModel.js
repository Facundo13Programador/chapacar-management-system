// models/workOrderModel.js
import mongoose from 'mongoose';

const workOrderTaskSchema = new mongoose.Schema(
  {
    description: { type: String, trim: true, default: '' },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const workOrderItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['product', 'labor', 'other'], default: 'product' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    productSku: String,
    productImage: String,
    description: String,
    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const workOrderSchema = new mongoose.Schema(
  {
    number: { type: Number, index: true },
    budget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget',
      required: true,
      index: true,
    },
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'reservation' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    notes: { type: String },
    items: [workOrderItemSchema],
    tasks: [workOrderTaskSchema],
  },
  { timestamps: true }
);

const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);
export default WorkOrder;
