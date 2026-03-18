// models/userModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: { type: String, required: true, select: false },

    role: { type: String, required: false, default: 'client' },
    isAdmin: { type: Boolean, default: false, required: true },
    avatarUrl: { type: String },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    requestedRole: {
      type: String,
      default: null,
    },
    roleRequestStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    roleRequestedAt: { type: Date },
    roleReviewedAt: { type: Date },
    roleReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Hashear password al crear / modificar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('user', userSchema);
export default User;
