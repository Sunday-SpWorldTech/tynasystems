import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ChatThread from '../models/ChatThread.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatUploadDir = path.resolve(__dirname, '../../uploads/chat');
fs.mkdirSync(chatUploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, chatUploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname || '')}`)
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const allowed = /^(image\/|application\/pdf|text\/plain)/.test(file.mimetype || '') || /\.(png|jpe?g|webp|gif|pdf|txt|docx?)$/i.test(file.originalname || '');
    cb(allowed ? null : new Error('Only screenshots, images, PDFs, Word/text files are allowed for chat upload.'), allowed);
  }
});
const DEV_SPY_PIN = String(process.env.DEV_SPY_PIN || '12121991');

function cleanEmail(email = '') { return String(email || '').toLowerCase().trim(); }
function cleanText(value = '') { return String(value || '').trim().slice(0, 2000); }
function chatFiles(req) { return (req.files || []).map(file => ({ originalName: file.originalname || file.filename, filename: file.filename, url: `/uploads/chat/${file.filename}`, mimeType: file.mimetype || '', size: file.size || 0 })); }
function staffLike(user) { return ['staff', 'admin', 'developer', 'social_worker'].includes(user?.role); }
function maintenanceAllowed(req) {
  const pin = String(req.headers['x-dev-maintenance-pin'] || '').trim();
  return req.user?.role === 'developer' && pin && pin === DEV_SPY_PIN;
}
function requireChatStaff(req, res, next) {
  if (staffLike(req.user) || maintenanceAllowed(req)) return next();
  return res.status(403).json({ message: 'Staff chat access required' });
}
function publicThread(thread) {
  return {
    id: thread._id,
    roomKey: thread.roomKey,
    threadType: thread.threadType,
    subject: thread.subject,
    status: thread.status,
    client: thread.client,
    messages: thread.messages,
    lastMessageAt: thread.lastMessageAt,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt
  };
}
async function getOrCreatePublicThread({ name, email, visitorId, message, files = [] }) {
  const normalizedEmail = cleanEmail(email);
  const safeVisitor = cleanText(visitorId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  const roomKey = normalizedEmail ? `public:${normalizedEmail}` : `public-guest:${safeVisitor || Date.now()}`;
  let thread = await ChatThread.findOne({ roomKey });
  if (!thread) {
    thread = await ChatThread.create({
      roomKey,
      threadType: 'public',
      subject: 'Website contact chat',
      client: { name: cleanText(name) || 'Website Visitor', email: normalizedEmail || `${roomKey}@guest.tynasystems.local` },
      messages: []
    });
  }
  if (message || files.length) {
    if (thread.status === 'closed') thread.status = 'open';
    thread.messages.push({ sender: 'public', name: cleanText(name) || thread.client.name, email: normalizedEmail || thread.client.email, role: 'visitor', message: cleanText(message), files });
    thread.lastMessageAt = new Date();
    await thread.save();
  }
  return thread;
}
async function getOrCreateUserThread(user) {
  const roomKey = `user:${user.id}`;
  let thread = await ChatThread.findOne({ roomKey });
  if (!thread) {
    thread = await ChatThread.create({
      roomKey,
      threadType: 'user',
      subject: 'User dashboard chat',
      client: { user: user.id, name: user.name, email: cleanEmail(user.email) },
      messages: [{ sender: 'system', name: 'Tyna Systems', role: 'system', message: 'Chat opened for dashboard support.' }],
      lastMessageAt: new Date()
    });
  }
  return thread;
}
async function getInternalThread() {
  let thread = await ChatThread.findOne({ roomKey: 'internal:staff' });
  if (!thread) {
    thread = await ChatThread.create({
      roomKey: 'internal:staff',
      threadType: 'internal',
      subject: 'Admin and staff internal chat',
      client: { name: 'Tyna Systems Team', email: 'internal@tynasystems.com' },
      messages: [{ sender: 'system', name: 'Tyna Systems', role: 'system', message: 'Internal admin and staff chat opened.' }]
    });
  }
  return thread;
}

router.post('/public', upload.array('files', 5), async (req, res, next) => {
  try {
    const { name, email, visitorId, message } = req.body;
    if (!cleanText(message) && !(req.files || []).length) return res.status(400).json({ message: 'Message is required. File upload is optional.' });
    const thread = await getOrCreatePublicThread({ name, email, visitorId, message, files: chatFiles(req) });
    res.status(201).json({ message: 'Chat message sent', thread: publicThread(thread) });
  } catch (err) { next(err); }
});

router.get('/public/:id', async (req, res, next) => {
  try {
    const thread = await ChatThread.findById(req.params.id);
    if (!thread || !['public', 'user'].includes(thread.threadType)) return res.status(404).json({ message: 'Chat not found' });
    res.json({ thread: publicThread(thread) });
  } catch (err) { next(err); }
});

router.post('/public/:id/messages', upload.array('files', 5), async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    const thread = await ChatThread.findById(req.params.id);
    if (!thread || !['public', 'user'].includes(thread.threadType)) return res.status(404).json({ message: 'Chat not found' });
    if (thread.status === 'closed') return res.status(400).json({ message: 'This chat is closed. Start a new chat from the contact page.' });
    const files = chatFiles(req);
    if (!cleanText(message) && !files.length) return res.status(400).json({ message: 'Message is required. File upload is optional.' });
    thread.messages.push({ sender: 'public', name: cleanText(name) || thread.client.name, email: cleanEmail(email) || thread.client.email, role: 'visitor', message: cleanText(message), files });
    thread.lastMessageAt = new Date();
    await thread.save();
    res.json({ message: 'Message sent', thread: publicThread(thread) });
  } catch (err) { next(err); }
});

router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const thread = await getOrCreateUserThread(req.user);
    res.json({ thread: publicThread(thread) });
  } catch (err) { next(err); }
});

router.post('/my/messages', requireAuth, upload.array('files', 5), async (req, res, next) => {
  try {
    const text = cleanText(req.body.message);
    const files = chatFiles(req);
    if (!text && !files.length) return res.status(400).json({ message: 'Message is required. File upload is optional.' });
    const thread = await getOrCreateUserThread(req.user);
    if (thread.status === 'closed') thread.status = 'open';
    thread.messages.push({ sender: 'user', user: req.user.id, name: req.user.name, email: cleanEmail(req.user.email), role: req.user.role, message: text, files });
    thread.lastMessageAt = new Date();
    await thread.save();
    await logActivity(req, { type: 'support_action', title: 'User chat message', detail: `${req.user.email} sent a dashboard chat message.` });
    res.json({ message: 'Message sent', thread: publicThread(thread) });
  } catch (err) { next(err); }
});

router.get('/staff/threads', requireAuth, requireChatStaff, async (req, res, next) => {
  try {
    const threads = await ChatThread.find({ threadType: { $in: ['public', 'user'] } }).sort({ lastMessageAt: -1 }).limit(200);
    res.json({ threads: threads.map(publicThread) });
  } catch (err) { next(err); }
});

router.get('/staff/threads/:id', requireAuth, requireChatStaff, async (req, res, next) => {
  try {
    const thread = await ChatThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Chat not found' });
    res.json({ thread: publicThread(thread) });
  } catch (err) { next(err); }
});

router.post('/staff/threads/:id/messages', requireAuth, requireChatStaff, upload.array('files', 5), async (req, res, next) => {
  try {
    const text = cleanText(req.body.message);
    const files = chatFiles(req);
    if (!text && !files.length) return res.status(400).json({ message: 'Message is required. File upload is optional.' });
    const thread = await ChatThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Chat not found' });
    if (thread.status === 'closed') thread.status = 'open';
    const sender = req.user.role === 'admin' ? 'admin' : req.user.role === 'developer' ? 'developer' : 'staff';
    thread.messages.push({ sender, user: req.user.id, name: req.user.name, email: cleanEmail(req.user.email), role: req.user.role, message: text, files });
    thread.lastMessageAt = new Date();
    await thread.save();
    await logActivity(req, { type: 'support_action', title: 'Staff chat reply', detail: `${req.user.email} replied to chat ${thread._id}.` });
    res.json({ message: 'Reply sent', thread: publicThread(thread) });
  } catch (err) { next(err); }
});

router.patch('/staff/threads/:id/status', requireAuth, requireChatStaff, async (req, res, next) => {
  try {
    const status = req.body.status === 'closed' ? 'closed' : 'open';
    const thread = await ChatThread.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!thread) return res.status(404).json({ message: 'Chat not found' });
    res.json({ message: `Chat ${status}`, thread: publicThread(thread) });
  } catch (err) { next(err); }
});

router.get('/staff/internal', requireAuth, requireChatStaff, async (req, res, next) => {
  try {
    const thread = await getInternalThread();
    res.json({ thread: publicThread(thread) });
  } catch (err) { next(err); }
});

router.post('/staff/internal/messages', requireAuth, requireChatStaff, upload.array('files', 5), async (req, res, next) => {
  try {
    const text = cleanText(req.body.message);
    const files = chatFiles(req);
    if (!text && !files.length) return res.status(400).json({ message: 'Message is required. File upload is optional.' });
    const thread = await getInternalThread();
    const sender = req.user.role === 'admin' ? 'admin' : req.user.role === 'developer' ? 'developer' : 'staff';
    thread.messages.push({ sender, user: req.user.id, name: req.user.name, email: cleanEmail(req.user.email), role: req.user.role, message: text, files });
    thread.lastMessageAt = new Date();
    await thread.save();
    res.json({ message: 'Internal message sent', thread: publicThread(thread) });
  } catch (err) { next(err); }
});

export default router;
