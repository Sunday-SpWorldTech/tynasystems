import mongoose from 'mongoose';

const DeveloperFileSchema = new mongoose.Schema({
  originalName: { type: String, trim: true },
  filename: { type: String, trim: true },
  url: { type: String, trim: true },
  mimeType: { type: String, trim: true },
  size: { type: Number, default: 0 }
}, { _id: false });

const DeveloperMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['student', 'developer'], required: true },
  name: { type: String, trim: true, default: '' },
  message: { type: String, trim: true, default: '' },
  files: [DeveloperFileSchema]
}, { timestamps: true });

const DeveloperRequestSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  studentEmail: { type: String, required: true, lowercase: true, trim: true },
  studentPhone: { type: String, trim: true, default: '' },
  serviceType: { type: String, trim: true, default: 'Tech work' },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['new', 'in_review', 'in_progress', 'completed', 'closed'], default: 'new' },
  priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  messages: [DeveloperMessageSchema],
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

DeveloperRequestSchema.index({ studentEmail: 1, createdAt: -1 });
DeveloperRequestSchema.index({ status: 1, lastMessageAt: -1 });

export default mongoose.model('DeveloperRequest', DeveloperRequestSchema);

