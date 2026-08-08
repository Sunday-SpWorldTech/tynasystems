import mongoose from 'mongoose';

const UserWalletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reference: { type: String, required: true, unique: true, trim: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  chargedAmount: { type: Number, min: 0 },
  developerAllocationAmount: { type: Number, min: 0, default: 0 },
  developerAllocationPercent: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: 'NGN', uppercase: true, trim: true },
  type: { type: String, enum: ['deposit', 'credit', 'debit'], default: 'deposit' },
  status: { type: String, enum: ['pending', 'successful', 'failed'], default: 'pending', index: true },
  description: { type: String, default: 'Wallet transaction', trim: true },
  metadata: { type: Object, default: {} },
  paystackData: { type: Object, default: {} }
}, { timestamps: true });

UserWalletTransactionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('UserWalletTransaction', UserWalletTransactionSchema);
