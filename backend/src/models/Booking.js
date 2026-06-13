import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  company: { type: String, required: true, trim: true },
  businessType: { type: String, trim: true },
  message: { type: String, trim: true },
  status: { type: String, enum: ['new', 'contacted', 'booked', 'closed'], default: 'new' }
}, { timestamps: true });

export default mongoose.model('Booking', BookingSchema);
