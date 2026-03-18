import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',        
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true }, 
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: 'La orden debe tener al menos un producto',
      },
    },

    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true }, 
    notes: { type: String, trim: true },

    paymentMethod: {
      type: String,
      enum: ['transferencia', 'efectivo'],
      required: true,
    },
    deliveryMethod: {
      type: String,
      enum: ['local', 'envio'],
      required: true,
    },

    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('order', orderSchema);
export default Order;
