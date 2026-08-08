import mongoose from 'mongoose';

const DevTransferTokenSchema = new mongoose.Schema({
  developer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenId: { type: String, required: true, unique: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  allowedSystem: { type: String, default: 'spworldtech', index: true },
  permissions: { type: [String], default: ['balance:read', 'balance:transfer'] },
  status: { type: String, enum: ['active', 'revoked', 'expired'], default: 'active', index: true },
  expiresAt: { type: Date, required: true, index: true },
  lastUsedAt: { type: Date },
  revokedAt: { type: Date },
  metadata: { type: Object }
}, { timestamps: true });

export default mongoose.model('DevTransferToken', DevTransferTokenSchema);
