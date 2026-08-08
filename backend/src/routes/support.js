import express from 'express';
import SupportTicket from '../models/SupportTicket.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { subject, message, priority } = req.body;
    if (!subject || !message) return res.status(400).json({ message: 'Subject and message are required' });
    const ticket = await SupportTicket.create({
      user: req.user.id,
      name: req.user.name,
      email: req.user.email,
      subject,
      message,
      priority: priority || 'normal'
    });
    await logActivity(req, { type: 'support_action', title: subject, detail: `Support ticket created with ${priority || 'normal'} priority.` });
    res.status(201).json({ message: 'Support ticket sent to staff', ticket });
  } catch (err) { next(err); }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (err) { next(err); }
});

router.get('/', requireAuth, requireStaff, async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find().populate('user', 'name email status').sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (err) { next(err); }
});

router.put('/:id', requireAuth, requireStaff, async (req, res, next) => {
  try {
    const { status, adminReply, priority } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status, adminReply, priority }, { new: true, runValidators: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    await logActivity(req, { type: 'staff_action', title: 'Support ticket updated', detail: `Ticket ${ticket.subject} was updated by staff.` });
    res.json({ message: 'Ticket updated', ticket });
  } catch (err) { next(err); }
});

export default router;

