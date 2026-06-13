import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, trim: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productSlug: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  reference: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paystackData: { type: Object }
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);
