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
import { logActivity } from '../utils/activity.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth, requireStaff);

router.get('/overview', async (req, res, next) => {
  try {
    const [users, products, paidOrders, bookings, contacts, tickets, activities] = await Promise.all([
      User.countDocuments(), Product.countDocuments({ isActive: true }), Order.countDocuments({ status: 'paid' }),
      Booking.countDocuments(), Contact.countDocuments(), SupportTicket.countDocuments({ status: { $ne: 'resolved' } }), Activity.countDocuments()
    ]);
    const revenue = await Order.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    res.json({ stats: { users, products, paidOrders, bookings, contacts, openTickets: tickets, revenueNGN: revenue[0]?.total || 0, activities } });
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
    const { name, email, password, role, company } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase().trim(), passwordHash, role: role || 'client', company });
    await logActivity(req, { type: 'staff_action', user: user._id, name: user.name, email: user.email, title: 'Staff created user', detail: `${req.currentUser.name} created ${user.email}.` });
    res.status(201).json({ message: 'User created', user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
  } catch (err) { next(err); }
});


router.patch('/users/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'company', 'phone', 'status', 'role'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.role && !['client', 'staff', 'admin'].includes(updates.role)) return res.status(400).json({ message: 'Invalid role' });
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
    if (!['client', 'staff', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
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

router.get('/orders', async (req, res, next) => {
  try {
    const orders = await Order.find().populate('product').populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ orders });
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

router.get('/withdrawals', async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find().populate('staff', 'name email').sort({ createdAt: -1 });
    res.json({ withdrawals });
  } catch (err) { next(err); }
});

router.post('/withdrawals', async (req, res, next) => {
  try {
    const { amount, bankName, accountNumber, accountName, notes } = req.body;
    if (!amount || !bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: 'Missing withdrawal details' });
    }
    const withdrawal = await Withdrawal.create({
      staff: req.currentUser._id,
      amount,
      bankName,
      accountNumber,
      accountName,
      notes
    });
    await logActivity(req, { 
      type: 'withdrawal_request', 
      title: 'Withdrawal requested', 
      detail: `${req.currentUser.name} requested withdrawal of ${amount}.` 
    });
    res.status(201).json({ message: 'Withdrawal request submitted', withdrawal });
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
