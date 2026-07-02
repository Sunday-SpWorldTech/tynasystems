import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import DeveloperRequest from '../models/DeveloperRequest.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Withdrawal from '../models/Withdrawal.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { requireAuth, requireDeveloper } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';
import { PLATFORM_CURRENCY, SYSTEMS_PAYMENT_CHARGE_DESCRIPTION, moneyRound } from '../utils/finance.js';

const router = express.Router();

function publicOrder(order) {
  const data = order?.toObject ? order.toObject() : { ...(order || {}) };
  delete data.systemsPaymentChargeAmount;
  delete data.systemsPaymentChargeDescription;
  delete data.companyAmount;
  if (data.metadata) {
    delete data.metadata.systemsPaymentChargeAmount;
    delete data.metadata.companyAmount;
    delete data.metadata.percent;
  }
  return data;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads/developer');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeOriginal}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.DEVELOPER_UPLOAD_LIMIT_MB || 500) * 1024 * 1024,
    files: 12
  }
});

function publicFile(file) {
  return {
    originalName: file.originalname,
    filename: file.filename,
    url: `/uploads/developer/${file.filename}`,
    mimeType: file.mimetype,
    size: file.size
  };
}


async function buildDeveloperWallet() {
  const [credits, withdrawals] = await Promise.all([
    WalletTransaction.find({ walletType: 'developer' }).sort({ createdAt: -1 }).limit(1000),
    Withdrawal.find({ walletType: 'developer' }).populate('staff', 'name email').sort({ createdAt: -1 }).limit(100)
  ]);
  const gross = moneyRound(credits.reduce((sum, tx) => sum + Number(tx.amount || 0), 0));
  const completedWithdrawals = moneyRound(withdrawals.filter(w => w.status === 'completed' || w.status === 'approved').reduce((sum, w) => sum + Number(w.amount || 0), 0));
  const pendingWithdrawals = moneyRound(withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount || 0), 0));
  const available = Math.max(0, moneyRound(gross - completedWithdrawals - pendingWithdrawals));
  return { currency: PLATFORM_CURRENCY, description: 'Developer private wallet', grossUSD: gross, completedWithdrawalsUSD: completedWithdrawals, pendingWithdrawalsUSD: pendingWithdrawals, availableUSD: available, transactions: credits, withdrawals };
}


function publicWallet(wallet) {
  return {
    ...wallet,
    description: 'Developer private wallet',
    transactions: (wallet.transactions || []).map(tx => ({
      ...(tx?.toObject ? tx.toObject() : tx),
      description: tx?.metadata?.source === 'systems_payment_charge' ? 'Developer private wallet credit' : tx.description
    }))
  };
}

function publicRequest(request) {
  return {
    id: request._id,
    studentName: request.studentName,
    studentEmail: request.studentEmail,
    studentPhone: request.studentPhone,
    serviceType: request.serviceType,
    title: request.title,
    description: request.description,
    status: request.status,
    priority: request.priority,
    messages: request.messages,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    lastMessageAt: request.lastMessageAt
  };
}

router.post('/requests', upload.array('files', 12), async (req, res, next) => {
  try {
    const { studentName, studentEmail, studentPhone, serviceType, title, description, priority } = req.body;
    if (!studentName || !studentEmail || !title) {
      return res.status(400).json({ message: 'Name, email and project title are required.' });
    }

    const files = (req.files || []).map(publicFile);
    const request = await DeveloperRequest.create({
      studentName,
      studentEmail: studentEmail.toLowerCase().trim(),
      studentPhone,
      serviceType,
      title,
      description,
      priority: priority || 'normal',
      messages: [{ sender: 'student', name: studentName, message: description || title, files }],
      lastMessageAt: new Date()
    });

    await logActivity(req, {
      type: 'developer_request',
      name: studentName,
      email: studentEmail,
      title: 'New BYU developer request',
      detail: `${studentName} requested ${serviceType || 'developer work'}: ${title}.`,
      metadata: { requestId: String(request._id), files: files.length }
    });

    res.status(201).json({ message: 'Request sent to the developer dashboard.', request: publicRequest(request) });
  } catch (err) { next(err); }
});

router.get('/requests/:id', async (req, res, next) => {
  try {
    const request = await DeveloperRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Developer request not found.' });
    res.json({ request: publicRequest(request) });
  } catch (err) { next(err); }
});

router.post('/requests/:id/messages', upload.array('files', 12), async (req, res, next) => {
  try {
    const { studentName, message } = req.body;
    const files = (req.files || []).map(publicFile);
    if (!message && !files.length) return res.status(400).json({ message: 'Type a message or attach a file.' });
    const request = await DeveloperRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Developer request not found.' });
    request.messages.push({ sender: 'student', name: studentName || request.studentName, message, files });
    request.lastMessageAt = new Date();
    await request.save();
    await logActivity(req, {
      type: 'developer_message',
      name: studentName || request.studentName,
      email: request.studentEmail,
      title: 'Student replied to developer chat',
      detail: request.title,
      metadata: { requestId: String(request._id), files: files.length }
    });
    res.status(201).json({ message: 'Message sent.', request: publicRequest(request) });
  } catch (err) { next(err); }
});

router.use('/dashboard', requireAuth, requireDeveloper);

router.get('/dashboard/overview', async (req, res, next) => {
  try {
    const [total, fresh, inProgress, completed] = await Promise.all([
      DeveloperRequest.countDocuments(),
      DeveloperRequest.countDocuments({ status: 'new' }),
      DeveloperRequest.countDocuments({ status: 'in_progress' }),
      DeveloperRequest.countDocuments({ status: 'completed' })
    ]);
    res.json({ stats: { total, fresh, inProgress, completed } });
  } catch (err) { next(err); }
});


router.get('/dashboard/activities', async (req, res, next) => {
  try {
    const activities = await Activity.find({ type: { $in: ['developer_request', 'developer_message', 'developer_action', 'maintenance_mode', 'social_worker_action'] } }).sort({ createdAt: -1 }).limit(250);
    res.json({ activities });
  } catch (err) { next(err); }
});


router.get('/dashboard/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(500);
    res.json({ users });
  } catch (err) { next(err); }
});

router.patch('/dashboard/users/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'company', 'phone', 'status', 'role', 'workerRole'];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (updates.role && !['client', 'staff', 'admin', 'developer', 'social_worker'].includes(updates.role)) return res.status(400).json({ message: 'Invalid role' });
    if (updates.status && !['active', 'blocked'].includes(updates.status)) return res.status(400).json({ message: 'Invalid user status' });
    if (updates.workerRole && !['founder_advancement', 'operations_systems_manager', 'chartered_accountant', 'client_relationship_manager', 'general'].includes(updates.workerRole)) return res.status(400).json({ message: 'Invalid social worker role' });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logActivity(req, { type: 'developer_action', user: user._id, name: user.name, email: user.email, title: 'Developer updated user', detail: `${req.currentUser.name} updated ${user.email}.` });
    res.json({ message: 'User updated by developer.', user });
  } catch (err) { next(err); }
});


router.get('/dashboard/wallet', async (req, res, next) => {
  try {
    const wallet = await buildDeveloperWallet();
    res.json({ wallet: publicWallet(wallet) });
  } catch (err) { next(err); }
});

router.get('/dashboard/withdrawals', async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find({ walletType: 'developer' }).populate('staff', 'name email').sort({ createdAt: -1 }).limit(200);
    res.json({ withdrawals });
  } catch (err) { next(err); }
});

router.post('/dashboard/withdrawals', async (req, res, next) => {
  try {
    const { amount, bankName, accountNumber, accountName, notes } = req.body;
    const amountUSD = Number(amount);
    if (!amountUSD || amountUSD <= 0 || !bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: 'Amount and full bank account details are required.' });
    }
    const wallet = await buildDeveloperWallet();
    if (amountUSD > wallet.availableUSD) {
      return res.status(400).json({ message: `Insufficient developer wallet balance. Available balance is ${PLATFORM_CURRENCY} ${wallet.availableUSD.toFixed(2)}.` });
    }
    const withdrawal = await Withdrawal.create({
      staff: req.currentUser._id,
      walletType: 'developer',
      amount: amountUSD,
      currency: PLATFORM_CURRENCY,
      bankName,
      accountNumber,
      accountName,
      notes,
      status: 'approved',
      processedBy: req.currentUser._id,
      processedAt: new Date()
    });
    await logActivity(req, { type: 'developer_action', title: 'Developer wallet withdrawal authorized', detail: `${req.currentUser.name} authorized a developer wallet withdrawal of ${PLATFORM_CURRENCY} ${amountUSD.toFixed(2)}.`, metadata: { walletType: 'developer' } });
    res.status(201).json({ message: 'Developer wallet withdrawal authorized.', withdrawal });
  } catch (err) { next(err); }
});

router.get('/dashboard/orders', async (req, res, next) => {
  try {
    const orders = await Order.find().populate('product').populate('user', 'name email').sort({ createdAt: -1 }).limit(500);
    res.json({ orders: orders.map(publicOrder) });
  } catch (err) { next(err); }
});

router.get('/dashboard/requests', async (req, res, next) => {
  try {
    const requests = await DeveloperRequest.find().sort({ lastMessageAt: -1, createdAt: -1 }).limit(300);
    res.json({ requests: requests.map(publicRequest) });
  } catch (err) { next(err); }
});

router.patch('/dashboard/requests/:id', async (req, res, next) => {
  try {
    const { status, priority } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    const request = await DeveloperRequest.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!request) return res.status(404).json({ message: 'Developer request not found.' });
    await logActivity(req, { type: 'developer_action', title: 'Developer request updated', detail: `${request.title} updated to ${request.status}.`, metadata: { requestId: String(request._id) } });
    res.json({ message: 'Request updated.', request: publicRequest(request) });
  } catch (err) { next(err); }
});

router.post('/dashboard/requests/:id/reply', upload.array('files', 12), async (req, res, next) => {
  try {
    const { message } = req.body;
    const files = (req.files || []).map(publicFile);
    if (!message && !files.length) return res.status(400).json({ message: 'Type a reply or attach a file.' });
    const request = await DeveloperRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Developer request not found.' });
    request.messages.push({ sender: 'developer', name: req.currentUser.name || 'Sunday Prince Augustine', message, files });
    request.status = request.status === 'new' ? 'in_review' : request.status;
    request.lastMessageAt = new Date();
    await request.save();
    await logActivity(req, { type: 'developer_action', title: 'Developer replied', detail: `Reply sent for ${request.title}.`, metadata: { requestId: String(request._id), files: files.length } });
    res.status(201).json({ message: 'Developer reply sent.', request: publicRequest(request) });
  } catch (err) { next(err); }
});

export default router;

