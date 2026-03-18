// models/vehicleModel.js
import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',            
      required: true,
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'brand',             
      required: true,
      index: true,
    },
    model: { type: String, required: true },  
    year: { type: Number },                 

    licensePlate: { type: String, index: true }, 
    vin: { type: String, index: true },         

    engine: { type: String },                   
    fuelType: {
      type: String,
      enum: ['nafta', 'diesel', 'híbrido', 'eléctrico', 'otro'],
      default: 'nafta',
    },
    color: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
