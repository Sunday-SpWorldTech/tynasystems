import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  subtitle: { type: String, default: '', trim: true },
  description: { type: String, trim: true },
  category: { type: String, default: 'Backend OS', trim: true },
  priceUSD: { type: Number, required: true, min: 0 },
  priceNGN: { type: Number, required: true, min: 0 },
  deliveryType: { type: String, enum: ['digital', 'service'], default: 'digital' },
  downloadUrl: { type: String, trim: true },
  fileUrl: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  youtubeUrl: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ProductSchema.index({ slug: 1 }, { unique: true });

export default mongoose.model('Product', ProductSchema);
