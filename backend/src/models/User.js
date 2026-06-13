import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: '' },
  googleId: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  company: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
  role: { type: String, enum: ['client', 'staff', 'admin'], default: 'client' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  lastLoginAt: { type: Date }
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('User', UserSchema);
