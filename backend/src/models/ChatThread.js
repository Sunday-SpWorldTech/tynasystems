import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'staff', 'admin', 'developer', 'system', 'public'], default: 'user' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, trim: true, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '' },
  role: { type: String, trim: true, default: '' },
  message: { type: String, trim: true, default: '' },
  files: [{
    originalName: { type: String, trim: true, default: '' },
    filename: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 }
  }],
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const ChatThreadSchema = new mongoose.Schema({
  roomKey: { type: String, required: true, unique: true, index: true },
  threadType: { type: String, enum: ['public', 'user', 'internal'], default: 'public' },
  subject: { type: String, trim: true, default: 'Support chat' },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  client: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' }
  },
  messages: [ChatMessageSchema],
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('ChatThread', ChatThreadSchema);
