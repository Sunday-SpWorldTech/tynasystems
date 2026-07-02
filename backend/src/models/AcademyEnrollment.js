import mongoose from 'mongoose';

const AcademyProgressSchema = new mongoose.Schema({
  courseId: { type: String, required: true },
  completedLessons: { type: Number, default: 0 },
  totalLessons: { type: Number, default: 0 },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const AcademyEnrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, default: '' },
  email: { type: String, required: true, lowercase: true, trim: true },
  accessLevel: { type: String, enum: ['basic', 'advanced', 'premium'], default: 'basic' },
  status: { type: String, enum: ['active', 'paused', 'blocked'], default: 'active' },
  verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' },
  verificationMethod: { type: String, enum: ['none', 'school_email', 'school_id', 'nin', 'national_id', 'passport'], default: 'none' },
  schoolEmail: { type: String, lowercase: true, trim: true, default: '' },
  schoolName: { type: String, default: '' },
  schoolEmailOtpHash: { type: String, default: '' },
  schoolEmailOtpExpiresAt: { type: Date },
  idReferenceLast4: { type: String, default: '' },
  verificationNotes: { type: String, default: '' },
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  premiumSchoolStage: { type: Number, min: 0, max: 3, default: 0 },
  certificateStatus: { type: String, enum: ['not_eligible', 'eligible', 'awarded'], default: 'not_eligible' },
  certificateId: { type: String, default: '' },
  certificateAwardedAt: { type: Date },
  progress: { type: [AcademyProgressSchema], default: [] },
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('AcademyEnrollment', AcademyEnrollmentSchema);
