import mongoose from 'mongoose';

const CrossPlatformTransferLogSchema = new mongoose.Schema({
  fromSystem: { type: String, default: 'tynasystems', index: true },
  toSystem: { type: String, default: 'spworldtech', index: true },
  developer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  tokenId: { type: String, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending', index: true },
  reference: { type: String, required: true, unique: true, index: true },
  reason: { type: String, default: 'Cross-platform developer wallet forwarding' },
  metadata: { type: Object }
}, { timestamps: true });

export default mongoose.model('CrossPlatformTransferLog', CrossPlatformTransferLogSchema);
