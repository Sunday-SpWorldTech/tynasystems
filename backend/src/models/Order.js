import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, trim: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productSlug: { type: String, required: true, trim: true },
  projectCategory: { type: String, trim: true },
  projectType: { type: String, trim: true },
  projectTitle: { type: String, trim: true },
  notes: { type: String, trim: true },
  amount: { type: Number, required: true },
  baseAmount: { type: Number, default: 0 },
  customerChargeAmount: { type: Number, default: 0 },
  estimatedPaystackFee: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  systemsPaymentChargeAmount: { type: Number, default: 0 },
  companyAmount: { type: Number, default: 0 },
  systemsPaymentChargeDescription: { type: String, default: 'Systems Payment Charge' },
  reference: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paystackData: { type: Object }
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);

