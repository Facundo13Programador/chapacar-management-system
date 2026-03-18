// models/reservationModel.js
import mongoose from 'mongoose';


const reservationSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    serviceType: {
      type: String,
      enum: ['full_service', 'revision'],
      default: 'full_service',
      required: true,
    },
    dateTime: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    workOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },
    budget: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget' },

  },

  { timestamps: true }
);

const Reservation = mongoose.model('reservation', reservationSchema);

export default Reservation;
