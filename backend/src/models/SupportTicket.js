import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  adminReply: { type: String, default: '', trim: true }
}, { timestamps: true });

export default mongoose.model('SupportTicket', SupportTicketSchema);
