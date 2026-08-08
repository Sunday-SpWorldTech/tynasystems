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
  baseCurrency: { type: String, default: 'USD' },
  displayCurrency: { type: String, default: 'USD' },
  displayAmount: { type: Number, default: 0 },
  paymentCurrency: { type: String, default: 'NGN' },
  paymentAmount: { type: Number, default: 0 },
  exchangeRate: { type: Number, default: 1 },
  exchangeRateTimestamp: { type: Date },
  customerChargeAmount: { type: Number, default: 0 },
  estimatedPaystackFee: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  systemsPaymentChargeAmount: { type: Number, default: 0 },
  companyAmount: { type: Number, default: 0 },
  systemsPaymentChargeDescription: { type: String, default: 'Systems Payment Charge' },
  reference: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'reversed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['paystack', 'wallet', 'manual'], default: 'paystack' },
  paystackData: { type: Object }
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);

