import express from 'express';
import Activity from '../models/Activity.js';
import Contact from '../models/Contact.js';
import SupportTicket from '../models/SupportTicket.js';
import Booking from '../models/Booking.js';
import DeveloperRequest from '../models/DeveloperRequest.js';
import { requireAuth, requireSocialWorker } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();
router.use(requireAuth, requireSocialWorker);

function roleLabel(role = 'general') {
  return {
    founder_advancement: 'Founder & Advancement',
    operations_systems_manager: 'Operations Systems Manager',
    chartered_accountant: 'Chartered Accountant',
    client_relationship_manager: 'Client Relationship Manager',
    general: 'Social Worker'
  }[role] || 'Social Worker';
}

router.get('/overview', async (req, res, next) => {
  try {
    const [contacts, tickets, bookings, developerRequests, activities] = await Promise.all([
      Contact.countDocuments(),
      SupportTicket.countDocuments({ status: { $ne: 'resolved' } }),
      Booking.countDocuments(),
      DeveloperRequest.countDocuments(),
      Activity.countDocuments({ type: { $in: ['contact_submission', 'support_action', 'developer_request', 'developer_message', 'registration', 'login'] } })
    ]);
    res.json({
      worker: { name: req.currentUser.name, email: req.currentUser.email, workerRole: req.currentUser.workerRole, roleLabel: roleLabel(req.currentUser.workerRole) },
      stats: { contacts, openTickets: tickets, bookings, developerRequests, activities }
    });
  } catch (err) { next(err); }
});

router.get('/activities', async (req, res, next) => {
  try {
    const activities = await Activity.find({ type: { $in: ['contact_submission', 'support_action', 'developer_request', 'developer_message', 'registration', 'login', 'social_worker_action'] } })
      .populate('user', 'name email role status workerRole')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ activities });
  } catch (err) { next(err); }
});

router.get('/contacts', async (req, res, next) => {
  try { res.json({ contacts: await Contact.find().sort({ createdAt: -1 }).limit(200) }); } catch (err) { next(err); }
});

router.get('/tickets', async (req, res, next) => {
  try { res.json({ tickets: await SupportTicket.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(200) }); } catch (err) { next(err); }
});

router.get('/developer-requests', async (req, res, next) => {
  try { res.json({ requests: await DeveloperRequest.find().sort({ lastMessageAt: -1, createdAt: -1 }).limit(200) }); } catch (err) { next(err); }
});

router.post('/note', async (req, res, next) => {
  try {
    const { title, detail } = req.body;
    if (!title || !detail) return res.status(400).json({ message: 'Title and note are required.' });
    await logActivity(req, { type: 'social_worker_action', title, detail, name: req.currentUser.name, email: req.currentUser.email, metadata: { workerRole: req.currentUser.workerRole } });
    res.status(201).json({ message: 'Social worker note saved for staff and developer visibility.' });
  } catch (err) { next(err); }
});

export default router;

