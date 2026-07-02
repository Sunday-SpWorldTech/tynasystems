import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import Contact from '../models/Contact.js';
import SupportTicket from '../models/SupportTicket.js';
import Activity from '../models/Activity.js';
import Withdrawal from '../models/Withdrawal.js';
import WalletTransaction from '../models/WalletTransaction.js';
import DeveloperRequest from '../models/DeveloperRequest.js';
import { logActivity } from '../utils/activity.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { COMPANY_BANK_NAME, COMPANY_ACCOUNT_NUMBER, COMPANY_ACCOUNT_NAME, PLATFORM_CURRENCY, paystackFeeMajor, moneyRound } from '../utils/finance.js';

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

router.use(requireAuth, requireStaff);

function publicWithdrawal(withdrawal) {
  const item = withdrawal?.toObject ? withdrawal.toObject() : { ...(withdrawal || {}) };
  delete item.bankName;
  delete item.accountNumber;
  delete item.accountName;
  return item;
}

async function buildWallet() {
  const [companyCredits, withdrawals, paidOrders] = await Promise.all([
    WalletTransaction.find({ walletType: 'company' }).sort({ createdAt: -1 }).limit(1000),
    Withdrawal.find({ walletType: 'company' }).populate('staff', 'name email').sort({ createdAt: -1 }).limit(100),
    Order.find({ status: 'paid' }).sort({ createdAt: -1 }).limit(1000)
  ]);
  const gross = moneyRound(companyCredits.reduce((sum, tx) => sum + Number(tx.amount || 0), 0));
  const fee = moneyRound(paidOrders.reduce((sum, order) => sum + paystackFeeMajor(order), 0));
  const completedWithdrawals = moneyRound(withdrawals.filter(w => w.status === 'completed' || w.status === 'approved').reduce((sum, w) => sum + Number(w.amount || 0), 0));
  const pendingWithdrawals = moneyRound(withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount || 0), 0));
  const available = Math.max(0, moneyRound(gross - fee - completedWithdrawals - pendingWithdrawals));
  return { currency: PLATFORM_CURRENCY, grossUSD: gross, feeUSD: fee, completedWithdrawalsUSD: completedWithdrawals, pendingWithdrawalsUSD: pendingWithdrawals, availableUSD: available, paidOrders: paidOrders.length, withdrawals: withdrawals.map(publicWithdrawal) };
}


router.get('/overview', async (req, res, next) => {
  try {
    const [users, products, paidOrders, bookings, contacts, tickets, activities] = await Promise.all([
      User.countDocuments(), Product.countDocuments({ isActive: true }), Order.countDocuments({ status: 'paid' }),
      Booking.countDocuments(), Contact.countDocuments(), SupportTicket.countDocuments({ status: { $ne: 'resolved' } }), Activity.countDocuments()
    ]);
    const revenue = await Order.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: '$currency', total: { $sum: '$amount' } } }]);
    const revenueTotal = revenue.find(r => r._id === PLATFORM_CURRENCY)?.total || revenue[0]?.total || 0;
    res.json({ stats: { users, products, paidOrders, bookings, contacts, openTickets: tickets, revenue: revenueTotal, revenueCurrency: PLATFORM_CURRENCY, revenueNGN: revenueTotal, activities } });
  } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) { next(err); }
});

router.post('/users', async (req, res, next) => {
  try {
    const { name, email, password, role, company, workerRole } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase().trim(), passwordHash, role: role || 'client', company, workerRole: workerRole || 'general' });
    await logActivity(req, { type: 'staff_action', user: user._id, name: user.name, email: user.email, title: 'Staff created user', detail: `${req.currentUser.name} created ${user.email}.` });
    res.status(201).json({ message: 'User created', user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
  } catch (err) { next(err); }
});


router.patch('/users/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'company', 'phone', 'status', 'role', 'workerRole'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.role && !['client', 'staff', 'admin', 'developer', 'social_worker'].includes(updates.role)) return res.status(400).json({ message: 'Invalid role' });
    if (updates.workerRole && !['founder_advancement', 'operations_systems_manager', 'chartered_accountant', 'client_relationship_manager', 'general'].includes(updates.workerRole)) return res.status(400).json({ message: 'Invalid social worker role' });
    if (updates.status && !['active', 'blocked'].includes(updates.status)) return res.status(400).json({ message: 'Invalid user status' });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logActivity(req, { type: 'staff_action', user: user._id, name: user.name, email: user.email, title: 'User profile updated', detail: `${req.currentUser.name} updated ${user.email}.` });
    res.json({ message: 'User updated', user });
  } catch (err) { next(err); }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'blocked'].includes(status)) return res.status(400).json({ message: 'Invalid user status' });
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logActivity(req, { type: 'staff_action', user: user._id, name: user.name, email: user.email, title: `User ${status}`, detail: `${req.currentUser.name} changed ${user.email} to ${status}.` });
    res.json({ message: `User ${status}`, user });
  } catch (err) { next(err); }
});

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['client', 'staff', 'admin', 'developer', 'social_worker'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logActivity(req, { type: 'staff_action', user: user._id, name: user.name, email: user.email, title: 'User role updated', detail: `${req.currentUser.name} changed ${user.email} role to ${role}.` });
    res.json({ message: 'User role updated', user });
  } catch (err) { next(err); }
});

router.get('/activities', async (req, res, next) => {
  try {
    const activities = await Activity.find().populate('user', 'name email role status').sort({ createdAt: -1 }).limit(250);
    res.json({ activities });
  } catch (err) { next(err); }
});


router.get('/developer-requests', async (req, res, next) => {
  try {
    const requests = await DeveloperRequest.find().sort({ lastMessageAt: -1, createdAt: -1 }).limit(300);
    res.json({ requests });
  } catch (err) { next(err); }
});

router.get('/orders', async (req, res, next) => {
  try {
    const orders = await Order.find().populate('product').populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ orders: orders.map(publicOrder) });
  } catch (err) { next(err); }
});

router.get('/bookings', async (req, res, next) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) { next(err); }
});

router.get('/contacts', async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ contacts });
  } catch (err) { next(err); }
});

router.get('/wallet', async (req, res, next) => {
  try {
    const wallet = await buildWallet();
    res.json({ wallet });
  } catch (err) { next(err); }
});

router.get('/withdrawals', async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find({ walletType: 'company' }).populate('staff', 'name email').sort({ createdAt: -1 });
    res.json({ withdrawals: withdrawals.map(publicWithdrawal) });
  } catch (err) { next(err); }
});

router.post('/withdrawals', async (req, res, next) => {
  try {
    const { amount, notes } = req.body;
    const bankName = COMPANY_BANK_NAME;
    const accountNumber = COMPANY_ACCOUNT_NUMBER;
    const accountName = COMPANY_ACCOUNT_NAME;
    const amountUSD = Number(amount);
    if (!amountUSD || amountUSD <= 0 || !bankName || !accountName) {
      return res.status(400).json({ message: 'Company payout service is not ready. Please check the secure server environment settings.' });
    }
    const wallet = await buildWallet();
    if (amountUSD > wallet.availableUSD) {
      return res.status(400).json({ message: `Insufficient wallet balance. Available balance is $${wallet.availableUSD.toFixed(2)}.` });
    }
    const withdrawal = await Withdrawal.create({
      staff: req.currentUser._id,
      walletType: 'company',
      amount: amountUSD,
      currency: PLATFORM_CURRENCY,
      bankName,
      accountNumber,
      accountName,
      notes
    });
    await logActivity(req, {
      type: 'withdrawal_request',
      title: 'Wallet withdrawal requested',
      detail: `${req.currentUser.name} requested company wallet withdrawal of ${PLATFORM_CURRENCY} ${amountUSD.toFixed(2)} to the secured company payout account.`
    });
    res.status(201).json({ message: 'Wallet withdrawal request submitted', withdrawal });
  } catch (err) { next(err); }
});

router.patch('/withdrawals/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const withdrawal = await Withdrawal.findByIdAndUpdate(req.params.id, { 
      status,
      processedBy: req.currentUser._id,
      processedAt: new Date()
    }, { new: true });
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    await logActivity(req, { 
      type: 'staff_action', 
      title: `Withdrawal ${status}`, 
      detail: `${req.currentUser.name} updated withdrawal ${req.params.id} to ${status}.` 
    });
    res.json({ message: `Withdrawal ${status}`, withdrawal });
  } catch (err) { next(err); }
});

export default router;

