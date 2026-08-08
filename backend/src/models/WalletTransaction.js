import mongoose from 'mongoose';

const WalletTransactionSchema = new mongoose.Schema({
  walletType: { type: String, enum: ['company', 'developer'], required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  reference: { type: String, trim: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  type: { type: String, enum: ['credit', 'debit', 'fee', 'withdrawal'], default: 'credit' },
  description: { type: String, required: true, trim: true },
  metadata: { type: Object }
}, { timestamps: true });

WalletTransactionSchema.index({ walletType: 1, reference: 1, description: 1 }, { unique: true, partialFilterExpression: { reference: { $type: 'string' } } });

export default mongoose.model('WalletTransaction', WalletTransactionSchema);
