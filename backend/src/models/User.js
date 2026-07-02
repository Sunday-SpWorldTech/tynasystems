import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: '' },
  googleId: { type: String, default: '' },
  rolePinHash: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  company: { type: String, default: '', trim: true },
  workerRole: { type: String, enum: ['founder_advancement', 'operations_systems_manager', 'chartered_accountant', 'client_relationship_manager', 'general'], default: 'general' },
  phone: { type: String, default: '', trim: true },
  accountType: { type: String, enum: ['client', 'student', 'business'], default: 'client' },
  schoolEmail: { type: String, default: '', lowercase: true, trim: true },
  schoolName: { type: String, default: '', trim: true },
  studentId: { type: String, default: '', trim: true },
  studentIdNumber: { type: String, default: '', trim: true },
  enrollmentNumber: { type: String, default: '', trim: true },
  department: { type: String, default: '', trim: true },
  level: { type: String, default: '', trim: true },
  businessName: { type: String, default: '', trim: true },
  businessType: { type: String, default: '', trim: true },
  businessAddress: { type: String, default: '', trim: true },
  country: { type: String, default: '', trim: true },
  businessPhone: { type: String, default: '', trim: true },
  serviceNeeded: { type: String, default: '', trim: true },
  businessEmail: { type: String, default: '', lowercase: true, trim: true },
  businessDetails: { type: String, default: '', trim: true },
  identityStatus: { type: String, enum: ['pending', 'verified'], default: 'verified' },
  emailVerified: { type: Boolean, default: true },
  otpVerifiedAt: { type: Date },
  twoFactorSecret: { type: String, default: '' },
  twoFactorEnabled: { type: Boolean, default: false },
  studentReference: { type: String, default: '', trim: true },
  governmentIdReferenceLast4: { type: String, default: '', trim: true },
  role: { type: String, enum: ['client', 'staff', 'admin', 'developer', 'social_worker'], default: 'client' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  lastLoginAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);

